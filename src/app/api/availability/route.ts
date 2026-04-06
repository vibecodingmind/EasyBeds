import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/availability?hotelId=xxx&year=2026&month=4
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const year = parseInt(request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString(), 10);
    const month = parseInt(request.nextUrl.searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12.' },
        { status: 400 }
      );
    }

    // Calculate month start and end
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all rooms for this hotel
    const rooms = await db.room.findMany({
      where: { hotelId, isActive: true },
      select: { id: true, name: true, roomNumber: true, type: true, basePrice: true },
      orderBy: { name: 'asc' },
    });

    // Get all availability blocks that overlap with the requested month
    const blocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: monthEnd },
        endDate: { gt: monthStart },
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true } },
        booking: {
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ startDate: 'asc' }, { room: { name: 'asc' } }],
    });

    // Group blocks by roomId
    const blocksByRoom: Record<string, typeof blocks> = {};
    for (const room of rooms) {
      blocksByRoom[room.id] = blocks.filter((b) => b.roomId === room.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        monthStart,
        monthEnd,
        rooms,
        blocks,
        blocksByRoom,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch availability.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
