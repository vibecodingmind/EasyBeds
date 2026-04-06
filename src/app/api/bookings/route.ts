import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

// GET /api/bookings?hotelId=xxx&status=xxx&roomId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const status = request.nextUrl.searchParams.get('status');
    const roomId = request.nextUrl.searchParams.get('roomId');
    const guestId = request.nextUrl.searchParams.get('guestId');
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = { hotelId };

    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (guestId) where.guestId = guestId;
    if (from || to) {
      where.checkInDate = {};
      if (from) (where.checkInDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.checkInDate as Record<string, unknown>).lte = new Date(to);
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          room: { select: { id: true, name: true, roomNumber: true, type: true } },
          guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          channel: { select: { id: true, name: true, type: true } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { checkInDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bookings.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/bookings?hotelId=xxx — CRITICAL BOOKING CREATION
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      roomId, guestId, channelId, checkIn, checkOut, numGuests,
      specialRequests, internalNotes, channelBookingRef, guestFirstName,
      guestLastName, guestEmail, guestPhone, sourceIp,
    } = body;

    // Validate required fields
    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'roomId, checkIn, and checkOut are required.' },
        { status: 400 }
      );
    }

    if (!guestId && (!guestFirstName || !guestLastName)) {
      return NextResponse.json(
        { success: false, error: 'Either guestId or guest first/last name is required.' },
        { status: 400 }
      );
    }

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkOut date must be after checkIn date.' },
        { status: 400 }
      );
    }

    // Validate room exists and belongs to hotel
    const room = await db.room.findFirst({ where: { id: roomId, hotelId, isActive: true } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or inactive.' },
        { status: 404 }
      );
    }

    // Calculate nights and price
    const numNights = differenceInCalendarDays(checkOutDate, checkInDate);
    if (numNights <= 0) {
      return NextResponse.json(
        { success: false, error: 'Booking must be at least 1 night.' },
        { status: 400 }
      );
    }

    const pricePerNight = room.basePrice;
    const totalPrice = numNights * pricePerNight;

    // Get hotel currency
    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found.' },
        { status: 404 }
      );
    }

    // Determine the channel
    let effectiveChannelId = channelId;
    if (!effectiveChannelId) {
      // Default to walk-in channel
      let defaultChannel = await db.channel.findFirst({
        where: { hotelId, type: 'walkin', isActive: true },
      });
      if (!defaultChannel) {
        defaultChannel = await db.channel.create({
          data: {
            hotelId,
            name: 'Walk-in',
            type: 'walkin',
            syncMethod: 'manual',
          },
        });
      }
      effectiveChannelId = defaultChannel.id;
    }

    // Check availability using overlap query: start_date < new_end AND end_date > new_start
    const overlappingBlocks = await db.availabilityBlock.findMany({
      where: {
        roomId,
        isActive: true,
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate },
      },
    });

    if (overlappingBlocks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room is not available for the selected dates.',
          data: { conflictingBlocks: overlappingBlocks },
        },
        { status: 409 }
      );
    }

    // Generate confirmation code: EB-YYYYMMDD-XXX
    const today = format(new Date(), 'yyyyMMdd');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const bookingCount = await db.booking.count({
      where: {
        hotelId,
        createdAt: { gte: todayStart },
      },
    });
    const confirmationCode = `EB-${today}-${String(bookingCount + 1).padStart(3, '0')}`;

    // Execute booking creation in a transaction
    const result = await db.$transaction(async (tx) => {
      // Find or create guest
      let effectiveGuestId = guestId;

      if (!effectiveGuestId && (guestEmail || guestPhone)) {
        const existingGuest = await tx.guest.findFirst({
          where: {
            hotelId,
            ...(guestEmail && { email: guestEmail }),
            ...(guestPhone && !guestEmail && { phone: guestPhone }),
          },
        });

        if (existingGuest) {
          // Update existing guest info if provided
          await tx.guest.update({
            where: { id: existingGuest.id },
            data: {
              ...(guestFirstName && { firstName: guestFirstName }),
              ...(guestLastName && { lastName: guestLastName }),
              ...(guestPhone && { phone: guestPhone }),
            },
          });
          effectiveGuestId = existingGuest.id;
        } else {
          const newGuest = await tx.guest.create({
            data: {
              hotelId,
              firstName: guestFirstName || 'Unknown',
              lastName: guestLastName || 'Guest',
              email: guestEmail || null,
              phone: guestPhone || null,
            },
          });
          effectiveGuestId = newGuest.id;
        }
      } else if (!effectiveGuestId) {
        const newGuest = await tx.guest.create({
          data: {
            hotelId,
            firstName: guestFirstName || 'Unknown',
            lastName: guestLastName || 'Guest',
            email: guestEmail || null,
            phone: guestPhone || null,
          },
        });
        effectiveGuestId = newGuest.id;
      }

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          hotelId,
          roomId,
          guestId: effectiveGuestId!,
          channelId: effectiveChannelId!,
          channelBookingRef: channelBookingRef || null,
          confirmationCode,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numGuests: numGuests || 1,
          numNights,
          pricePerNight,
          totalPrice,
          currency: hotel.currency,
          status: 'confirmed',
          specialRequests: specialRequests || null,
          internalNotes: internalNotes || null,
          sourceIp: sourceIp || null,
        },
        include: {
          room: true,
          guest: true,
          channel: true,
        },
      });

      // Create the availability block
      const availabilityBlock = await tx.availabilityBlock.create({
        data: {
          hotelId,
          roomId,
          bookingId: booking.id,
          startDate: checkInDate,
          endDate: checkOutDate,
          blockType: 'booking',
          isActive: true,
        },
      });

      return { booking, availabilityBlock };
    });

    return NextResponse.json({ success: true, data: result.booking }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
