import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/channels/:id?hotelId=xxx
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

    const channel = await db.channel.findFirst({
      where: { id, hotelId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            room: { select: { name: true, roomNumber: true } },
            guest: { select: { firstName: true, lastName: true } },
          },
        },
        syncLogs: {
          orderBy: { syncedAt: 'desc' },
          take: 10,
        },
        ratePlans: true,
        _count: { select: { bookings: true, syncLogs: true } },
      },
    });

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: channel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch channel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/channels/:id?hotelId=xxx
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

    const existing = await db.channel.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Channel not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, syncMethod, icalUrl, commission, isActive, syncStatus, syncError } = body;

    const channel = await db.channel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(syncMethod !== undefined && { syncMethod }),
        ...(icalUrl !== undefined && { icalUrl: icalUrl || null }),
        ...(commission !== undefined && { commission: commission !== null ? Number(commission) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(syncStatus !== undefined && { syncStatus }),
        ...(syncError !== undefined && { syncError }),
        lastSyncAt: (syncStatus || syncError) ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: channel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update channel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/channels/:id?hotelId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const existing = await db.channel.findFirst({
      where: { id, hotelId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Channel not found.' },
        { status: 404 }
      );
    }

    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a channel with existing bookings. Deactivate it instead.' },
        { status: 400 }
      );
    }

    await db.channel.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: 'Channel deleted successfully.' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete channel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
