import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-middleware';

// PATCH /api/coupons/[id]?hotelId=xxx
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const existing = await db.coupon.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = Number(body.value);
    if (body.minStay !== undefined) updateData.minStay = body.minStay !== null ? Number(body.minStay) : null;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses !== null ? Number(body.maxUses) : null;
    if (body.validFrom !== undefined) updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validTo !== undefined) updateData.validTo = body.validTo ? new Date(body.validTo) : null;
    if (body.appliesTo !== undefined) updateData.appliesTo = body.appliesTo || null;
    if (body.channelIds !== undefined) updateData.channelIds = body.channelIds ? JSON.stringify(body.channelIds) : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/coupons/[id]?hotelId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const existing = await db.coupon.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found.' },
        { status: 404 },
      );
    }

    await db.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
