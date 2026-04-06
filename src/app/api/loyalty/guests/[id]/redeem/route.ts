import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/loyalty/guests/[id]/redeem — Redeem points for discount
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
    const { points, bookingId, description } = body;

    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a positive number.' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(points)) {
      return NextResponse.json(
        { success: false, error: 'Points must be a whole number.' },
        { status: 400 }
      );
    }

    // Check guest exists and has enough points
    const guest = await db.guest.findFirst({
      where: { id: guestId, hotelId },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found.' }, { status: 404 });
    }

    if (guest.loyaltyPoints < points) {
      return NextResponse.json(
        { success: false, error: `Insufficient points. Guest has ${guest.loyaltyPoints} points, but ${points} requested.` },
        { status: 400 }
      );
    }

    // Get hotel config for point value
    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      select: { currency: true, loyaltyPointsPerCurrency: true },
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    // Calculate discount: points * pointsPerCurrency inverse
    // 100 points = 1000 TZS (or configurable via loyaltyPointsPerCurrency)
    const pointsValue = hotel.loyaltyPointsPerCurrency > 0 ? 1 / hotel.loyaltyPointsPerCurrency : 10;
    const discountAmount = points * pointsValue;

    const result = await db.$transaction(async (tx) => {
      const newBalance = guest.loyaltyPoints - points;

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          hotelId,
          guestId,
          bookingId,
          type: 'redeem',
          points: -points,
          balanceAfter: newBalance,
          description: description || `Redeemed ${points} points for ${discountAmount.toFixed(2)} ${hotel.currency} discount`,
        },
      });

      await tx.guest.update({
        where: { id: guestId },
        data: { loyaltyPoints: newBalance },
      });

      return { transaction, discountAmount, newBalance };
    });

    // Audit log
    await db.auditLog.create({
      data: {
        hotelId,
        entityType: 'guest',
        entityId: guestId,
        action: 'update',
        description: `Redeemed ${points} loyalty points for ${result.discountAmount.toFixed(2)} ${hotel?.currency || 'TZS'} discount`,
        userId: auth.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: result.transaction,
        discountAmount: result.discountAmount,
        currency: hotel.currency,
        newBalance: result.newBalance,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to redeem points.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
