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

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Financial Report - ${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    @media print { body { padding: 0; } }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric .value { font-size: 22px; font-weight: 700; }
    .metric .label { font-size: 12px; color: #666; margin-top: 4px; }
    h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #10B981; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .total-row td { font-weight: 700; border-top: 2px solid #ddd; }
    .negative { color: #ef4444; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <h1>${hotel.name}</h1>
  <p class="subtitle">Financial Report — ${format(from, 'MMM d, yyyy')} to ${format(to, 'MMM d, yyyy')}</p>

  <div class="grid">
    <div class="metric">
      <div class="value">${fmt(totalRevenue)}</div>
      <div class="label">Gross Revenue</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(netRevenue)}</div>
      <div class="label">Net Revenue</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(totalCollected)}</div>
      <div class="label">Collected</div>
    </div>
  </div>

  <div class="grid">
    <div class="metric">
      <div class="value">${fmt(totalCommission)}</div>
      <div class="label">Commissions</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(outstanding)}</div>
      <div class="label">Outstanding</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(totalRefunds)}</div>
      <div class="label">Refunds</div>
    </div>
  </div>

  <h2>Commission Breakdown</h2>
  <table>
    <thead><tr><th>Channel</th><th class="text-right">Commission</th></tr></thead>
    <tbody>
      ${Object.entries(commissionDetails).sort((a, b) => b[1] - a[1]).map(([ch, comm]) =>
        `<tr><td>${ch}</td><td class="text-right">${fmt(comm)}</td></tr>`
      ).join('')}
      <tr class="total-row"><td>Total Commission</td><td class="text-right">${fmt(totalCommission)}</td></tr>
    </tbody>
  </table>

  <h2>Payments by Method</h2>
  <table>
    <thead><tr><th>Method</th><th class="text-right">Count</th><th class="text-right">Amount</th></tr></thead>
    <tbody>
      ${Object.entries(paymentByMethod).sort((a, b) => b[1].total - a[1].total).map(([method, data]) =>
        `<tr><td class="capitalize">${method}</td><td class="text-right">${data.count}</td><td class="text-right">${fmt(data.total)}</td></tr>`
      ).join('')}
      <tr class="total-row"><td>Total</td><td class="text-right">${payments.length}</td><td class="text-right">${fmt(totalCollected)}</td></tr>
    </tbody>
  </table>

  <h2>Key Metrics</h2>
  <table>
    <tr><td>Total Bookings</td><td class="text-right">${activeBookings.length}</td></tr>
    <tr><td>Room Nights Sold</td><td class="text-right">${occupiedRoomNights}</td></tr>
    <tr><td>ADR (Average Daily Rate)</td><td class="text-right">${fmt(adr)}</td></tr>
    <tr><td>RevPAR (Revenue Per Available Room)</td><td class="text-right">${fmt(revpar)}</td></tr>
    <tr><td>Collection Rate</td><td class="text-right">${totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</td></tr>
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
          'Content-Disposition': `inline; filename="financial-report-${format(from, 'yyyy-MM-dd')}-to-${format(to, 'yyyy-MM-dd')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate financial report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
