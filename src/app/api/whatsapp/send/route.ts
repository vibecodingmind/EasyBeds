import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp';
import { verifyAuth } from '@/lib/auth';

// POST /api/whatsapp/send — Send a custom WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { to, body: messageBody, guestId, bookingId } = body;

    if (!to || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number and message body are required.' },
        { status: 400 }
      );
    }

    const result = await WhatsAppService.sendMessage({
      to,
      body: messageBody,
      hotelId: auth.hotelId,
      bookingId,
      guestId,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { messageId: result.messageId, externalRef: result.externalRef } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send WhatsApp message.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
