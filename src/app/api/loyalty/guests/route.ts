import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/loyalty/guests?hotelId=xxx — List guests with points
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'loyaltyPoints';

    const where: Record<string, unknown> = { hotelId };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> =
      sortBy === 'totalSpent' ? { totalSpent: 'desc' }
      : sortBy === 'totalStays' ? { totalStays: 'desc' }
      : sortBy === 'name' ? { firstName: 'asc' }
      : { loyaltyPoints: 'desc' };

    const [guests, total] = await Promise.all([
      db.guest.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          vip: true, loyaltyPoints: true, totalStays: true, totalSpent: true,
          createdAt: true,
          _count: { select: { bookings: true, loyaltyTransactions: true } },
        },
      }),
      db.guest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        guests,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch loyalty guests.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
