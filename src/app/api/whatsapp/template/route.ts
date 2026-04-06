import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/whatsapp/template — Send a template WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { templateName, to, bookingId, guestId } = body;
    let templateParams = body.templateParams;

    if (!templateName || !to) {
      return NextResponse.json(
        { success: false, error: 'Template name and recipient phone number are required.' },
        { status: 400 }
      );
    }

    const availableTemplates = WhatsAppService.getAvailableTemplates();
    if (!availableTemplates.includes(templateName)) {
      return NextResponse.json(
        { success: false, error: `Unknown template. Available: ${availableTemplates.join(', ')}` },
        { status: 400 }
      );
    }

    // Resolve guest info if bookingId provided
    let guestPhone = to;
    let guestName = templateParams?.guestName || 'Guest';
    let hotelName = templateParams?.hotelName || '';

    if (bookingId && !guestId) {
      const booking = await db.booking.findFirst({
        where: { id: bookingId, hotelId: auth.hotelId },
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, phone: true } },
          hotel: { select: { name: true } },
          room: { select: { name: true } },
        },
      });
      if (booking) {
        if (!to) guestPhone = booking.guest.phone || '';
        guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
        hotelName = booking.hotel.name;
        templateParams = {
          ...templateParams,
          guestName,
          hotelName,
          roomName: booking.room.name,
          confirmationCode: booking.confirmationCode,
          checkInDate: new Date(booking.checkInDate).toLocaleDateString(),
          checkOutDate: new Date(booking.checkOutDate).toLocaleDateString(),
          totalPrice: booking.totalPrice.toString(),
          currency: booking.currency,
        };
      }
    }

    const result = await WhatsAppService.sendTemplate({
      to: guestPhone,
      templateName,
      hotelId: auth.hotelId,
      bookingId,
      guestId,
      templateParams: templateParams || {},
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { messageId: result.messageId, externalRef: result.externalRef, templateName },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send template message.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
