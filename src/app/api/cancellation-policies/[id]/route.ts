import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/cancellation-policies/:id?hotelId=xxx — Update policy
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const existing = await db.cancellationPolicy.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Policy not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, rules, isDefault, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (rules !== undefined) {
      if (!Array.isArray(rules) || rules.length === 0) {
        return NextResponse.json(
          { success: false, error: 'rules must be a non-empty array.' },
          { status: 400 }
        );
      }
      for (const rule of rules) {
        if (typeof rule.hoursBefore !== 'number' || typeof rule.chargePercent !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Each rule must have hoursBefore and chargePercent.' },
            { status: 400 }
          );
        }
      }
      updateData.rules = JSON.stringify(rules);
    }

    if (isDefault && !existing.isDefault) {
      await db.cancellationPolicy.updateMany({
        where: { hotelId, isDefault: true },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    }

    const policy = await db.cancellationPolicy.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update cancellation policy.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/cancellation-policies/:id?hotelId=xxx — Delete policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const existing = await db.cancellationPolicy.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Policy not found.' },
        { status: 404 }
      );
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default cancellation policy. Set another policy as default first.' },
        { status: 400 }
      );
    }

    await db.cancellationPolicy.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete cancellation policy.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
