import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/dashboard/stats?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Run all queries in parallel
    const [
      totalRooms,
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      currentGuests,
      monthlyBookings,
      monthlyRevenue,
      recentBookings,
      upcomingBookings,
      activeBlocks,
    ] = await Promise.all([
      // Total active rooms
      db.room.count({ where: { hotelId, isActive: true } }),

      // Bookings created today
      db.booking.count({
        where: { hotelId, createdAt: { gte: todayStart, lte: todayEnd } },
      }),

      // Check-ins today
      db.booking.count({
        where: {
          hotelId,
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['confirmed', 'checked_in'] },
        },
      }),

      // Check-outs today
      db.booking.count({
        where: {
          hotelId,
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['checked_in', 'checked_out'] },
        },
      }),

      // Current guests (checked in and not checked out)
      db.booking.count({
        where: {
          hotelId,
          status: 'checked_in',
        },
      }),

      // Monthly bookings
      db.booking.count({
        where: {
          hotelId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),

      // Monthly revenue (confirmed, checked_in, checked_out bookings)
      db.booking.aggregate({
        where: {
          hotelId,
          status: { in: ['confirmed', 'checked_in', 'checked_out'] },
          checkInDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalPrice: true },
      }),

      // Recent bookings (last 5)
      db.booking.findMany({
        where: { hotelId },
        include: {
          room: { select: { name: true, roomNumber: true } },
          guest: { select: { firstName: true, lastName: true } },
          channel: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Upcoming check-ins (next 7 days)
      db.booking.findMany({
        where: {
          hotelId,
          checkInDate: {
            gte: todayStart,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: 'confirmed',
        },
        include: {
          room: { select: { name: true, roomNumber: true } },
          guest: { select: { firstName: true, lastName: true, phone: true } },
        },
        orderBy: { checkInDate: 'asc' },
        take: 10,
      }),

      // Current occupancy blocks for today
      db.availabilityBlock.count({
        where: {
          hotelId,
          isActive: true,
          startDate: { lt: todayEnd },
          endDate: { gt: todayStart },
        },
      }),
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (activeBlocks / totalRooms) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        today: {
          bookingsCreated: bookingsToday,
          checkIns: checkInsToday,
          checkOuts: checkOutsToday,
          currentGuests,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          totalRooms,
        },
        thisMonth: {
          totalBookings: monthlyBookings,
          totalRevenue: monthlyRevenue._sum.totalPrice || 0,
        },
        recentBookings,
        upcomingCheckIns: upcomingBookings,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
