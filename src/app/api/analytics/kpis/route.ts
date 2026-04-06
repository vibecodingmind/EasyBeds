import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/analytics/kpis?hotelId=xxx&date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const dateStr = request.nextUrl.searchParams.get('date');
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });

    // Today's stats
    const todayBlocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: dayEnd },
        endDate: { gt: targetDate },
      },
    });

    const todayOccupiedRooms = new Set(todayBlocks.map((b) => b.roomId)).size;
    const todayOccupancyRate = totalRooms > 0 ? (todayOccupiedRooms / totalRooms) * 100 : 0;

    // Today check-ins and check-outs
    const todayCheckIns = await db.booking.count({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in'] },
        checkInDate: { gte: targetDate, lte: dayEnd },
      },
    });

    const todayCheckOuts = await db.booking.count({
      where: {
        hotelId,
        status: { in: ['checked_out'] },
        checkOutDate: { gte: targetDate, lte: dayEnd },
      },
    });

    // Today's revenue (bookings that span today)
    const todayBookings = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in'] },
        checkInDate: { lte: dayEnd },
        checkOutDate: { gt: targetDate },
      },
    });

    const todayRevenue = todayBookings.reduce((sum, b) => {
      const nightsPerDay = 1; // each booking contributes 1 night of revenue per day it covers
      return sum + b.pricePerNight * nightsPerDay;
    }, 0);

    // Monthly stats
    const monthBookings = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
    });

    const monthActiveBookings = monthBookings.filter((b) =>
      ['confirmed', 'checked_in', 'checked_out'].includes(b.status),
    );

    const monthTotalRevenue = monthActiveBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // ADR: Average Daily Rate = total room revenue / number of occupied room nights
    const monthOccupiedNights = monthActiveBookings.reduce((sum, b) => sum + b.numNights, 0);
    const adr = monthOccupiedNights > 0 ? monthTotalRevenue / monthOccupiedNights : 0;

    // RevPAR: Revenue Per Available Room = ADR * occupancy rate / 100
    const monthDaysInPeriod = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const monthTotalRoomNights = totalRooms * monthDaysInPeriod;
    const monthOccupancyRate = monthTotalRoomNights > 0 ? (monthOccupiedNights / monthTotalRoomNights) * 100 : 0;
    const revpar = (adr * monthOccupancyRate) / 100;

    // GOPPAR: Gross Operating Profit Per Available Room (simplified: 65% of RevPAR)
    const goppar = revpar * 0.65;

    // Average length of stay
    const avgStayLength = monthActiveBookings.length > 0
      ? monthActiveBookings.reduce((sum, b) => sum + b.numNights, 0) / monthActiveBookings.length
      : 0;

    // Cancellation rate
    const monthCancelled = await db.booking.count({
      where: {
        hotelId,
        status: 'cancelled',
        cancelledAt: { gte: monthStart, lte: monthEnd },
      },
    });
    const cancellationRate = monthBookings.length > 0
      ? (monthCancelled / monthBookings.length) * 100
      : 0;

    // Revenue by guest type (new vs returning)
    const monthGuestIds = [...new Set(monthActiveBookings.map((b) => b.guestId))];
    const guestsWithHistory = await db.guest.findMany({
      where: {
        id: { in: monthGuestIds },
        hotelId,
        totalStays: { gt: 1 },
      },
      select: { id: true },
    });
    const returningGuestIds = new Set(guestsWithHistory.map((g) => g.id));

    let newGuestRevenue = 0;
    let returningGuestRevenue = 0;
    for (const b of monthActiveBookings) {
      if (returningGuestIds.has(b.guestId)) {
        returningGuestRevenue += b.totalPrice;
      } else {
        newGuestRevenue += b.totalPrice;
      }
    }

    // Booking source breakdown
    const monthBookingsWithChannel = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
      include: {
        channel: { select: { id: true, name: true, type: true } },
      },
    });

    const sourceBreakdown = monthBookingsWithChannel.reduce<Record<string, { count: number; revenue: number }>>((acc, b) => {
      const source = b.channel?.name || 'Unknown';
      if (!acc[source]) acc[source] = { count: 0, revenue: 0 };
      acc[source].count++;
      acc[source].revenue += b.totalPrice;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        today: {
          occupancyRate: Math.round(todayOccupancyRate * 10) / 10,
          occupiedRooms: todayOccupiedRooms,
          totalRooms,
          checkIns: todayCheckIns,
          checkOuts: todayCheckOuts,
          revenue: todayRevenue,
        },
        month: {
          totalBookings: monthActiveBookings.length,
          totalRevenue: monthTotalRevenue,
          occupancyRate: Math.round(monthOccupancyRate * 10) / 10,
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
          goppar: Math.round(goppar * 100) / 100,
          avgStayLength: Math.round(avgStayLength * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          newGuestRevenue,
          returningGuestRevenue,
        },
        sourceBreakdown,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch KPIs.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
