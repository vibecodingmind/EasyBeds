import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, startOfDay, addDays } from 'date-fns';

// POST /api/housekeeping/bulk?hotelId=xxx — Auto-generate housekeeping tasks
// Generates checkout clean tasks for bookings checking out today and inspection tasks for check-ins
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const dateStr = body.date || format(new Date(), 'yyyy-MM-dd');
    const targetDate = startOfDay(new Date(dateStr));

    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found.' },
        { status: 404 }
      );
    }

    // Find bookings checking out today (that are checked_in or confirmed)
    const checkingOut = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['checked_in', 'confirmed'] },
        checkOutDate: {
          gte: targetDate,
          lt: addDays(targetDate, 1),
        },
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
    });

    // Find bookings checking in today (that are confirmed)
    const checkingIn = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'pending'] },
        checkInDate: {
          gte: targetDate,
          lt: addDays(targetDate, 1),
        },
      },
      include: {
        room: { select: { id: true, name: true, roomNumber: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
    });

    // Find rooms that need cleaning (rooms with cleaning status)
    const cleaningRooms = await db.room.findMany({
      where: {
        hotelId,
        status: 'cleaning',
      },
      select: { id: true, name: true, roomNumber: true },
    });

    const createdTasks: unknown[] = [];

    await db.$transaction(async (tx) => {
      // Checkout clean tasks
      for (const booking of checkingOut) {
        // Check if a task already exists for this room + date + type
        const existing = await tx.housekeepingTask.findFirst({
          where: {
            hotelId,
            roomId: booking.roomId,
            dueDate: { gte: targetDate, lt: addDays(targetDate, 1) },
            taskType: 'clean',
            status: { in: ['pending', 'in_progress'] },
          },
        });

        if (!existing) {
          const task = await tx.housekeepingTask.create({
            data: {
              hotelId,
              roomId: booking.roomId,
              bookingId: booking.id,
              taskType: 'clean',
              priority: 'high',
              status: 'pending',
              title: `Checkout clean — Room ${booking.room.roomNumber}`,
              description: `Prepare room for next guest. Guest: ${booking.guest.firstName} ${booking.guest.lastName} checking out.`,
              dueDate: targetDate,
              dueTime: hotel.checkOutTime || '10:00',
            },
            include: {
              room: { select: { id: true, name: true, roomNumber: true } },
            },
          });
          createdTasks.push(task);
        }
      }

      // Pre-arrival inspection tasks
      for (const booking of checkingIn) {
        const existing = await tx.housekeepingTask.findFirst({
          where: {
            hotelId,
            roomId: booking.roomId,
            dueDate: { gte: targetDate, lt: addDays(targetDate, 1) },
            taskType: 'inspect',
            status: { in: ['pending', 'in_progress'] },
          },
        });

        if (!existing) {
          const task = await tx.housekeepingTask.create({
            data: {
              hotelId,
              roomId: booking.roomId,
              bookingId: booking.id,
              taskType: 'inspect',
              priority: 'medium',
              status: 'pending',
              title: `Pre-arrival inspection — Room ${booking.room.roomNumber}`,
              description: `Verify room is ready for guest: ${booking.guest.firstName} ${booking.guest.lastName} checking in.`,
              dueDate: targetDate,
              dueTime: hotel.checkInTime || '14:00',
            },
            include: {
              room: { select: { id: true, name: true, roomNumber: true } },
            },
          });
          createdTasks.push(task);
        }
      }

      // Cleaning tasks for rooms already marked as cleaning
      for (const room of cleaningRooms) {
        const existing = await tx.housekeepingTask.findFirst({
          where: {
            hotelId,
            roomId: room.id,
            dueDate: { gte: targetDate, lt: addDays(targetDate, 1) },
            taskType: 'clean',
            status: { in: ['pending', 'in_progress'] },
          },
        });

        if (!existing) {
          const task = await tx.housekeepingTask.create({
            data: {
              hotelId,
              roomId: room.id,
              taskType: 'clean',
              priority: 'high',
              status: 'pending',
              title: `Deep clean — Room ${room.roomNumber}`,
              description: 'Room is marked for cleaning. Perform full cleaning and inspection.',
              dueDate: targetDate,
              dueTime: '12:00',
            },
            include: {
              room: { select: { id: true, name: true, roomNumber: true } },
            },
          });
          createdTasks.push(task);
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        createdCount: createdTasks.length,
        tasks: createdTasks,
        summary: {
          checkoutCleans: checkingOut.length,
          preArrivalInspections: checkingIn.length,
          cleaningRooms: cleaningRooms.length,
        },
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate housekeeping tasks.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
