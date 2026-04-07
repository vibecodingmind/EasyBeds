import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/hotel?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      include: {
        _count: {
          select: {
            rooms: { where: { isActive: true } },
            bookings: true,
            guests: true,
            channels: { where: { isActive: true } },
            users: { where: { isActive: true } },
          },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: hotel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hotel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/hotel?hotelId=xxx
export async function PUT(request: NextRequest) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return auth.error;

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
      name, description, address, city, country, phone, email, website,
      logoUrl, timezone, checkInTime, checkOutTime, currency,
    } = body;

    const hotel = await db.hotel.update({
      where: { id: hotelId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(timezone !== undefined && { timezone }),
        ...(checkInTime !== undefined && { checkInTime }),
        ...(checkOutTime !== undefined && { checkOutTime }),
        ...(currency !== undefined && { currency }),
      },
    });

    return NextResponse.json({ success: true, data: hotel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update hotel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
