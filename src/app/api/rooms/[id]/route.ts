import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rooms/:id?hotelId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const room = await db.room.findFirst({
      where: { id, hotelId },
      include: {
        bookings: {
          orderBy: { checkInDate: 'desc' },
          take: 10,
        },
        ratePlans: {
          where: { isActive: true },
        },
        availabilityBlocks: {
          where: { isActive: true },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch room.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/rooms/:id?hotelId=xxx
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify room belongs to hotel
    const existing = await db.room.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 }
      );
    }

    const room = await db.room.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomNumber !== undefined && { roomNumber }),
        ...(type !== undefined && { type }),
        ...(maxGuests !== undefined && { maxGuests }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(description !== undefined && { description }),
        ...(amenities !== undefined && { amenities: amenities ? JSON.stringify(amenities) : null }),
        ...(floor !== undefined && { floor }),
        ...(bedType !== undefined && { bedType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update room.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/rooms/:id?hotelId=xxx (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const existing = await db.room.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 }
      );
    }

    const room = await db.room.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete room.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
