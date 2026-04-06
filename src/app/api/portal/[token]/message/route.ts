import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/portal/[token]/message — Send message to hotel staff
export async function POST(
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
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message content is too long (max 2000 characters).' },
        { status: 400 }
      );
    }

    const message = await db.guestMessage.create({
      data: {
        hotelId: booking.hotelId,
        bookingId: booking.id,
        guestId: booking.guestId,
        role: 'guest',
        channel: 'chat',
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
