import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

// GET /api/reports/financial?hotelId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD&format=pdf
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

    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });

    // Bookings
    const bookings = await db.booking.findMany({
      where: {
        hotelId,
        checkInDate: { lte: to },
        checkOutDate: { gt: from },
      },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true, name: true } },
        channel: { select: { id: true, name: true, type: true, commission: true } },
      },
    });

    const activeBookings = bookings.filter((b) =>
      ['confirmed', 'checked_in', 'checked_out'].includes(b.status),
    );

    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Commission by channel
    let totalCommission = 0;
    const commissionDetails = activeBookings.reduce<Record<string, number>>((acc, b) => {
      const ch = b.channel?.name || 'Direct';
      const comm = b.channel?.commission ? b.totalPrice * (b.channel.commission / 100) : 0;
      acc[ch] = (acc[ch] || 0) + comm;
      totalCommission += comm;
      return acc;
    }, {});

    const netRevenue = totalRevenue - totalCommission;

    // Payments
    const payments = await db.payment.findMany({
      where: {
        hotelId,
        paidAt: { gte: from, lte: to },
        status: 'completed',
      },
    });

    const paymentByMethod = payments.reduce<Record<string, { count: number; total: number }>>((acc, p) => {
      const method = p.method.replace('_', ' ');
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count++;
      acc[method].total += p.amount;
      return acc;
    }, {});

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    // Pending / outstanding
    const outstanding = totalRevenue - totalCollected;

    // Occupied room nights
    let occupiedRoomNights = 0;
    for (const b of activeBookings) {
      const overlapStart = Math.max(new Date(b.checkInDate).getTime(), from.getTime());
      const overlapEnd = Math.min(new Date(b.checkOutDate).getTime(), to.getTime());
      occupiedRoomNights += Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)));
    }

    const adr = occupiedRoomNights > 0 ? totalRevenue / occupiedRoomNights : 0;
    const revpar = (totalRooms * totalDays) > 0 ? totalRevenue / (totalRooms * totalDays) : 0;

    // Refunds
    const refunds = await db.payment.findMany({
      where: {
        hotelId,
        createdAt: { gte: from, lte: to },
        status: { in: ['refunded', 'partially_refunded'] },
      },
    });
    const totalRefunds = refunds.reduce((sum, p) => sum + p.amount, 0);

    const fmt = (amount: number) => {
      try {
        return amount.toLocaleString(undefined, { style: 'currency', currency: hotel.currency });
      } catch {
        return `${hotel.currency} ${amount.toLocaleString()}`;
      }
    };

    const hotelAddress = [hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ');
    const generatedAt = new Date().toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Financial Report - ${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}</title>
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

    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
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
    .negative { color: #dc2626; }

    .metrics-table td { padding: 10px 14px; border-bottom: 1px solid #f4f4f5; }
    .metrics-table td:first-child { font-weight: 500; }

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
      <div class="subtitle">Financial Report &mdash; ${format(from, 'MMM d, yyyy')} to ${format(to, 'MMM d, yyyy')}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="value">${fmt(totalRevenue)}</div>
        <div class="label">Gross Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(netRevenue)}</div>
        <div class="label">Net Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(totalCollected)}</div>
        <div class="label">Collected</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="value">${fmt(totalCommission)}</div>
        <div class="label">Commissions</div>
      </div>
      <div class="kpi-card">
        <div class="value${outstanding > 0 ? ' negative' : ''}">${fmt(outstanding)}</div>
        <div class="label">Outstanding</div>
      </div>
      <div class="kpi-card">
        <div class="value${totalRefunds > 0 ? ' negative' : ''}">${fmt(totalRefunds)}</div>
        <div class="label">Refunds</div>
      </div>
    </div>

    <div class="section-title">Commission Breakdown</div>
    <table>
      <thead><tr><th>Channel</th><th class="text-right">Commission</th></tr></thead>
      <tbody>
        ${Object.entries(commissionDetails).sort((a, b) => b[1] - a[1]).map(([ch, comm]) =>
          `<tr><td>${ch}</td><td class="text-right">${fmt(comm)}</td></tr>`
        ).join('')}
        <tr class="total-row"><td>Total Commission</td><td class="text-right">${fmt(totalCommission)}</td></tr>
      </tbody>
    </table>

    <div class="section-title">Payments by Method</div>
    <table>
      <thead><tr><th>Method</th><th class="text-right">Count</th><th class="text-right">Amount</th></tr></thead>
      <tbody>
        ${Object.entries(paymentByMethod).sort((a, b) => b[1].total - a[1].total).map(([method, data]) =>
          `<tr><td>${method.charAt(0).toUpperCase() + method.slice(1)}</td><td class="text-right">${data.count}</td><td class="text-right">${fmt(data.total)}</td></tr>`
        ).join('')}
        <tr class="total-row"><td>Total</td><td class="text-right">${payments.length}</td><td class="text-right">${fmt(totalCollected)}</td></tr>
      </tbody>
    </table>

    <div class="section-title">Key Metrics</div>
    <table class="metrics-table">
      <tr><td>Total Bookings</td><td class="text-right">${activeBookings.length}</td></tr>
      <tr><td>Room Nights Sold</td><td class="text-right">${occupiedRoomNights}</td></tr>
      <tr><td>ADR (Average Daily Rate)</td><td class="text-right">${fmt(adr)}</td></tr>
      <tr><td>RevPAR (Revenue Per Available Room)</td><td class="text-right">${fmt(revpar)}</td></tr>
      <tr><td>Collection Rate</td><td class="text-right">${totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</td></tr>
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
          'Content-Disposition': `attachment; filename="financial-report-${format(from, 'yyyy-MM-dd')}-to-${format(to, 'yyyy-MM-dd')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate financial report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
