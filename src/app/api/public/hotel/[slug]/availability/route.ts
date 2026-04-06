import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/hotel/[slug]/availability?from=DATE&to=DATE
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const fromStr = request.nextUrl.searchParams.get('from');
    const toStr = request.nextUrl.searchParams.get('to');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Hotel slug is required.' },
        { status: 400 },
      );
    }

    if (!fromStr || !toStr) {
      return NextResponse.json(
        { success: false, error: 'from and to date parameters are required (YYYY-MM-DD).' },
        { status: 400 },
      );
    }

    const checkIn = new Date(fromStr);
    const checkOut = new Date(toStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    if (checkIn >= checkOut) {
      return NextResponse.json(
        { success: false, error: 'Check-out date must be after check-in date.' },
        { status: 400 },
      );
    }

    // Get hotel
    const hotel = await db.hotel.findFirst({
      where: {
        bookingPageSlug: slug,
        bookingPageEnabled: true,
        isActive: true,
      },
      select: { id: true, name: true, currency: true },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found or booking page is not enabled.' },
        { status: 404 },
      );
    }

    // Get all active rooms
    const rooms = await db.room.findMany({
      where: {
        hotelId: hotel.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        roomNumber: true,
        type: true,
        maxGuests: true,
        basePrice: true,
        description: true,
        amenities: true,
        bedType: true,
        imageUrl: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Check availability for each room
    const availableRooms = [];

    for (const room of rooms) {
      // Find overlapping availability blocks
      const blockedDates = await db.availabilityBlock.findMany({
        where: {
          roomId: room.id,
          isActive: true,
          startDate: { lt: checkOut },
          endDate: { gt: checkIn },
        },
      });

      if (blockedDates.length === 0) {
        // Calculate total price
        const numNights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
        const totalPrice = numNights * room.basePrice;

        availableRooms.push({
          ...room,
          numNights,
          totalPrice,
          available: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hotel: { id: hotel.id, name: hotel.name, currency: hotel.currency },
        checkIn: fromStr,
        checkOut: toStr,
        availableRooms,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check availability.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
