import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/reviews/request — Request review for completed booking
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, hotelId: bodyHotelId } = body;

    const hotelId = bodyHotelId || auth.hotelId;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId is required.' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await db.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        hotel: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.status !== 'checked_out') {
      return NextResponse.json(
        { success: false, error: 'Review can only be requested for checked-out bookings.' },
        { status: 400 }
      );
    }

    // Update booking to mark review as requested
    await db.booking.update({
      where: { id: bookingId },
      data: {
        reviewRequested: true,
        reviewRequestedAt: new Date(),
      },
    });

    // Create notification
    const notification = await db.notification.create({
      data: {
        hotelId,
        bookingId,
        guestId: booking.guestId,
        type: 'review_request',
        channel: 'in_app',
        status: 'sent',
        subject: 'Please share your experience',
        body: `Dear ${booking.guest.firstName} ${booking.guest.lastName}, thank you for staying at ${booking.hotel.name}! We would love to hear about your experience. Please take a moment to leave a review.`,
        toAddress: booking.guest.email || booking.guest.phone || undefined,
        sentAt: new Date(),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        hotelId,
        entityType: 'booking',
        entityId: bookingId,
        action: 'update',
        description: `Review requested for booking ${booking.confirmationCode}`,
        userId: auth.userId,
      },
    });

    return NextResponse.json({ success: true, data: { notification, bookingId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to request review.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
