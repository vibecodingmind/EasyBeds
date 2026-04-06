import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

// GET /api/reports/monthly?hotelId=xxx&month=YYYY-MM&format=pdf
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const monthStr = request.nextUrl.searchParams.get('month');
    const now = new Date();
    const targetMonth = monthStr ? new Date(monthStr + '-01') : new Date(now.getFullYear(), now.getMonth(), 1);

    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });
    const totalRoomNights = totalRooms * daysInMonth;

    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { lte: monthEnd },
        checkOutDate: { gt: monthStart },
      },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true, name: true, type: true } },
        channel: { select: { name: true } },
      },
    });

    const activeBookings = bookings.filter((b) => ['confirmed', 'checked_in', 'checked_out'].includes(b.status));
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

    // Occupied room nights
    let occupiedRoomNights = 0;
    for (const b of activeBookings) {
      const overlapStart = Math.max(new Date(b.checkInDate).getTime(), monthStart.getTime());
      const overlapEnd = Math.min(new Date(b.checkOutDate).getTime(), monthEnd.getTime());
      const nights = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)));
      occupiedRoomNights += nights;
    }

    const occupancyRate = totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0;
    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const adr = occupiedRoomNights > 0 ? totalRevenue / occupiedRoomNights : 0;
    const revpar = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;

    // Payments
    const payments = await db.payment.findMany({
      where: {
        hotelId,
        paidAt: { gte: monthStart, lte: monthEnd },
        status: 'completed',
      },
    });
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    // By channel
    const channelSummary = activeBookings.reduce<Record<string, { count: number; revenue: number }>>((acc, b) => {
      const ch = b.channel?.name || 'Direct';
      if (!acc[ch]) acc[ch] = { count: 0, revenue: 0 };
      acc[ch].count++;
      acc[ch].revenue += b.totalPrice;
      return acc;
    }, {});

    // By room type
    const roomTypeSummary = activeBookings.reduce<Record<string, { count: number; revenue: number; nights: number }>>((acc, b) => {
      const rt = b.room.type;
      if (!acc[rt]) acc[rt] = { count: 0, revenue: 0, nights: 0 };
      acc[rt].count++;
      acc[rt].revenue += b.totalPrice;
      acc[rt].nights += b.numNights;
      return acc;
    }, {});

    const fmt = (amount: number) => {
      try {
        return amount.toLocaleString(undefined, { style: 'currency', currency: hotel.currency });
      } catch {
        return `${hotel.currency} ${amount.toLocaleString()}`;
      }
    };

    const monthLabel = format(targetMonth, 'MMMM yyyy');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Monthly Report - ${monthLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    @media print { body { padding: 0; } }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric .value { font-size: 22px; font-weight: 700; }
    .metric .label { font-size: 12px; color: #666; margin-top: 4px; }
    h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #10B981; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; border-top: 2px solid #ddd; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <h1>${hotel.name}</h1>
  <p class="subtitle">Monthly Summary — ${monthLabel}</p>

  <div class="grid">
    <div class="metric">
      <div class="value">${fmt(totalRevenue)}</div>
      <div class="label">Total Revenue</div>
    </div>
    <div class="metric">
      <div class="value">${Math.round(occupancyRate)}%</div>
      <div class="label">Occupancy Rate</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(adr)}</div>
      <div class="label">ADR</div>
    </div>
    <div class="metric">
      <div class="value">${activeBookings.length}</div>
      <div class="label">Total Bookings</div>
    </div>
  </div>

  <div class="grid">
    <div class="metric">
      <div class="value">${fmt(revpar)}</div>
      <div class="label">RevPAR</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(totalCollected)}</div>
      <div class="label">Payments Collected</div>
    </div>
    <div class="metric">
      <div class="value">${occupiedRoomNights}</div>
      <div class="label">Room Nights Sold</div>
    </div>
    <div class="metric">
      <div class="value">${cancelledBookings.length}</div>
      <div class="label">Cancellations</div>
    </div>
  </div>

  <h2>Revenue by Channel</h2>
  <table>
    <thead><tr><th>Channel</th><th style="text-align:right">Bookings</th><th style="text-align:right">Revenue</th></tr></thead>
    <tbody>
      ${Object.entries(channelSummary).sort((a, b) => b[1].revenue - a[1].revenue).map(([ch, data]) =>
        `<tr><td>${ch}</td><td style="text-align:right">${data.count}</td><td style="text-align:right">${fmt(data.revenue)}</td></tr>`
      ).join('')}
      <tr class="total-row"><td>Total</td><td style="text-align:right">${activeBookings.length}</td><td style="text-align:right">${fmt(totalRevenue)}</td></tr>
    </tbody>
  </table>

  <h2>Revenue by Room Type</h2>
  <table>
    <thead><tr><th>Room Type</th><th style="text-align:right">Bookings</th><th style="text-align:right">Nights</th><th style="text-align:right">Revenue</th></tr></thead>
    <tbody>
      ${Object.entries(roomTypeSummary).sort((a, b) => b[1].revenue - a[1].revenue).map(([rt, data]) =>
        `<tr><td class="capitalize">${rt.replace('_', ' ')}</td><td style="text-align:right">${data.count}</td><td style="text-align:right">${data.nights}</td><td style="text-align:right">${fmt(data.revenue)}</td></tr>`
      ).join('')}
    </tbody>
  </table>

  <div class="footer">
    Generated by EasyBeds on ${new Date().toLocaleString()} &middot; ${hotel.name} &middot; ${hotel.address || hotel.city || ''}
  </div>
</body>
</html>`;

    const reqFormat = request.nextUrl.searchParams.get('format');
    if (reqFormat === 'pdf') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="monthly-report-${format(targetMonth, 'yyyy-MM')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, month: format(targetMonth, 'yyyy-MM') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate monthly report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
