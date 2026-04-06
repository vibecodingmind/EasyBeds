import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/reviews/[id]/respond — Hotel responds to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !auth.hotelId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId') || auth.hotelId;

    const review = await db.review.findFirst({
      where: { id, hotelId },
    });

    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { response } = body;

    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Response text is required.' },
        { status: 400 }
      );
    }

    if (response.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Response is too long (max 2000 characters).' },
        { status: 400 }
      );
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        response: response.trim(),
        respondedAt: new Date(),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        hotelId,
        entityType: 'review',
        entityId: id,
        action: 'update',
        description: `Staff responded to review (rating: ${review.overallRating}/5)`,
        userId: auth.userId,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to respond to review.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
