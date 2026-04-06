import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { syncChannelICal, fetchICalFeed, parseICal } from '@/lib/ical-import'

// POST /api/channels/[id]/ical-import — Trigger iCal import for a channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const hotelId = auth.hotelId

    // Verify channel belongs to hotel
    const channel = await db.channel.findFirst({
      where: { id, hotelId },
    })

    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 })
    }

    if (!channel.icalUrl) {
      return NextResponse.json({ success: false, error: 'No iCal URL configured for this channel' }, { status: 400 })
    }

    // Run the sync
    const result = await syncChannelICal(id, hotelId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          channelName: channel.name,
          ...result,
          message: `Synced ${result.eventsFound} events: ${result.eventsCreated} new, ${result.eventsUpdated} updated, ${result.eventsCancelled} cancelled`,
        },
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// GET /api/channels/[id]/ical-import — Preview iCal feed without importing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const channel = await db.channel.findFirst({
      where: { id, hotelId: auth.hotelId },
    })

    if (!channel || !channel.icalUrl) {
      return NextResponse.json({ success: false, error: 'Channel not found or no iCal URL' }, { status: 404 })
    }

    // Fetch and parse but don't import
    const result = await fetchICalFeed(channel.icalUrl)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        channelName: channel.name,
        eventCount: result.events.length,
        events: result.events.map((e) => ({
          uid: e.uid,
          summary: e.summary,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate.toISOString(),
          status: e.status,
        })),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Preview failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
