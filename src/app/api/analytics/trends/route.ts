import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/analytics/trends?hotelId=xxx&period=30d
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const period = request.nextUrl.searchParams.get('period') || '30d';

    // Parse period
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    else if (period === '12m') days = 365;
    else if (/^\d+d$/.test(period)) days = parseInt(period, 10);

    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });

    // Get all bookings in period
    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        OR: [
          { checkInDate: { gte: from, lte: now } },
          { checkOutDate: { gte: from, lte: now } },
        ],
      },
      include: {
        channel: { select: { id: true, name: true, type: true } },
        room: { select: { id: true, type: true } },
      },
    });

    // Build daily occupancy data
    const occupancyTrend: Array<{
      date: string;
      occupancy: number;
      occupiedRooms: number;
      revenue: number;
      bookings: number;
    }> = [];

    const revenueTrend: Array<{ date: string; revenue: number }> = [];

    for (let i = 0; i <= days; i++) {
      const day = new Date(from);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];

      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Occupied rooms this day
      const occupiedRoomIds = new Set<string>();
      let dayRevenue = 0;
      let dayBookings = 0;

      for (const b of bookings) {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        const spansDay = checkIn <= dayEnd && checkOut > dayStart;

        if (spansDay && ['confirmed', 'checked_in'].includes(b.status)) {
          occupiedRoomIds.add(b.roomId);
          dayRevenue += b.pricePerNight;
        }

        if (checkIn >= dayStart && checkIn <= dayEnd) {
          dayBookings++;
        }
      }

      const occupancy = totalRooms > 0 ? (occupiedRoomIds.size / totalRooms) * 100 : 0;

      occupancyTrend.push({
        date: dayStr,
        occupancy: Math.round(occupancy * 10) / 10,
        occupiedRooms: occupiedRoomIds.size,
        revenue: Math.round(dayRevenue * 100) / 100,
        bookings: dayBookings,
      });

      revenueTrend.push({
        date: dayStr.slice(5), // MM-DD
        revenue: Math.round(dayRevenue * 100) / 100,
      });
    }

    // Monthly revenue for 12-month chart
    const monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }> = [];
    for (let m = 11; m >= 0; m--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);
      const mLabel = mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const mBookings = await db.booking.findMany({
        where: {
          hotelId,
          checkInDate: { gte: mStart, lte: mEnd },
          status: { in: ['confirmed', 'checked_in', 'checked_out'] },
        },
      });

      monthlyRevenue.push({
        month: mLabel,
        revenue: mBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        bookings: mBookings.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        period: period,
        days,
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
        totalRooms,
        occupancyTrend,
        revenueTrend,
        monthlyRevenue,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trends.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
