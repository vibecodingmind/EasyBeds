import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/loyalty/guests/[id] — Get guest loyalty history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;

    const guest = await db.guest.findFirst({
      where: { id, hotelId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        vip: true, loyaltyPoints: true, totalStays: true, totalSpent: true,
        createdAt: true,
      },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found.' }, { status: 404 });
    }

    const transactions = await db.loyaltyTransaction.findMany({
      where: { guestId: id, hotelId },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true, confirmationCode: true, checkInDate: true, checkOutDate: true,
            room: { select: { name: true, roomNumber: true } },
          },
        },
      },
    });

    // Summary stats
    const totalEarned = transactions
      .filter(t => t.type === 'earn' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.points, 0);
    const totalRedeemed = transactions
      .filter(t => t.type === 'redeem')
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    return NextResponse.json({
      success: true,
      data: {
        guest,
        transactions,
        summary: {
          totalEarned,
          totalRedeemed,
          currentBalance: guest.loyaltyPoints,
          transactionCount: transactions.length,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch guest loyalty data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
