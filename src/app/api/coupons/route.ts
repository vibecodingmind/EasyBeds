import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/coupons?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const coupons = await db.coupon.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch coupons.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/coupons?hotelId=xxx
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      minStay,
      maxUses,
      validFrom,
      validTo,
      appliesTo,
      channelIds,
      isActive,
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'code, type, and value are required.' },
        { status: 400 },
      );
    }

    const validTypes = ['percentage', 'fixed', 'free_nights'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Check for duplicate code
    const existing = await db.coupon.findFirst({
      where: { hotelId, code: code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A coupon with this code already exists.' },
        { status: 409 },
      );
    }

    const coupon = await db.coupon.create({
      data: {
        hotelId,
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minStay: minStay !== undefined ? Number(minStay) : null,
        maxUses: maxUses !== undefined ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        appliesTo: appliesTo || null,
        channelIds: channelIds ? JSON.stringify(channelIds) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
