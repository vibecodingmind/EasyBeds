import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signJwt } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

// ── In-memory rate limiting ──────────────────────────────────────────────────
// Max 20 login attempts per email per 15 minutes
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(email: string): { allowed: boolean; retryAfterMs: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();

  const entry = rateLimitStore.get(normalizedEmail);

  if (!entry) {
    rateLimitStore.set(normalizedEmail, { attempts: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  // If window expired, reset
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(normalizedEmail, { attempts: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  // Check if rate limited
  if (entry.attempts >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  // Increment attempts
  entry.attempts += 1;
  rateLimitStore.set(normalizedEmail, entry);
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean up expired entries to prevent memory leaks (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

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

    // ── Rate limiting check ──────────────────────────────────────────────
    const { allowed, retryAfterMs } = checkRateLimit(email);
    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${retryAfterSec} seconds.`,
          code: 'RATE_LIMITED',
          retryAfter: retryAfterSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
          },
        }
      );
    }

    // ── Auto-seed fallback: if database is empty, seed it directly ──────
    const userCount = await db.user.count();
    if (userCount === 0) {
      console.warn('[login] Database is empty — auto-seeding...');
      await seedDatabase();
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

    if (!(await verifyPassword(password, user.passwordHash))) {
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
