import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

// POST /api/public/hotel/[slug]/book — Public booking submission (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const body = await request.json();
    const {
      roomId,
      checkIn,
      checkOut,
      numGuests,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = body;

    // Validate required fields
    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'roomId, checkIn, and checkOut are required.' },
        { status: 400 },
      );
    }

    if (!guestFirstName || !guestLastName) {
      return NextResponse.json(
        { success: false, error: 'Guest first name and last name are required.' },
        { status: 400 },
      );
    }

    if (!guestEmail && !guestPhone) {
      return NextResponse.json(
        { success: false, error: 'Guest email or phone is required.' },
        { status: 400 },
      );
    }

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkOut date must be after checkIn date.' },
        { status: 400 },
      );
    }

    // Get hotel by slug
    const hotel = await db.hotel.findFirst({
      where: {
        bookingPageSlug: slug,
        bookingPageEnabled: true,
        isActive: true,
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found or booking page is not enabled.' },
        { status: 404 },
      );
    }

    // Validate room
    const room = await db.room.findFirst({
      where: { id: roomId, hotelId: hotel.id, isActive: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or inactive.' },
        { status: 404 },
      );
    }

    // Calculate nights and price
    const numNights = differenceInCalendarDays(checkOutDate, checkInDate);
    if (numNights <= 0) {
      return NextResponse.json(
        { success: false, error: 'Booking must be at least 1 night.' },
        { status: 400 },
      );
    }

    const pricePerNight = room.basePrice;
    const totalPrice = numNights * pricePerNight;

    // Get or create website channel
    let channel = await db.channel.findFirst({
      where: { hotelId: hotel.id, type: 'website', isActive: true },
    });
    if (!channel) {
      channel = await db.channel.create({
        data: {
          hotelId: hotel.id,
          name: 'Online Booking',
          type: 'website',
          syncMethod: 'manual',
        },
      });
    }

    // Check availability
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
          error: 'Room is no longer available for the selected dates. Please try different dates.',
        },
        { status: 409 },
      );
    }

    // Generate confirmation code
    const today = format(new Date(), 'yyyyMMdd');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const bookingCount = await db.booking.count({
      where: {
        hotelId: hotel.id,
        createdAt: { gte: todayStart },
      },
    });
    const confirmationCode = `EB-${today}-${String(bookingCount + 1).padStart(3, '0')}`;

    // Create booking in a transaction
    const result = await db.$transaction(async (tx) => {
      // Find or create guest
      let guest = await tx.guest.findFirst({
        where: {
          hotelId: hotel.id,
          email: guestEmail || undefined,
        },
      });

      if (!guest && guestPhone) {
        guest = await tx.guest.findFirst({
          where: { hotelId: hotel.id, phone: guestPhone },
        });
      }

      if (guest) {
        // Update existing guest
        guest = await tx.guest.update({
          where: { id: guest.id },
          data: {
            firstName: guestFirstName,
            lastName: guestLastName,
            ...(guestEmail && { email: guestEmail }),
            ...(guestPhone && { phone: guestPhone }),
          },
        });
      } else {
        // Create new guest
        guest = await tx.guest.create({
          data: {
            hotelId: hotel.id,
            firstName: guestFirstName,
            lastName: guestLastName,
            email: guestEmail || null,
            phone: guestPhone || null,
          },
        });
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          hotelId: hotel.id,
          roomId,
          guestId: guest.id,
          channelId: channel.id,
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
          balanceDue: totalPrice,
        },
        include: {
          room: true,
          guest: true,
          channel: true,
        },
      });

      // Create availability block
      await tx.availabilityBlock.create({
        data: {
          hotelId: hotel.id,
          roomId,
          bookingId: booking.id,
          startDate: checkInDate,
          endDate: checkOutDate,
          blockType: 'booking',
          isActive: true,
        },
      });

      return { booking, guest };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: result.booking,
          guest: {
            id: result.guest.id,
            firstName: result.guest.firstName,
            lastName: result.guest.lastName,
          },
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
