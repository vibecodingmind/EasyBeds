import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';

// GET /api/rooms?hotelId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const rooms = await db.room.findMany({
      where: { hotelId, isActive: true },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ['pending', 'confirmed', 'checked_in'] },
              },
            },
            availabilityBlocks: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rooms.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/rooms?hotelId=xxx — owner, manager, staff only
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
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
      name, roomNumber, type, maxGuests, basePrice, description,
      amenities, floor, bedType, imageUrl, sortOrder,
    } = body;

    if (!name || !roomNumber || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Room name, roomNumber, and basePrice are required.' },
        { status: 400 }
      );
    }

    const room = await db.room.create({
      data: {
        hotelId,
        name,
        roomNumber,
        type: type || 'double',
        maxGuests: maxGuests || 2,
        basePrice: Number(basePrice),
        description: description || null,
        amenities: amenities ? JSON.stringify(amenities) : null,
        floor: floor || null,
        bedType: bedType || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
