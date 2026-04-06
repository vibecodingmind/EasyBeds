import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, addDays, format } from 'date-fns';

// POST /api/night-audit/run?hotelId=xxx — Run night audit for today
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const auditorId = body.auditorId || null;
    const dateStr = body.date || format(new Date(), 'yyyy-MM-dd');
    const auditDate = startOfDay(new Date(dateStr));

    // Check if audit already exists for this date
    const existingAudit = await db.nightAudit.findFirst({
      where: { hotelId, auditDate },
    });

    if (existingAudit) {
      return NextResponse.json(
        { success: false, error: 'Night audit already exists for this date.' },
        { status: 409 }
      );
    }

    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found.' },
        { status: 404 }
      );
    }

    // Get all rooms for this hotel
    const allRooms = await db.room.findMany({
      where: { hotelId },
      select: { id: true, status: true },
    });

    const totalRooms = allRooms.length;
    const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
    const outOfOrderRooms = allRooms.filter(
      (r) => r.status === 'out_of_order' || r.status === 'maintenance'
    ).length;
    const availableRooms = totalRooms - occupiedRooms - outOfOrderRooms;

    // Count rooms occupied by active bookings on this date
    const activeBookings = await db.booking.count({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in'] },
        checkInDate: { lte: addDays(auditDate, 1) },
        checkOutDate: { gt: auditDate },
      },
    });

    // Revenue: sum of payments for bookings checking out today
    const checkoutPayments = await db.payment.findMany({
      where: {
        hotelId,
        status: 'completed',
        booking: {
          status: 'checked_out',
          checkOutDate: {
            gte: auditDate,
            lt: addDays(auditDate, 1),
          },
        },
      },
      select: { amount: true, method: true },
    });

    const roomRevenue = checkoutPayments.reduce((sum, p) => sum + p.amount, 0);

    // Payment breakdown
    const allPayments = await db.payment.findMany({
      where: {
        hotelId,
        status: 'completed',
        createdAt: {
          gte: auditDate,
          lt: addDays(auditDate, 1),
        },
      },
      select: { amount: true, method: true },
    });

    const cashReceived = allPayments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);
    const cardReceived = allPayments
      .filter((p) => p.method === 'card')
      .reduce((sum, p) => sum + p.amount, 0);
    const mobileMoneyReceived = allPayments
      .filter((p) => p.method === 'mobile_money')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = allPayments.reduce((sum, p) => sum + p.amount, 0) - cashReceived - cardReceived - mobileMoneyReceived;

    // Calculate metrics
    const occupancyRate = totalRooms > 0 ? (activeBookings / totalRooms) * 100 : 0;
    const adr = activeBookings > 0 ? roomRevenue / activeBookings : 0;
    const revpar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

    const totalRevenue = roomRevenue;

    // Create the audit record
    const audit = await db.nightAudit.create({
      data: {
        hotelId,
        auditorId,
        auditDate,
        totalRooms,
        occupiedRooms: activeBookings,
        availableRooms,
        outOfOrderRooms,
        roomRevenue: Math.round(roomRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        revpar: Math.round(revpar * 100) / 100,
        cashReceived: Math.round(cashReceived * 100) / 100,
        cardReceived: Math.round(cardReceived * 100) / 100,
        mobileMoneyReceived: Math.round(mobileMoneyReceived * 100) / 100,
        pendingPayments: Math.max(0, Math.round(pendingPayments * 100) / 100),
        status: 'completed',
      },
    });

    return NextResponse.json({ success: true, data: audit }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run night audit.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/night-audit?hotelId=xxx&from=DATE&to=DATE
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

    const where: Record<string, unknown> = { hotelId };

    if (from || to) {
      where.auditDate = {};
      if (from) (where.auditDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.auditDate as Record<string, unknown>).lte = new Date(to);
    }

    const audits = await db.nightAudit.findMany({
      where,
      include: {
        auditor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { auditDate: 'desc' },
      take: 90, // Last 90 days max
    });

    return NextResponse.json({ success: true, data: audits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch night audits.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
