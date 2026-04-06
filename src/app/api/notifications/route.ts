import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, getNotificationsForBooking } from '@/lib/notifications';

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

// GET /api/notifications?hotelId=xxx&bookingId=xxx — List notifications
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

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId query parameter is required.' },
        { status: 400 },
      );
    }

    const notifications = await getNotificationsForBooking(bookingId, hotelId);

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
