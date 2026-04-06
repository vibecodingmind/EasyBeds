import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/occupancy?hotelId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    // Default to current month
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (fromDate >= toDate) {
      return NextResponse.json(
        { success: false, error: '"from" date must be before "to" date.' },
        { status: 400 }
      );
    }

    // Total active rooms
    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });

    // Total nights in the period
    const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalRoomNights = totalRooms * totalDays;

    // Get all availability blocks for the period
    const blocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
    });

    // Calculate occupied room-nights
    let occupiedRoomNights = 0;
    for (const block of blocks) {
      const blockStart = Math.max(block.startDate.getTime(), fromDate.getTime());
      const blockEnd = Math.min(block.endDate.getTime(), toDate.getTime());
      const nights = Math.ceil((blockEnd - blockStart) / (1000 * 60 * 60 * 24));
      if (nights > 0) {
        occupiedRoomNights += nights;
      }
    }

    const occupancyRate = totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0;

    // Get bookings for this period
    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { lt: toDate },
        checkOutDate: { gt: fromDate },
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true } },
        channel: { select: { id: true, name: true } },
        guest: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { checkInDate: 'asc' },
    });

    const activeBookings = bookings.filter((b) =>
      ['confirmed', 'checked_in'].includes(b.status)
    );

    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const avgDailyRate = occupiedRoomNights > 0 ? totalRevenue / occupiedRoomNights : 0;
    const avgStayLength = activeBookings.length > 0
      ? activeBookings.reduce((sum, b) => sum + b.numNights, 0) / activeBookings.length
      : 0;

    // Bookings by status
    const bookingsByStatus = bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          totalRooms,
          totalDays,
          totalRoomNights,
          occupiedRoomNights,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          totalBookings: bookings.length,
          activeBookings: activeBookings.length,
          totalRevenue,
          avgDailyRate: Math.round(avgDailyRate * 100) / 100,
          avgStayLength: Math.round(avgStayLength * 10) / 10,
        },
        bookingsByStatus,
        bookings: activeBookings.slice(0, 100),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate occupancy report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
