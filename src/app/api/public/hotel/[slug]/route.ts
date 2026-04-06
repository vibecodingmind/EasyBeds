import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/hotel/[slug] — Public hotel info (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Hotel slug is required.' },
        { status: 400 },
      );
    }

    const hotel = await db.hotel.findFirst({
      where: {
        bookingPageSlug: slug,
        bookingPageEnabled: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logoUrl: true,
        timezone: true,
        checkInTime: true,
        checkOutTime: true,
        currency: true,
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found or booking page is not enabled.' },
        { status: 404 },
      );
    }

    // Get active rooms with their info
    const rooms = await db.room.findMany({
      where: {
        hotelId: hotel.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        roomNumber: true,
        type: true,
        maxGuests: true,
        basePrice: true,
        description: true,
        amenities: true,
        bedType: true,
        imageUrl: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { hotel, rooms },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hotel info.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
