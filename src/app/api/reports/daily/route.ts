import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

// GET /api/reports/daily?hotelId=xxx&date=YYYY-MM-DD&format=pdf
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

    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });

    // Occupied rooms
    const blocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: dayEnd },
        endDate: { gt: targetDate },
      },
      include: {
        booking: {
          include: {
            guest: { select: { firstName: true, lastName: true } },
            room: { select: { roomNumber: true, name: true } },
            channel: { select: { name: true } },
          },
        },
        room: { select: { roomNumber: true, name: true, type: true } },
      },
    });

    const occupiedBlocks = blocks.filter((b) => b.blockType === 'booking' && b.booking);
    const occupancyRate = totalRooms > 0 ? (occupiedBlocks.length / totalRooms) * 100 : 0;

    // Arrivals (check-ins today)
    const arrivals = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in'] },
        checkInDate: { gte: targetDate, lte: dayEnd },
      },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true, name: true } },
        channel: { select: { name: true } },
      },
    });

    // Departures (check-outs today)
    const departures = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['checked_out'] },
        checkOutDate: { gte: targetDate, lte: dayEnd },
      },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true, name: true } },
        channel: { select: { name: true } },
      },
    });

    // Revenue
    const todayRevenue = occupiedBlocks.reduce((sum, b) => sum + (b.booking?.pricePerNight || 0), 0);

    // Payments today
    const payments = await db.payment.findMany({
      where: {
        hotelId,
        paidAt: { gte: targetDate, lte: dayEnd },
        status: 'completed',
      },
    });
    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

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
  <title>Daily Report - ${format(targetDate, 'MMM d, yyyy')}</title>
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
    .empty-state { text-align: center; padding: 16px; color: #a1a1aa; font-style: italic; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-amber { background: #fef3c7; color: #92400e; }

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
      <div class="subtitle">Daily Report &mdash; ${format(targetDate, 'EEEE, MMMM d, yyyy')}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="value">${occupiedBlocks.length}/${totalRooms}</div>
        <div class="label">Rooms Occupied</div>
      </div>
      <div class="kpi-card">
        <div class="value">${Math.round(occupancyRate)}%</div>
        <div class="label">Occupancy Rate</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(todayRevenue)}</div>
        <div class="label">Room Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="value">${fmt(paymentsTotal)}</div>
        <div class="label">Payments Collected</div>
      </div>
    </div>

    <div class="section-title">Arrivals (${arrivals.length})</div>
    <table>
      <thead><tr><th>Guest</th><th>Room</th><th>Channel</th><th class="text-right">Rate</th><th class="text-right">Nights</th></tr></thead>
      <tbody>
        ${arrivals.map((a) => `<tr><td>${a.guest.firstName} ${a.guest.lastName}</td><td>${a.room.roomNumber}</td><td>${a.channel?.name || 'Direct'}</td><td class="text-right">${fmt(a.pricePerNight)}</td><td class="text-right">${a.numNights}</td></tr>`).join('')}
        ${arrivals.length === 0 ? '<tr><td colspan="5" class="empty-state">No arrivals today</td></tr>' : ''}
      </tbody>
    </table>

    <div class="section-title">Departures (${departures.length})</div>
    <table>
      <thead><tr><th>Guest</th><th>Room</th><th class="text-right">Total</th><th>Status</th></tr></thead>
      <tbody>
        ${departures.map((d) => `<tr><td>${d.guest.firstName} ${d.guest.lastName}</td><td>${d.room.roomNumber}</td><td class="text-right">${fmt(d.totalPrice)}</td><td><span class="badge badge-green">Checked Out</span></td></tr>`).join('')}
        ${departures.length === 0 ? '<tr><td colspan="4" class="empty-state">No departures today</td></tr>' : ''}
      </tbody>
    </table>

    <div class="section-title">In-House Guests (${occupiedBlocks.length})</div>
    <table>
      <thead><tr><th>Guest</th><th>Room</th><th>Channel</th><th>Check-out</th></tr></thead>
      <tbody>
        ${occupiedBlocks.map((b) => `<tr><td>${b.booking!.guest.firstName} ${b.booking!.guest.lastName}</td><td>${b.room.roomNumber}</td><td>${b.booking!.channel?.name || 'Direct'}</td><td>${format(new Date(b.booking!.checkOutDate), 'MMM d')}</td></tr>`).join('')}
        ${occupiedBlocks.length === 0 ? '<tr><td colspan="4" class="empty-state">No in-house guests</td></tr>' : ''}
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
          'Content-Disposition': `attachment; filename="daily-report-${format(targetDate, 'yyyy-MM-dd')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, date: format(targetDate, 'yyyy-MM-dd') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate daily report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
