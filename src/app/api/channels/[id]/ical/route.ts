import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

// GET /api/channels/:id/ical — Generate iCal feed for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');

    const channel = await db.channel.findFirst({
      where: {
        id,
        ...(hotelId && { hotelId }),
        isActive: true,
      },
      include: { hotel: true },
    });

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found.' },
        { status: 404 }
      );
    }

    // Fetch all active bookings for this channel
    const bookings = await db.booking.findMany({
      where: {
        channelId: id,
        status: { in: ['confirmed', 'checked_in'] },
      },
      include: {
        room: { select: { name: true, roomNumber: true } },
        guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { checkInDate: 'asc' },
    });

    // Build iCal content
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EasyBeds//Channel Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${channel.name} - ${channel.hotel.name}`,
      `X-WR-TIMEZONE:${channel.hotel.timezone}`,
    ];

    for (const booking of bookings) {
      const checkInStr = format(new Date(booking.checkInDate), 'yyyyMMdd');
      const checkOutStr = format(new Date(booking.checkOutDate), 'yyyyMMdd');
      const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
      const roomName = booking.room.name || booking.room.roomNumber;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${booking.confirmationCode}@easybeds.com`);
      lines.push(`DTSTART;VALUE=DATE:${checkInStr}`);
      lines.push(`DTEND;VALUE=DATE:${checkOutStr}`);
      lines.push(`SUMMARY:Booking: ${guestName} - ${roomName}`);
      lines.push(`DESCRIPTION:Confirmation: ${booking.confirmationCode}\\nGuest: ${guestName}\\nRoom: ${roomName}\\nNights: ${booking.numNights}\\nTotal: ${booking.totalPrice} ${booking.currency}\\nStatus: ${booking.status}`);
      lines.push(`STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`);
      if (booking.guest.email) {
        lines.push(`ATTENDEE;CN=${guestName}:mailto:${booking.guest.email}`);
      }
      lines.push(`CATEGORIES:BOOKING`);
      lines.push(`URL:https://easybeds.com/booking/${booking.confirmationCode}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    const icalContent = lines.join('\r\n');

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="easybeds-${channel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate iCal feed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
