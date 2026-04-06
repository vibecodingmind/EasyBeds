import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/analytics/channels?hotelId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const fromStr = request.nextUrl.searchParams.get('from');
    const toStr = request.nextUrl.searchParams.get('to');

    const now = new Date();
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toStr ? new Date(toStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get bookings with channel info
    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { gte: from, lte: to },
      },
      include: {
        channel: {
          select: { id: true, name: true, type: true, commission: true },
        },
      },
    });

    // Get all channels for this hotel
    const channels = await db.channel.findMany({
      where: { hotelId },
      select: { id: true, name: true, type: true, commission: true },
    });

    // Build channel performance data
    const channelPerformance = channels.map((ch) => {
      const channelBookings = bookings.filter((b) => b.channelId === ch.id);
      const activeBookings = channelBookings.filter((b) =>
        ['confirmed', 'checked_in', 'checked_out'].includes(b.status),
      );

      const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const totalNights = activeBookings.reduce((sum, b) => sum + b.numNights, 0);
      const commission = ch.commission ? totalRevenue * (ch.commission / 100) : 0;

      return {
        channelId: ch.id,
        channelName: ch.name,
        channelType: ch.type,
        totalBookings: channelBookings.length,
        activeBookings: activeBookings.length,
        cancelledBookings: channelBookings.filter((b) => b.status === 'cancelled').length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalNights,
        avgBookingValue: activeBookings.length > 0
          ? Math.round((totalRevenue / activeBookings.length) * 100) / 100
          : 0,
        avgNights: activeBookings.length > 0
          ? Math.round((totalNights / activeBookings.length) * 10) / 10
          : 0,
        commission: Math.round(commission * 100) / 100,
        netRevenue: Math.round((totalRevenue - commission) * 100) / 100,
      };
    });

    // Also include direct bookings (if not in channels table)
    const directBookings = bookings.filter((b) => !b.channelId && ['confirmed', 'checked_in', 'checked_out'].includes(b.status));
    if (directBookings.length > 0) {
      const directRevenue = directBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      channelPerformance.push({
        channelId: 'direct',
        channelName: 'Direct / Walk-in',
        channelType: 'direct',
        totalBookings: directBookings.length,
        activeBookings: directBookings.length,
        cancelledBookings: 0,
        totalRevenue: Math.round(directRevenue * 100) / 100,
        totalNights: directBookings.reduce((sum, b) => sum + b.numNights, 0),
        avgBookingValue: Math.round((directRevenue / directBookings.length) * 100) / 100,
        avgNights: Math.round((directBookings.reduce((s, b) => s + b.numNights, 0) / directBookings.length) * 10) / 10,
        commission: 0,
        netRevenue: Math.round(directRevenue * 100) / 100,
      });
    }

    // Sort by total revenue descending
    channelPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Summary totals
    const totalRevenue = channelPerformance.reduce((sum, ch) => sum + ch.totalRevenue, 0);
    const totalCommission = channelPerformance.reduce((sum, ch) => sum + ch.commission, 0);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
          netRevenue: Math.round((totalRevenue - totalCommission) * 100) / 100,
          totalChannels: channelPerformance.length,
        },
        channels: channelPerformance,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch channel data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
