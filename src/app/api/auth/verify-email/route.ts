import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { signJwt } from '@/lib/auth';

// POST /api/auth/verify-email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    // Find all users with a verification token that hasn't expired
    const usersWithVerification = await db.user.findMany({
      where: {
        verificationToken: { not: null },
        verificationTokenExpiry: { gt: new Date() },
      },
      include: {
        hotels: {
          where: { isActive: true },
          include: { hotel: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Find the user whose verification token matches
    let matchedUser: (typeof usersWithVerification)[number] | null = null;
    for (const user of usersWithVerification) {
      if (user.verificationToken && (await compare(token, user.verificationToken))) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear token
    await db.user.update({
      where: { id: matchedUser.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // If user has a hotel, issue a token so they can start using the app
    let tokenData: { token: string; hotel: { id: string; name: string; slug: string } } | null = null;
    if (matchedUser.hotels.length > 0) {
      const hotelMembership = matchedUser.hotels[0];
      const jwtToken = signJwt({
        userId: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.name,
        hotelId: hotelMembership.hotelId,
        role: hotelMembership.role,
        platformRole: 'user',
      });

      tokenData = {
        token: jwtToken,
        hotel: {
          id: hotelMembership.hotel.id,
          name: hotelMembership.hotel.name,
          slug: hotelMembership.hotel.slug,
        },
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: tokenData
        ? {
            token: tokenData.token,
            user: {
              id: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
            },
            hotel: tokenData.hotel,
          }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify email.';
    console.error('[VERIFY-EMAIL]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
