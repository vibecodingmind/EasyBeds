import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/reviews?hotelId=xxx — List reviews
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const minRating = request.nextUrl.searchParams.get('minRating');
    const hasResponse = request.nextUrl.searchParams.get('hasResponse');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'createdAt';

    const where: Record<string, unknown> = { hotelId };

    if (minRating) {
      where.overallRating = { gte: parseInt(minRating) };
    }
    if (hasResponse === 'true') {
      where.response = { not: null };
    } else if (hasResponse === 'false') {
      where.response = null;
    }

    const orderBy: Record<string, string> =
      sortBy === 'rating' ? { overallRating: 'desc' }
      : sortBy === 'oldest' ? { createdAt: 'asc' }
      : { createdAt: 'desc' };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          guest: {
            select: { id: true, firstName: true, lastName: true },
          },
          booking: {
            select: {
              id: true, confirmationCode: true, room: { select: { name: true, roomNumber: true } },
            },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    // Calculate average ratings
    const avgRatings = await db.review.aggregate({
      where: { hotelId },
      _avg: { overallRating: true, cleanliness: true, service: true, location: true, value: true },
      _count: { overallRating: true },
    });

    // Rating distribution
    const distribution = await db.review.groupBy({
      by: ['overallRating'],
      where: { hotelId },
      _count: { overallRating: true },
      orderBy: { overallRating: 'desc' },
    });

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const d of distribution) {
      ratingDistribution[d.overallRating] = d._count.overallRating;
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: {
          averageRating: avgRatings._avg.overallRating ? Math.round(avgRatings._avg.overallRating * 10) / 10 : 0,
          totalReviews: avgRatings._count.overallRating,
          avgCleanliness: avgRatings._avg.cleanliness ? Math.round(avgRatings._avg.cleanliness * 10) / 10 : null,
          avgService: avgRatings._avg.service ? Math.round(avgRatings._avg.service * 10) / 10 : null,
          avgLocation: avgRatings._avg.location ? Math.round(avgRatings._avg.location * 10) / 10 : null,
          avgValue: avgRatings._avg.value ? Math.round(avgRatings._avg.value * 10) / 10 : null,
          ratingDistribution,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
