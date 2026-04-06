import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookings/check-availability?hotelId=xxx&roomId=xxx&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    const roomId = request.nextUrl.searchParams.get('roomId');
    const checkIn = request.nextUrl.searchParams.get('checkIn');
    const checkOut = request.nextUrl.searchParams.get('checkOut');

    if (!hotelId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'hotelId, roomId, checkIn, and checkOut query parameters are required.' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkOut date must be after checkIn date.' },
        { status: 400 }
      );
    }

    // Find overlapping availability blocks
    const overlappingBlocks = await db.availabilityBlock.findMany({
      where: {
        roomId,
        hotelId,
        isActive: true,
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate },
        include: {
          booking: {
            select: {
              id: true,
              confirmationCode: true,
              status: true,
              checkInDate: true,
              checkOutDate: true,
              guest: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    });

    const isAvailable = overlappingBlocks.length === 0;

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        hotelId,
        checkIn: checkIn,
        checkOut: checkOut,
        isAvailable,
        conflictingBlocks: overlappingBlocks,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check availability.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
