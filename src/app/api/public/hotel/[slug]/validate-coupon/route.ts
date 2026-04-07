import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/public/hotel/[slug]/validate-coupon
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { code, totalAmount, numNights } = body;

    if (!code || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'code and totalAmount are required.' },
        { status: 400 },
      );
    }

    const hotel = await db.hotel.findFirst({
      where: { bookingPageSlug: slug, bookingPageEnabled: true, isActive: true },
    });
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    const coupon = await db.coupon.findFirst({
      where: { hotelId: hotel.id, code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: 'Coupon code not found or inactive.', discount: 0 },
      });
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: 'This coupon is not yet active.', discount: 0 },
      });
    }
    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: 'This coupon has expired.', discount: 0 },
      });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: 'This coupon has reached its maximum usage limit.', discount: 0 },
      });
    }
    if (coupon.minStay !== null && coupon.minStay !== undefined) {
      const stayNights = numNights || 0;
      if (stayNights < coupon.minStay) {
        return NextResponse.json({
          success: true,
          data: { valid: false, reason: `Minimum stay of ${coupon.minStay} night(s) required.`, discount: 0, minStay: coupon.minStay },
        });
      }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round(totalAmount * (coupon.value / 100) * 100) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'free_nights') {
      const nights = numNights || 1;
      const avgNightlyRate = totalAmount / nights;
      discount = Math.round(avgNightlyRate * coupon.value * 100) / 100;
    }
    discount = Math.min(discount, totalAmount);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        remainingUses: coupon.maxUses !== null ? coupon.maxUses - coupon.usedCount : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to validate coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
