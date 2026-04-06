import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/housekeeping/:id?hotelId=xxx — Update task
export async function PATCH(
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

    const existing = await db.housekeepingTask.findFirst({ where: { id, hotelId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, assignedTo, priority, notes, description, dueTime } = body;

    const updateData: Record<string, unknown> = {};

    if (status && status !== existing.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'skipped', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Allowed: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (description !== undefined) updateData.description = description;
    if (dueTime !== undefined) updateData.dueTime = dueTime;

    const task = await db.housekeepingTask.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: task });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update housekeeping task.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
