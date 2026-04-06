import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/guests/:id?hotelId=xxx
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

    const guest = await db.guest.findFirst({
      where: { id, hotelId },
      include: {
        bookings: {
          orderBy: { checkInDate: 'desc' },
          take: 20,
          include: {
            room: { select: { id: true, name: true, roomNumber: true } },
            channel: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch guest.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/guests/:id?hotelId=xxx
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

    const existing = await db.guest.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Guest not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName, lastName, email, phone, idNumber, idType,
      nationality, address, city, country, notes, vip,
    } = body;

    const guest = await db.guest.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(idNumber !== undefined && { idNumber: idNumber || null }),
        ...(idType !== undefined && { idType: idType || null }),
        ...(nationality !== undefined && { nationality: nationality || null }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(country !== undefined && { country: country || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(vip !== undefined && { vip }),
      },
    });

    return NextResponse.json({ success: true, data: guest });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update guest.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/guests/:id?hotelId=xxx
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

    const existing = await db.guest.findFirst({
      where: { id, hotelId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Guest not found.' },
        { status: 404 }
      );
    }

    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a guest with existing bookings. Deactivate instead.' },
        { status: 400 }
      );
    }

    await db.guest.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: 'Guest deleted successfully.' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete guest.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
