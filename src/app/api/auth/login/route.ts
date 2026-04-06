import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signJwt } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        hotels: {
          where: { isActive: true },
          include: { hotel: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const hotelMembership = user.hotels[0];
    if (!hotelMembership) {
      return NextResponse.json(
        { success: false, error: 'No active hotel found for this user.' },
        { status: 403 }
      );
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name,
      hotelId: hotelMembership.hotelId,
      role: hotelMembership.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        hotel: {
          id: hotelMembership.hotel.id,
          name: hotelMembership.hotel.name,
          slug: hotelMembership.hotel.slug,
        },
        role: hotelMembership.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
