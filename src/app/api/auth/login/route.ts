import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signJwt } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, hotelId: selectedHotelId } = body;

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

    // ── ADMIN LOGIN ──────────────────────────────────────────────
    if (user.role === 'admin') {
      // Admin gets all hotels to choose from
      const allHotels = await db.hotel.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, city: true, country: true, plan: true },
        orderBy: { name: 'asc' },
      });

      // If admin also has hotel memberships, include their roles
      const allHotelsWithRoles = allHotels.map((h) => {
        const membership = user.hotels.find((uh) => uh.hotelId === h.id);
        return {
          ...h,
          role: membership?.role || 'admin',
        };
      });

      // Pick first hotel or selected hotel as default
      const targetHotel = selectedHotelId
        ? allHotels.find((h) => h.id === selectedHotelId)
        : allHotels[0];

      if (!targetHotel) {
        return NextResponse.json(
          { success: false, error: 'No hotels found on the platform.' },
          { status: 403 }
        );
      }

      const token = signJwt({
        userId: user.id,
        email: user.email,
        name: user.name,
        hotelId: targetHotel.id,
        role: 'admin',
        platformRole: 'admin',
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
            id: targetHotel.id,
            name: targetHotel.name,
            slug: targetHotel.slug,
          },
          role: 'admin',
          platformRole: 'admin',
          allHotels: allHotelsWithRoles,
        },
      });
    }

    // ── REGULAR USER LOGIN ──────────────────────────────────────
    const hotelMembership = selectedHotelId
      ? user.hotels.find((h) => h.hotelId === selectedHotelId)
      : user.hotels[0];

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
      platformRole: 'user',
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
        platformRole: 'user',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
