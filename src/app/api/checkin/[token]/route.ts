import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/checkin/[token] — Get check-in form data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await db.booking.findFirst({
      where: { portalAccessCode: token },
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true, amenities: true, description: true, floor: true } },
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, idNumber: true, idType: true, nationality: true } },
        hotel: {
          select: {
            id: true, name: true, address: true, city: true, country: true,
            checkInTime: true, checkOutTime: true, currency: true, selfCheckInEnabled: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired check-in token.' },
        { status: 404 }
      );
    }

    if (!booking.hotel.selfCheckInEnabled) {
      return NextResponse.json(
        { success: false, error: 'Self check-in is not enabled for this hotel.' },
        { status: 400 }
      );
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: `Cannot check in. Booking status is "${booking.status}". Only confirmed bookings can check in.` },
        { status: 400 }
      );
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkInDate = new Date(booking.checkInDate)
    checkInDate.setHours(0, 0, 0, 0)

    if (checkInDate > today) {
      return NextResponse.json(
        { success: false, error: `Check-in is not available yet. Your check-in date is ${new Date(booking.checkInDate).toLocaleDateString()}.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch check-in data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/checkin/[token] — Process self check-in
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await db.booking.findFirst({
      where: { portalAccessCode: token },
      include: {
        room: true,
        guest: true,
        hotel: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired check-in token.' },
        { status: 404 }
      );
    }

    if (!booking.hotel.selfCheckInEnabled) {
      return NextResponse.json(
        { success: false, error: 'Self check-in is not enabled for this hotel.' },
        { status: 400 }
      );
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: `Cannot check in. Booking status is "${booking.status}".` },
        { status: 400 }
      );
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkInDate = new Date(booking.checkInDate)
    checkInDate.setHours(0, 0, 0, 0)

    if (checkInDate > today) {
      return NextResponse.json(
        { success: false, error: 'Check-in is not available yet.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { idNumber, idType, nationality, signature } = body;

    // Validate required fields
    if (!idNumber || !idType) {
      return NextResponse.json(
        { success: false, error: 'ID number and ID type are required for check-in.' },
        { status: 400 }
      );
    }

    // Process check-in in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Update guest ID information
      const guestUpdate: Record<string, unknown> = {
        idNumber,
        idType,
      };
      if (nationality) guestUpdate.nationality = nationality;

      await tx.guest.update({
        where: { id: booking.guestId },
        data: guestUpdate,
      });

      // 2. Update booking status to checked_in
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'checked_in',
          checkedInAt: new Date(),
        },
        include: {
          room: { select: { id: true, name: true, roomNumber: true } },
          guest: { select: { id: true, firstName: true, lastName: true } },
          hotel: { select: { id: true, name: true } },
        },
      });

      // 3. Update room status to occupied
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'occupied' },
      });

      // 4. Create housekeeping task for turndown service
      const checkOutDate = new Date(booking.checkOutDate)
      const turndownDueDate = new Date(checkOutDate)
      turndownDueDate.setHours(16, 0, 0, 0) // 4 PM on checkout day

      // Create initial cleaning task
      await tx.housekeepingTask.create({
        data: {
          hotelId: booking.hotelId,
          roomId: booking.roomId,
          bookingId: booking.id,
          taskType: 'clean',
          priority: 'high',
          status: 'pending',
          title: `Post check-in clean: ${booking.room.roomNumber}`,
          description: `Room prepared for guest check-in. ${booking.guest.firstName} ${booking.guest.lastName}`,
          dueDate: new Date(),
          dueTime: booking.hotel.checkInTime,
        },
      })

      // Create turndown service task for each night
      const numNights = booking.numNights
      for (let i = 0; i < Math.min(numNights, 7); i++) {
        const nightDate = new Date(booking.checkInDate)
        nightDate.setDate(nightDate.getDate() + i + 1)

        await tx.housekeepingTask.create({
          data: {
            hotelId: booking.hotelId,
            roomId: booking.roomId,
            bookingId: booking.id,
            taskType: 'turndown',
            priority: 'low',
            status: 'pending',
            title: `Turndown service: ${booking.room.roomNumber}`,
            description: `Evening turndown for guest ${booking.guest.firstName} ${booking.guest.lastName}`,
            dueDate: nightDate,
            dueTime: '17:00',
          },
        })
      }

      // 5. Create audit log
      await tx.auditLog.create({
        data: {
          hotelId: booking.hotelId,
          entityType: 'booking',
          entityId: booking.id,
          action: 'status_change',
          description: `Self check-in completed for booking ${booking.confirmationCode}. Room ${booking.room.roomNumber} assigned to ${booking.guest.firstName} ${booking.guest.lastName}.`,
          oldValue: JSON.stringify({ status: 'confirmed' }),
          newValue: JSON.stringify({ status: 'checked_in' }),
        },
      })

      // 6. Create notification
      await tx.notification.create({
        data: {
          hotelId: booking.hotelId,
          bookingId: booking.id,
          guestId: booking.guestId,
          type: 'system_alert',
          channel: 'in_app',
          status: 'sent',
          subject: 'Self Check-In Completed',
          body: `Guest ${booking.guest.firstName} ${booking.guest.lastName} has completed self check-in for booking ${booking.confirmationCode}. Room: ${booking.room.roomNumber}.`,
          sentAt: new Date(),
        },
      })

      return updatedBooking
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        roomNumber: result.room.roomNumber,
        guestName: `${result.guest.firstName} ${result.guest.lastName}`,
        hotelName: result.hotel.name,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process check-in.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
