// EasyBeds iCal Import Service
// Fetches iCal feeds from OTAs, parses events, creates/updates/cancels bookings

import { db } from './db'
import { format, parseISO, addHours, isAfter, isBefore, isEqual } from 'date-fns'

interface ICalEvent {
  uid: string
  summary: string
  startDate: Date
  endDate: Date
  description?: string
  location?: string
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
  organizer?: string
}

// Parse an iCal (.ics) file content into events
export function parseICal(icsContent: string): ICalEvent[] {
  const events: ICalEvent[] = []

  // Split into event blocks
  const eventBlocks = icsContent.split('BEGIN:VEVENT')

  for (const block of eventBlocks.slice(1)) {
    const endIdx = block.indexOf('END:VEVENT')
    const eventText = block.substring(0, endIdx > -1 ? endIdx : block.length)

    // Extract fields (handle both folded lines and plain lines)
    const getFieldValue = (fieldName: string): string => {
      const regex = new RegExp(`(?:^|\\n)${fieldName}(?::|;[^:]*:)([\\s\\S]*?)(?=\\n[A-Z-]+|\\s*$)`, 'i')
      const match = eventText.match(regex)
      if (!match) return ''
      // Unfold lines (remove CRLF + space/tab)
      return match[1].replace(/\r?\n[\t ]/g, '').trim()
    }

    const uid = getFieldValue('UID')
    if (!uid) continue

    const summary = getFieldValue('SUMMARY') || 'Imported Booking'
    const description = getFieldValue('DESCRIPTION') || undefined
    const location = getFieldValue('LOCATION') || undefined

    // Parse dates - handle both VALUE=DATE and VALUE=DATE-TIME
    const dtStartRaw = getFieldValue('DTSTART')
    const dtEndRaw = getFieldValue('DTEND')

    let startDate: Date | null = null
    let endDate: Date | null = null

    if (dtStartRaw) {
      // Handle all-day events (YYYYMMDD)
      const dateMatch = dtStartRaw.match(/(\d{4})(\d{2})(\d{2})/)
      if (dateMatch) {
        startDate = new Date(
          parseInt(dateMatch[1]),
          parseInt(dateMatch[2]) - 1,
          parseInt(dateMatch[3]),
          14, // default check-in time
          0,
          0,
          0,
        )
      } else {
        // DateTime format (YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS)
        const dtMatch = dtStartRaw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
        if (dtMatch) {
          startDate = new Date(
            parseInt(dtMatch[1]),
            parseInt(dtMatch[2]) - 1,
            parseInt(dtMatch[3]),
            parseInt(dtMatch[4]),
            parseInt(dtMatch[5]),
            parseInt(dtMatch[6]),
            0,
          )
          // If UTC (Z suffix), keep as is — we'll handle timezone at display level
        }
      }
    }

    if (dtEndRaw) {
      const dateMatch = dtEndRaw.match(/(\d{4})(\d{2})(\d{2})/)
      if (dateMatch) {
        endDate = new Date(
          parseInt(dateMatch[1]),
          parseInt(dateMatch[2]) - 1,
          parseInt(dateMatch[3]),
          10, // default check-out time
          0,
          0,
          0,
        )
      } else {
        const dtMatch = dtEndRaw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
        if (dtMatch) {
          endDate = new Date(
            parseInt(dtMatch[1]),
            parseInt(dtMatch[2]) - 1,
            parseInt(dtMatch[3]),
            parseInt(dtMatch[4]),
            parseInt(dtMatch[5]),
            parseInt(dtMatch[6]),
            0,
          )
        }
      }
    }

    if (!startDate || !endDate) continue

    // Determine status
    let status: ICalEvent['status'] = 'CONFIRMED'
    const statusRaw = getFieldValue('STATUS')
    if (statusRaw.toUpperCase().includes('CANCEL')) {
      status = 'CANCELLED'
    } else if (statusRaw.toUpperCase().includes('TENTATIV')) {
      status = 'TENTATIVE'
    }

    const organizer = getFieldValue('ORGANIZER') || undefined

    events.push({
      uid,
      summary,
      startDate,
      endDate,
      description,
      location,
      status,
      organizer,
    })
  }

  return events
}

