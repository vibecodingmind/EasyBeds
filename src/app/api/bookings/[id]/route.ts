import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/bookings/:id?hotelId=xxx
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

    const booking = await db.booking.findFirst({
      where: { id, hotelId },
      include: {
        room: true,
        guest: true,
        channel: true,
        availabilityBlock: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/bookings/:id?hotelId=xxx — Update status, check-in, check-out
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
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, specialRequests, internalNotes, numGuests } = body;

    const updateData: Record<string, unknown> = {};

    if (status) {
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['checked_in', 'cancelled', 'no_show'],
        checked_in: ['checked_out'],
        checked_out: [],
        cancelled: [],
        no_show: ['cancelled'],
      };

      const allowed = validTransitions[existing.status];
      if (!allowed || !allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition booking from "${existing.status}" to "${status}". Allowed: ${allowed?.join(', ') || 'none'}.`,
          },
          { status: 400 }
        );
      }

      updateData.status = status;

      if (status === 'checked_in') {
        updateData.checkedInAt = new Date();
      }
      if (status === 'checked_out') {
        updateData.checkedOutAt = new Date();
      }
      if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
        // Deactivate the availability block
        if (existing.id) {
          await db.availabilityBlock.updateMany({
            where: { bookingId: existing.id },
            data: { isActive: false },
          });
        }
      }
    }

    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (numGuests !== undefined) updateData.numGuests = numGuests;

    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true } },
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        channel: { select: { id: true, name: true, type: true } },
        payments: true,
      },
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/bookings/:id?hotelId=xxx — Cancel booking
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

    const existing = await db.booking.findFirst({
      where: { id, hotelId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    if (existing.status === 'cancelled' || existing.status === 'checked_out') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a booking that is already cancelled or checked out.' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
        include: {
          room: true,
          guest: true,
          channel: true,
        },
      });

      await tx.availabilityBlock.updateMany({
        where: { bookingId: id },
        data: { isActive: false },
      });

      return booking;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
