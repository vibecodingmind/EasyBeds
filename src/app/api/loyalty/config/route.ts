import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/loyalty/config?hotelId=xxx — Get loyalty config
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;

    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      select: {
        id: true,
        loyaltyEnabled: true,
        loyaltyPointsPerCurrency: true,
        currency: true,
      },
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hotel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch loyalty config.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/loyalty/config — Update loyalty settings
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { hotelId, loyaltyEnabled, loyaltyPointsPerCurrency } = body;

    const targetHotelId = hotelId || auth.hotelId;
    const updateData: Record<string, unknown> = {};

    if (loyaltyEnabled !== undefined) updateData.loyaltyEnabled = loyaltyEnabled;
    if (loyaltyPointsPerCurrency !== undefined) {
      if (typeof loyaltyPointsPerCurrency !== 'number' || loyaltyPointsPerCurrency < 0) {
        return NextResponse.json(
          { success: false, error: 'loyaltyPointsPerCurrency must be a non-negative number.' },
          { status: 400 }
        );
      }
      updateData.loyaltyPointsPerCurrency = loyaltyPointsPerCurrency;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update.' }, { status: 400 });
    }

    const hotel = await db.hotel.update({
      where: { id: targetHotelId },
      data: updateData,
      select: { id: true, loyaltyEnabled: true, loyaltyPointsPerCurrency: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        hotelId: targetHotelId,
        entityType: 'hotel',
        entityId: targetHotelId,
        action: 'update',
        description: `Loyalty config updated: ${JSON.stringify(updateData)}`,
        userId: auth.userId,
      },
    });

    return NextResponse.json({ success: true, data: hotel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update loyalty config.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
