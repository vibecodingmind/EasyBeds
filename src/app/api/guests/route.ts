import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/guests?hotelId=xxx&search=xxx&page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = { hotelId };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [guests, total] = await Promise.all([
      db.guest.findMany({
        where,
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.guest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        guests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch guests.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/guests?hotelId=xxx
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      firstName, lastName, email, phone, idNumber, idType,
      nationality, address, city, country, notes, vip,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'firstName and lastName are required.' },
        { status: 400 }
      );
    }

    // Check for duplicate guest by email or phone within same hotel
    if (email || phone) {
      const duplicateWhere: Record<string, unknown>[] = [];
      if (email) duplicateWhere.push({ hotelId, email });
      if (phone) duplicateWhere.push({ hotelId, phone });

      if (duplicateWhere.length > 0) {
        const existingGuest = await db.guest.findFirst({
          where: { OR: duplicateWhere },
        });

        if (existingGuest) {
          return NextResponse.json(
            { success: false, error: 'A guest with this email or phone already exists.', data: { existingGuest } },
            { status: 409 }
          );
        }
      }
    }

    const guest = await db.guest.create({
      data: {
        hotelId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        idNumber: idNumber || null,
        idType: idType || null,
        nationality: nationality || null,
        address: address || null,
        city: city || null,
        country: country || null,
        notes: notes || null,
        vip: vip || false,
      },
    });

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create guest.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