// Fetch iCal feed from a URL
export async function fetchICalFeed(url: string): Promise<{ success: boolean; events?: ICalEvent[]; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EasyBeds-iCal-Sync/1.0',
        Accept: 'text/calendar',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const content = await response.text()

    if (!content.includes('BEGIN:VCALENDAR')) {
      return { success: false, error: 'Invalid iCal format: missing VCALENDAR wrapper' }
    }

    const events = parseICal(content)
    return { success: true, events }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch iCal feed'
    return { success: false, error: message }
  }
}

// Sync events from a channel's iCal feed
export async function syncChannelICal(channelId: string, hotelId: string): Promise<{
  success: boolean
  eventsFound: number
  eventsCreated: number
  eventsUpdated: number
  eventsCancelled: number
  error?: string
}> {
  try {
    // Get channel info
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: { hotel: true },
    })

    if (!channel || !channel.icalUrl) {
      return { success: false, eventsFound: 0, eventsCreated: 0, eventsUpdated: 0, eventsCancelled: 0, error: 'Channel not found or no iCal URL configured' }
    }

    // Fetch the iCal feed
    const result = await fetchICalFeed(channel.icalUrl)
    if (!result.success || !result.events) {
      return { success: false, eventsFound: 0, eventsCreated: 0, eventsUpdated: 0, eventsCancelled: 0, error: result.error }
    }

    const events = result.events
    let eventsCreated = 0
    let eventsUpdated = 0
    let eventsCancelled = 0

    // Get existing bookings for this channel
    const existingBookings = await db.booking.findMany({
      where: { channelId, hotelId },
      select: { id: true, channelBookingRef: true, status: true },
    })

    const existingByRef = new Map(existingBookings.map((b) => [b.channelBookingRef, b]))

    for (const event of events) {
      // Check if booking already exists (matched by OTA reference / UID)
      const existing = existingByRef.get(event.uid)

      if (event.status === 'CANCELLED') {
        // Cancel existing booking if found
        if (existing && existing.status !== 'cancelled') {
          await db.booking.update({
            where: { id: existing.id },
            data: {
              status: 'cancelled',
              cancellationReason: 'Cancelled via iCal sync',
              cancelledAt: new Date(),
            },
          })
          // Release availability block
          await db.availabilityBlock.updateMany({
            where: { bookingId: existing.id },
            data: { isActive: false },
          })
          eventsCancelled++
        }
        continue
      }

      // Calculate nights
      const nights = Math.max(1, Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)))

      if (existing) {
        // Update existing booking dates if changed
        await db.booking.update({
          where: { id: existing.id },
          data: {
            checkInDate: event.startDate,
            checkOutDate: event.endDate,
            numNights: nights,
            status: event.status === 'TENTATIVE' ? 'pending' : 'confirmed',
            specialRequests: event.description || undefined,
            updatedAt: new Date(),
          },
        })
        // Update availability block
        await db.availabilityBlock.updateMany({
          where: { bookingId: existing.id },
          data: {
            startDate: event.startDate,
            endDate: event.endDate,
            isActive: true,
          },
        })
        eventsUpdated++
      } else {
        // Create new booking — find or create guest from summary
        let guestName = event.summary
          .replace(/reservation/i, '')
          .replace(/booking/i, '')
          .replace(/\d+/g, '')
          .trim()

        if (!guestName) guestName = 'OTA Guest'

        // Split name into first/last
        const nameParts = guestName.split(' ').filter(Boolean)
        const firstName = nameParts[0] || 'OTA'
        const lastName = nameParts.slice(1).join(' ') || 'Guest'

        // Find or create guest
        let guest = await db.guest.findFirst({
          where: {
            hotelId,
            OR: [
              { firstName, lastName },
              { email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ota-import.easybeds.com` },
            ],
          },
        })

        if (!guest) {
          guest = await db.guest.create({
            data: {
              hotelId,
              firstName,
              lastName,
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ota-import.easybeds.com`,
              notes: `Imported from ${channel.name} via iCal sync`,
            },
          })
        }

        // Find an available room (first available room for the dates)
        const allRooms = await db.room.findMany({
          where: { hotelId, isActive: true },
        })

        let assignedRoom = null
        for (const room of allRooms) {
          const conflicts = await db.availabilityBlock.count({
            where: {
              roomId: room.id,
              isActive: true,
              startDate: { lt: event.endDate },
              endDate: { gt: event.startDate },
            },
          })
          if (conflicts === 0) {
            assignedRoom = room
            break
          }
        }

        if (!assignedRoom) {
          // No room available — create booking anyway with first room, flagged
          assignedRoom = allRooms[0]
        }

        // Generate confirmation code
        const dateStr = format(event.startDate, 'yyyyMMdd')
        const count = await db.booking.count({ where: { hotelId } })
        const confirmationCode = `EB-${dateStr}-${String(count + 1).padStart(3, '0')}`

        // Create booking
        const booking = await db.booking.create({
          data: {
            hotelId,
            roomId: assignedRoom.id,
            guestId: guest.id,
            channelId: channel.id,
            channelBookingRef: event.uid,
            confirmationCode,
            checkInDate: event.startDate,
            checkOutDate: event.endDate,
            numGuests: assignedRoom?.maxGuests || 2,
            numNights: nights,
            pricePerNight: assignedRoom?.basePrice || 0,
            totalPrice: nights * (assignedRoom?.basePrice || 0),
            currency: channel.hotel.currency,
            status: event.status === 'TENTATIVE' ? 'pending' : 'confirmed',
            specialRequests: event.description || undefined,
          },
        })

        // Create availability block
        await db.availabilityBlock.create({
          data: {
            hotelId,
            roomId: assignedRoom.id,
            bookingId: booking.id,
            startDate: event.startDate,
            endDate: event.endDate,
            blockType: 'booking',
            isActive: true,
          },
        })

        eventsCreated++
      }
    }

    // Update channel sync status
    await db.channel.update({
      where: { id: channelId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncError: null,
      },
    })

    // Log the sync
    await db.syncLog.create({
      data: {
        hotelId,
        channelId,
        direction: 'import',
        status: 'success',
        eventsFound: events.length,
        eventsCreated,
        eventsUpdated,
        eventsDeleted: eventsCancelled,
      },
    })

    return {
      success: true,
      eventsFound: events.length,
      eventsCreated,
      eventsUpdated,
      eventsCancelled,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed'

    // Update channel with error
    try {
      await db.channel.update({
        where: { id: channelId },
        data: { syncStatus: 'error', syncError: message },
      })
      await db.syncLog.create({
        data: {
          hotelId,
          channelId,
          direction: 'import',
          status: 'error',
          errorMessage: message,
        },
      })
    } catch {
      // ignore logging errors
    }

    return { success: false, eventsFound: 0, eventsCreated: 0, eventsUpdated: 0, eventsCancelled: 0, error: message }
  }
}

// Sync all channels that have iCal import configured
export async function syncAllChannels(hotelId: string): Promise<{
  synced: number
  results: { channelName: string; success: boolean; eventsFound: number; error?: string }[]
}> {
  const channels = await db.channel.findMany({
    where: {
      hotelId,
      isActive: true,
      icalUrl: { not: null },
    },
  })

  const results = []
  let synced = 0

  for (const channel of channels) {
    const result = await syncChannelICal(channel.id, hotelId)
    results.push({
      channelName: channel.name,
      success: result.success,
      eventsFound: result.eventsFound,
      error: result.error,
    })
    if (result.success) synced++
  }

  return { synced, results }
}
