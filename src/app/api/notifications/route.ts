import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, getNotificationsForBooking } from '@/lib/notifications';
import { db } from '@/lib/db';

// POST /api/notifications — Send a notification
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      bookingId,
      guestId,
      userId,
      type,
      channel,
      customSubject,
      customBody,
    } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'type is required (e.g. booking_confirmation, payment_receipt).' },
        { status: 400 },
      );
    }

    const validChannels = ['email', 'whatsapp', 'in_app'];
    const effectiveChannel = channel || 'email';
    if (!validChannels.includes(effectiveChannel)) {
      return NextResponse.json(
        { success: false, error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await sendNotification({
      hotelId,
      bookingId,
      guestId,
      userId,
      type,
      channel: effectiveChannel as 'email' | 'whatsapp' | 'in_app',
      customSubject,
      customBody,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notification.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/notifications?hotelId=xxx&bookingId=xxx&limit=20
// — List notifications for a hotel (optionally filtered by booking, ordered by most recent)
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const bookingId = request.nextUrl.searchParams.get('bookingId');
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20;

    // If bookingId is provided, use the existing function
    if (bookingId) {
      const notifications = await getNotificationsForBooking(bookingId, hotelId);
      return NextResponse.json({ success: true, data: notifications });
    }

    // Hotel-wide notification listing — most recent first
    const notifications = await db.notification.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        channel: true,
        status: true,
        subject: true,
        body: true,
        createdAt: true,
        bookingId: true,
        guestId: true,
      },
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/notifications?hotelId=xxx&notificationId=xxx
// — Mark a notification as read (opened)
export async function PATCH(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const notificationId = request.nextUrl.searchParams.get('notificationId');
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId query parameter is required.' },
        { status: 400 },
      );
    }

    const notification = await db.notification.updateMany({
      where: { id: notificationId, hotelId },
      data: {
        status: 'opened',
        openedAt: new Date(),
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: { id: notificationId, status: 'opened' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notification.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
