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
    const hotelAddress = [hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ');
    const generatedAt = new Date().toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Monthly Report - ${monthLabel}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px; line-height: 1.55; color: #18181b; background: #fff;
    }
    .page { max-width: 210mm; margin: 0 auto; }

    .doc-header { padding: 0 0 16px; border-bottom: 2px solid #10b981; margin-bottom: 24px; }
    .doc-header h1 { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 2px; }
    .doc-header .subtitle { font-size: 13px; color: #52525b; margin-top: 2px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px; text-align: center; }
    .kpi-card .value { font-size: 20px; font-weight: 700; color: #18181b; }
    .kpi-card .label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }

    .section-title { font-size: 14px; font-weight: 700; color: #18181b; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #10b981; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    thead th { background: #f4f4f5; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #52525b; border-bottom: 2px solid #e4e4e7; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #f4f4f5; color: #27272a; }
    tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .total-row td { font-weight: 700; border-top: 2px solid #d4d4d8; background: #fafafa; }

    .doc-footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; text-align: center; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: none; }
      .doc-header, .section-title, .kpi-grid, table { page-break-inside: avoid; }
    }
    @media screen and (max-width: 640px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      body { padding: 0 12px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <h1>${hotel.name}</h1>
      <div class="subtitle">Monthly Summary &mdash; ${monthLabel}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="value">${fmt(totalRevenue)}</div>
        <div class="label">Total Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="value">${Math.round(occupancyRate)}%</div>
        <div class="label">Occupancy Rate</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(adr)}</div>
        <div class="label">ADR</div>
      </div>
      <div class="kpi-card">
        <div class="value">${activeBookings.length}</div>
        <div class="label">Total Bookings</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="value">${fmt(revpar)}</div>
        <div class="label">RevPAR</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(totalCollected)}</div>
        <div class="label">Payments Collected</div>
      </div>
      <div class="kpi-card">
        <div class="value">${occupiedRoomNights}</div>
        <div class="label">Room Nights Sold</div>
      </div>
      <div class="kpi-card">
        <div class="value">${cancelledBookings.length}</div>
        <div class="label">Cancellations</div>
      </div>
    </div>

    <div class="section-title">Revenue by Channel</div>
    <table>
      <thead><tr><th>Channel</th><th class="text-right">Bookings</th><th class="text-right">Revenue</th></tr></thead>
      <tbody>
        ${Object.entries(channelSummary).sort((a, b) => b[1].revenue - a[1].revenue).map(([ch, data]) =>
          `<tr><td>${ch}</td><td class="text-right">${data.count}</td><td class="text-right">${fmt(data.revenue)}</td></tr>`
        ).join('')}
        <tr class="total-row"><td>Total</td><td class="text-right">${activeBookings.length}</td><td class="text-right">${fmt(totalRevenue)}</td></tr>
      </tbody>
    </table>

    <div class="section-title">Revenue by Room Type</div>
    <table>
      <thead><tr><th>Room Type</th><th class="text-right">Bookings</th><th class="text-right">Nights</th><th class="text-right">Revenue</th></tr></thead>
      <tbody>
        ${Object.entries(roomTypeSummary).sort((a, b) => b[1].revenue - a[1].revenue).map(([rt, data]) =>
          `<tr><td>${rt.replace('_', ' ')}</td><td class="text-right">${data.count}</td><td class="text-right">${data.nights}</td><td class="text-right">${fmt(data.revenue)}</td></tr>`
        ).join('')}
      </tbody>
    </table>

    <div class="doc-footer">
      Generated by EasyBeds on ${generatedAt} &middot; ${hotel.name}${hotelAddress ? ` &middot; ${hotelAddress}` : ''}
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
</body>
</html>`;

    const reqFormat = request.nextUrl.searchParams.get('format');
    if (reqFormat === 'pdf') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="monthly-report-${format(targetMonth, 'yyyy-MM')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, month: format(targetMonth, 'yyyy-MM') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate monthly report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
