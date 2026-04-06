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

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Daily Report - ${format(targetDate, 'MMM d, yyyy')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    @media print { body { padding: 0; } }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric .value { font-size: 24px; font-weight: 700; }
    .metric .label { font-size: 12px; color: #666; margin-top: 4px; }
    h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #10B981; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-amber { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <h1>${hotel.name}</h1>
  <p class="subtitle">Daily Report — ${format(targetDate, 'EEEE, MMMM d, yyyy')}</p>

  <div class="grid">
    <div class="metric">
      <div class="value">${occupiedBlocks.length}/${totalRooms}</div>
      <div class="label">Rooms Occupied</div>
    </div>
    <div class="metric">
      <div class="value">${Math.round(occupancyRate)}%</div>
      <div class="label">Occupancy Rate</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(todayRevenue)}</div>
      <div class="label">Room Revenue</div>
    </div>
    <div class="metric">
      <div class="value">${fmt(paymentsTotal)}</div>
      <div class="label">Payments Collected</div>
    </div>
  </div>

  <h2>Arrivals (${arrivals.length})</h2>
  <table>
    <thead><tr><th>Guest</th><th>Room</th><th>Channel</th><th>Rate</th><th>Nights</th></tr></thead>
    <tbody>
      ${arrivals.map((a) => `<tr><td>${a.guest.firstName} ${a.guest.lastName}</td><td>${a.room.roomNumber}</td><td>${a.channel?.name || 'Direct'}</td><td>${fmt(a.pricePerNight)}</td><td>${a.numNights}</td></tr>`).join('')}
      ${arrivals.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">No arrivals today</td></tr>' : ''}
    </tbody>
  </table>

  <h2>Departures (${departures.length})</h2>
  <table>
    <thead><tr><th>Guest</th><th>Room</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>
      ${departures.map((d) => `<tr><td>${d.guest.firstName} ${d.guest.lastName}</td><td>${d.room.roomNumber}</td><td>${fmt(d.totalPrice)}</td><td><span class="badge badge-green">Checked Out</span></td></tr>`).join('')}
      ${departures.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No departures today</td></tr>' : ''}
    </tbody>
  </table>

  <h2>In-House Guests (${occupiedBlocks.length})</h2>
  <table>
    <thead><tr><th>Guest</th><th>Room</th><th>Channel</th><th>Check-out</th></tr></thead>
    <tbody>
      ${occupiedBlocks.map((b) => `<tr><td>${b.booking!.guest.firstName} ${b.booking!.guest.lastName}</td><td>${b.room.roomNumber}</td><td>${b.booking!.channel?.name || 'Direct'}</td><td>${format(new Date(b.booking!.checkOutDate), 'MMM d')}</td></tr>`).join('')}
      ${occupiedBlocks.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No in-house guests</td></tr>' : ''}
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
          'Content-Disposition': `inline; filename="daily-report-${format(targetDate, 'yyyy-MM-dd')}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { html, date: format(targetDate, 'yyyy-MM-dd') } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate daily report.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
