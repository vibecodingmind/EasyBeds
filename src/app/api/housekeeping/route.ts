import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, parseISO } from 'date-fns';

// GET /api/housekeeping?hotelId=xxx&status=pending&date=DATE&assignedTo=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const status = request.nextUrl.searchParams.get('status');
    const dateStr = request.nextUrl.searchParams.get('date');
    const assignedTo = request.nextUrl.searchParams.get('assignedTo');

    const where: Record<string, unknown> = { hotelId };

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (dateStr) {
      const dayStart = startOfDay(parseISO(dateStr));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.dueDate = { gte: dayStart, lt: dayEnd };
    }

    const tasks = await db.housekeepingTask.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true } },
        booking: {
          select: {
            id: true,
            confirmationCode: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch housekeeping tasks.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/housekeeping?hotelId=xxx — Create a task
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
      roomId, bookingId, assignedTo, taskType, priority, title,
      description, dueDate, dueTime,
    } = body;

    if (!roomId || !title || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'roomId, title, and dueDate are required.' },
        { status: 400 }
      );
    }

    // Verify room belongs to hotel
    const room = await db.room.findFirst({ where: { id: roomId, hotelId } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 }
      );
    }

    const task = await db.housekeepingTask.create({
      data: {
        hotelId,
        roomId,
        bookingId: bookingId || null,
        assignedTo: assignedTo || null,
        taskType: taskType || 'clean',
        priority: priority || 'medium',
        status: 'pending',
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        dueTime: dueTime || null,
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true } },
        booking: {
          select: {
            id: true,
            confirmationCode: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create housekeeping task.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
