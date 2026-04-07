import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signJwt } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { emailVerificationTemplate } from '@/lib/email-templates';

// POST /api/auth/register — Hotel owner signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, hotelName, hotelSlug, phone, country, city, address } = body;

    if (!name || !email || !password || !hotelName || !hotelSlug) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, hotelName, and hotelSlug are required.' },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    // Check if hotel slug already exists
    const existingHotel = await db.hotel.findUnique({ where: { slug: hotelSlug } });
    if (existingHotel) {
      return NextResponse.json(
        { success: false, error: 'This hotel slug is already taken.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const hashedVerificationToken = await hash(verificationToken, 10);
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create User, Hotel, and HotelUser in a transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          emailVerified: false,
          verificationToken: hashedVerificationToken,
          verificationTokenExpiry: verificationExpiry,
        },
      });

      const hotel = await tx.hotel.create({
        data: {
          name: hotelName,
          slug: hotelSlug,
          phone: phone || null,
          email: email,
          country: country || 'Tanzania',
          city: city || null,
          address: address || null,
          plan: 'free',
        },
      });

      const hotelUser = await tx.hotelUser.create({
        data: {
          hotelId: hotel.id,
          userId: user.id,
          role: 'owner',
        },
      });

      return { user, hotel, hotelUser };
    });

    // Send verification email in background (don't block registration)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const verifyLink = `${origin}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    const template = emailVerificationTemplate({
      name: result.user.name,
      verifyLink,
    });

    // Fire and forget — don't await to keep registration fast
    sendEmail({
      to: result.user.email,
      subject: template.subject,
      html: template.html,
    }).catch((err) => {
      console.error('[REGISTER] Failed to send verification email:', err);
    });

    const token = signJwt({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      hotelId: result.hotel.id,
      role: 'owner',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
          },
          hotel: {
            id: result.hotel.id,
            name: result.hotel.name,
            slug: result.hotel.slug,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
