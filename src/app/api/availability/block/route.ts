import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/availability/block?hotelId=xxx — Create manual block (maintenance, owner use, hold)
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
    const { roomId, startDate, endDate, blockType, reason } = body;

    if (!roomId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'roomId, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const startDateParsed = new Date(startDate);
    const endDateParsed = new Date(endDate);

    if (startDateParsed >= endDateParsed) {
      return NextResponse.json(
        { success: false, error: 'endDate must be after startDate.' },
        { status: 400 }
      );
    }

    const validBlockTypes = ['maintenance', 'owner_use', 'hold'];
    if (blockType && !validBlockTypes.includes(blockType)) {
      return NextResponse.json(
        { success: false, error: `blockType must be one of: ${validBlockTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify room exists
    const room = await db.room.findFirst({ where: { id: roomId, hotelId, isActive: true } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or inactive.' },
        { status: 404 }
      );
    }

    // Check for overlapping blocks
    const overlappingBlocks = await db.availabilityBlock.findMany({
      where: {
        roomId,
        hotelId,
        isActive: true,
        startDate: { lt: endDateParsed },
        endDate: { gt: startDateParsed },
      },
    });

    if (overlappingBlocks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected dates overlap with existing availability blocks.',
          data: { conflictingBlocks: overlappingBlocks },
        },
        { status: 409 }
      );
    }

    const block = await db.availabilityBlock.create({
      data: {
        hotelId,
        roomId,
        startDate: startDateParsed,
        endDate: endDateParsed,
        blockType: blockType || 'maintenance',
        reason: reason || null,
        isActive: true,
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: block }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create availability block.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
