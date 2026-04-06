import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { differenceInCalendarDays, parseISO } from 'date-fns';

// PATCH /api/bookings/:id/modify?hotelId=xxx — Modify booking dates or room
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

    const existing = await db.booking.findFirst({
      where: { id, hotelId },
      include: {
        room: { select: { id: true, basePrice: true, roomNumber: true, name: true } },
        availabilityBlock: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    // Only confirmed or pending bookings can be modified
    if (!['pending', 'confirmed'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Only pending or confirmed bookings can be modified.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { checkIn, checkOut, roomId, notes } = body;

    if (!checkIn && !checkOut && !roomId) {
      return NextResponse.json(
        { success: false, error: 'Provide at least one of: checkIn, checkOut, roomId.' },
        { status: 400 }
      );
    }

    const newCheckIn = checkIn ? parseISO(checkIn) : existing.checkInDate;
    const newCheckOut = checkOut ? parseISO(checkOut) : existing.checkOutDate;
    const newRoomId = roomId || existing.roomId;

    // Validate dates
    if (newCheckIn >= newCheckOut) {
      return NextResponse.json(
        { success: false, error: 'checkOut date must be after checkIn date.' },
        { status: 400 }
      );
    }

    const numNights = differenceInCalendarDays(newCheckOut, newCheckIn);
    if (numNights <= 0) {
      return NextResponse.json(
        { success: false, error: 'Booking must be at least 1 night.' },
        { status: 400 }
      );
    }

    // If room is changing, verify the new room belongs to this hotel
    if (roomId && roomId !== existing.roomId) {
      const newRoom = await db.room.findFirst({
        where: { id: roomId, hotelId, isActive: true },
      });
      if (!newRoom) {
        return NextResponse.json(
          { success: false, error: 'New room not found or inactive.' },
          { status: 404 }
        );
      }
    }

    // Get the target room's price
    const targetRoom = await db.room.findUnique({ where: { id: newRoomId } });
    if (!targetRoom) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 }
      );
    }

    const pricePerNight = targetRoom.basePrice;
    const newTotalPrice = numNights * pricePerNight;

    // Check availability for the new dates/room (exclude the current booking's block)
    const conflictingBlocks = await db.availabilityBlock.findMany({
      where: {
        roomId: newRoomId,
        isActive: true,
        startDate: { lt: newCheckOut },
        endDate: { gt: newCheckIn },
        ...(existing.availabilityBlock
          ? { id: { not: existing.availabilityBlock.id } }
          : {}),
      },
    });

    if (conflictingBlocks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room is not available for the selected dates.',
          data: { conflictingBlocks },
        },
        { status: 409 }
      );
    }

    // Execute modification in a transaction
    const result = await db.$transaction(async (tx) => {
      // Capture old values for audit
      const oldValue = {
        checkInDate: existing.checkInDate.toISOString(),
        checkOutDate: existing.checkOutDate.toISOString(),
        roomId: existing.roomId,
        roomNumber: existing.room.roomNumber,
        numNights: existing.numNights,
        pricePerNight: existing.pricePerNight,
        totalPrice: existing.totalPrice,
      };

      // Update the booking
      const booking = await tx.booking.update({
        where: { id },
        data: {
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
          roomId: newRoomId,
          numNights,
          pricePerNight,
          totalPrice: newTotalPrice,
          ...(notes !== undefined ? { internalNotes: notes } : {}),
        },
        include: {
          room: { select: { id: true, name: true, roomNumber: true, type: true } },
          guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          channel: { select: { id: true, name: true, type: true } },
          payments: true,
        },
      });

      // Update or create the availability block
      if (existing.availabilityBlock) {
        await tx.availabilityBlock.update({
          where: { id: existing.availabilityBlock.id },
          data: {
            roomId: newRoomId,
            startDate: newCheckIn,
            endDate: newCheckOut,
          },
        });
      } else {
        await tx.availabilityBlock.create({
          data: {
            hotelId,
            roomId: newRoomId,
            bookingId: id,
            startDate: newCheckIn,
            endDate: newCheckOut,
            blockType: 'booking',
            isActive: true,
          },
        });
      }

      // Log the modification in audit trail
      const newValue = {
        checkInDate: newCheckIn.toISOString(),
        checkOutDate: newCheckOut.toISOString(),
        roomId: newRoomId,
        roomNumber: targetRoom.roomNumber,
        numNights,
        pricePerNight,
        totalPrice: newTotalPrice,
      };

      await tx.auditLog.create({
        data: {
          hotelId,
          action: 'update',
          entityType: 'booking',
          entityId: id,
          oldValue: JSON.stringify(oldValue),
          newValue: JSON.stringify(newValue),
          description: `Booking modified: dates/room changed from Room ${existing.room.roomNumber} to Room ${targetRoom.roomNumber}`,
        },
      });

      return booking;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to modify booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
