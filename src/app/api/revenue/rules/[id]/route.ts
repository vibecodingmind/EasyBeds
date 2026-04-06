import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/revenue/rules/[id]?hotelId=xxx
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

    const existing = await db.dynamicRateRule.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Rate rule not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.ruleType !== undefined) updateData.ruleType = body.ruleType;
    if (body.adjustmentType !== undefined) updateData.adjustmentType = body.adjustmentType;
    if (body.adjustmentValue !== undefined) updateData.adjustmentValue = Number(body.adjustmentValue);
    if (body.roomTypeId !== undefined) updateData.roomTypeId = body.roomTypeId || null;
    if (body.channelId !== undefined) updateData.channelId = body.channelId || null;
    if (body.validFrom !== undefined) updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validTo !== undefined) updateData.validTo = body.validTo ? new Date(body.validTo) : null;
    if (body.daysOfWeek !== undefined) updateData.daysOfWeek = body.daysOfWeek ? JSON.stringify(body.daysOfWeek) : null;
    if (body.minOccupancy !== undefined) updateData.minOccupancy = body.minOccupancy !== null ? Number(body.minOccupancy) : null;
    if (body.maxOccupancy !== undefined) updateData.maxOccupancy = body.maxOccupancy !== null ? Number(body.maxOccupancy) : null;
    if (body.priority !== undefined) updateData.priority = Number(body.priority);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const rule = await db.dynamicRateRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update rate rule.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/revenue/rules/[id]?hotelId=xxx
export async function DELETE(
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

    const existing = await db.dynamicRateRule.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Rate rule not found.' },
        { status: 404 },
      );
    }

    await db.dynamicRateRule.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete rate rule.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
