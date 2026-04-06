import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/channels?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const channels = await db.channel.findMany({
      where: { hotelId },
      include: {
        _count: {
          select: {
            bookings: true,
            syncLogs: true,
            ratePlans: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: channels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch channels.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/channels?hotelId=xxx
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
      name, type, syncMethod, icalUrl, commission, isActive,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Channel name is required.' },
        { status: 400 }
      );
    }

    const channel = await db.channel.create({
      data: {
        hotelId,
        name,
        type: type || 'walkin',
        syncMethod: syncMethod || 'manual',
        icalUrl: icalUrl || null,
        icalExportSlug: `${hotelId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
        commission: commission !== undefined ? Number(commission) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: channel }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create channel.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
