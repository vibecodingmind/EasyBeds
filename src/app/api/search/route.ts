import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/search?hotelId=xxx&q=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { bookings: [], guests: [], rooms: [], channels: [] },
      });
    }

    const searchTerm = `%${q}%`;
    const take = 5;

    // Run all four searches in parallel
    const [bookings, guests, rooms, channels] = await Promise.all([
      // Bookings: search by confirmationCode, guest name, room number
      db.booking.findMany({
        where: {
          hotelId,
          OR: [
            { confirmationCode: { contains: q, mode: 'insensitive' } },
            { guest: { firstName: { contains: q, mode: 'insensitive' } } },
            { guest: { lastName: { contains: q, mode: 'insensitive' } } },
            {
              guest: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
            { room: { roomNumber: { contains: q, mode: 'insensitive' } } },
            { room: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          room: { select: { id: true, name: true, roomNumber: true, type: true } },
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          channel: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),

      // Guests: search by firstName, lastName, email, phone
      db.guest.findMany({
        where: {
          hotelId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),

      // Rooms: search by name, roomNumber, type
      db.room.findMany({
        where: {
          hotelId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { roomNumber: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { sortOrder: 'asc' },
        take,
      }),

      // Channels: search by name
      db.channel.findMany({
        where: {
          hotelId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { bookings, guests, rooms, channels },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: 'Database query failed.' },
        { status: 500 },
      );
    }
    const message = error instanceof Error ? error.message : 'Search failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
