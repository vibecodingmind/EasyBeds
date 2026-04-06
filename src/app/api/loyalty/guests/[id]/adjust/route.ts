import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/loyalty/guests/[id]/adjust — Manual points adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id: guestId } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;

    const body = await request.json();
    const { points, reason, bookingId } = body;

    if (points === undefined || typeof points !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Points value is required (positive to add, negative to remove).' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(points)) {
      return NextResponse.json(
        { success: false, error: 'Points must be a whole number.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reason for adjustment is required.' },
        { status: 400 }
      );
    }

    // Check guest exists
    const guest = await db.guest.findFirst({
      where: { id: guestId, hotelId },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found.' }, { status: 404 });
    }

    // Check if removing points would go negative
    if (points < 0 && guest.loyaltyPoints < Math.abs(points)) {
      return NextResponse.json(
        { success: false, error: `Cannot remove ${Math.abs(points)} points. Guest only has ${guest.loyaltyPoints} points.` },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const newBalance = guest.loyaltyPoints + points;

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          hotelId,
          guestId,
          bookingId,
          type: 'adjustment',
          points,
          balanceAfter: newBalance,
          description: reason.trim(),
        },
      });

      await tx.guest.update({
        where: { id: guestId },
        data: { loyaltyPoints: newBalance },
      });

      return { transaction, newBalance };
    });

    // Audit log
    await db.auditLog.create({
      data: {
        hotelId,
        entityType: 'guest',
        entityId: guestId,
        action: 'update',
        description: `Manual loyalty points adjustment: ${points > 0 ? '+' : ''}${points} points. Reason: ${reason.trim()}`,
        userId: auth.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance,
        previousBalance: guest.loyaltyPoints,
        adjustment: points,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to adjust points.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
