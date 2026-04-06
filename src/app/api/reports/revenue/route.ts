import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, startOfDay, subDays } from 'date-fns';

// GET /api/reports/revenue?hotelId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
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

    // Revenue by channel
    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in', 'checked_out'] },
        checkInDate: { lt: toDate },
        checkOutDate: { gt: fromDate },
      },
      include: {
        channel: { select: { id: true, name: true, type: true, commission: true } },
        room: { select: { id: true, name: true, roomNumber: true, type: true } },
        payments: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    // Revenue by channel
    const revenueByChannel = bookings.reduce<Record<string, {
      channelId: string; channelName: string; channelType: string;
      totalRevenue: number; totalBookings: number; totalNights: number;
      commission: number; netRevenue: number;
    }>>((acc, booking) => {
      const channelKey = booking.channelId;
      if (!acc[channelKey]) {
        acc[channelKey] = {
          channelId: booking.channel.id,
          channelName: booking.channel.name,
          channelType: booking.channel.type,
          totalRevenue: 0,
          totalBookings: 0,
          totalNights: 0,
          commission: 0,
          netRevenue: 0,
        };
      }
      acc[channelKey].totalRevenue += booking.totalPrice;
      acc[channelKey].totalBookings += 1;
      acc[channelKey].totalNights += booking.numNights;
      if (booking.channel.commission) {
        acc[channelKey].commission += booking.totalPrice * booking.channel.commission;
      }
      return acc;
    }, {});

    // Calculate net revenue per channel
    for (const channel of Object.values(revenueByChannel)) {
      channel.netRevenue = channel.totalRevenue - channel.commission;
    }

    // Revenue by room type
    const revenueByRoomType = bookings.reduce<Record<string, {
      roomType: string; totalRevenue: number; totalBookings: number; totalNights: number;
    }>>((acc, booking) => {
      const roomTypeKey = booking.room.type;
      if (!acc[roomTypeKey]) {
        acc[roomTypeKey] = {
          roomType: roomTypeKey,
          totalRevenue: 0,
          totalBookings: 0,
          totalNights: 0,
        };
      }
      acc[roomTypeKey].totalRevenue += booking.totalPrice;
      acc[roomTypeKey].totalBookings += 1;
      acc[roomTypeKey].totalNights += booking.numNights;
      return acc;
    }, {});

    // Daily revenue breakdown (last 30 days or specified period)
    const days: Record<string, number> = {};
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dateKey = format(current, 'yyyy-MM-dd');
      days[dateKey] = 0;
      current.setDate(current.getDate() + 1);
    }

    for (const booking of bookings) {
      const checkIn = startOfDay(booking.checkInDate);
      const checkOut = startOfDay(booking.checkOutDate);
      const pricePerDay = booking.totalPrice / booking.numNights;
      const dayCursor = new Date(Math.max(checkIn.getTime(), fromDate.getTime()));
      const endCursor = new Date(Math.min(checkOut.getTime(), toDate.getTime()));

      while (dayCursor < endCursor) {
        const dateKey = format(dayCursor, 'yyyy-MM-dd');
        if (days[dateKey] !== undefined) {
          days[dateKey] += pricePerDay;
        }
        dayCursor.setDate(dayCursor.getDate() + 1);
      }
    }

    const dailyRevenue = Object.entries(days).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

    // Totals
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalBookings = bookings.length;
    const totalNights = bookings.reduce((sum, b) => sum + b.numNights, 0);
    const totalCommission = Object.values(revenueByChannel).reduce((sum, c) => sum + c.commission, 0);

    // Payment summary
    const payments = bookings.flatMap((b) => b.payments);
    const paymentsByMethod = payments.reduce<Record<string, { method: string; total: number; count: number }>>((acc, p) => {
      if (!acc[p.method]) {
        acc[p.method] = { method: p.method, total: 0, count: 0 };
      }
      acc[p.method].total += p.amount;
      acc[p.method].count += 1;
      return acc;
    }, {});

    const totalCollected = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalBookings,
          totalNights,
          totalCommission: Math.round(totalCommission * 100) / 100,
          netRevenue: Math.round((totalRevenue - totalCommission) * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          avgBookingValue: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
        },
        revenueByChannel: Object.values(revenueByChannel),
        revenueByRoomType: Object.values(revenueByRoomType),
        dailyRevenue,
        paymentsByMethod: Object.values(paymentsByMethod),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate revenue report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
