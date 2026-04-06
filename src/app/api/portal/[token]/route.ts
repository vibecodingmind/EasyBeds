import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/portal/[token] — Validate token, return booking + hotel info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await db.booking.findFirst({
      where: { portalAccessCode: token },
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true, amenities: true, description: true } },
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, idNumber: true, idType: true, nationality: true } },
        channel: { select: { id: true, name: true, type: true } },
        hotel: {
          select: {
            id: true, name: true, description: true, address: true, city: true, country: true,
            phone: true, email: true, website: true, logoUrl: true, checkInTime: true, checkOutTime: true,
            currency: true, timezone: true, selfCheckInEnabled: true,
          },
        },
        guestMessages: {
          where: { channel: 'chat' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true, isRead: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired portal access code.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch portal data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/portal/[token] — Update guest info (phone, special requests, id fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await db.booking.findFirst({
      where: { portalAccessCode: token },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired portal access code.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { phone, specialRequests, idNumber, idType, nationality } = body;

    // Update guest record
    const guestUpdate: Record<string, unknown> = {};
    if (phone !== undefined) guestUpdate.phone = phone;
    if (idNumber !== undefined) guestUpdate.idNumber = idNumber;
    if (idType !== undefined) guestUpdate.idType = idType;
    if (nationality !== undefined) guestUpdate.nationality = nationality;

    if (Object.keys(guestUpdate).length > 0) {
      await db.guest.update({
        where: { id: booking.guestId },
        data: guestUpdate,
      });
    }

    // Update booking special requests
    const bookingUpdate: Record<string, unknown> = {};
    if (specialRequests !== undefined) bookingUpdate.specialRequests = specialRequests;

    let updatedBooking = booking;
    if (Object.keys(bookingUpdate).length > 0) {
      updatedBooking = await db.booking.update({
        where: { id: booking.id },
        data: bookingUpdate,
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        hotelId: booking.hotelId,
        entityType: 'booking',
        entityId: booking.id,
        action: 'update',
        description: 'Guest updated information via portal',
      },
    });

    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update portal data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
