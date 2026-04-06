import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/coupons/validate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, code, numNights, channelId } = body;

    if (!hotelId || !code) {
      return NextResponse.json(
        { success: false, error: 'hotelId and code are required.' },
        { status: 400 },
      );
    }

    const coupon = await db.coupon.findFirst({
      where: {
        hotelId,
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'Coupon code not found or inactive.',
          discount: 0,
        },
      });
    }

    // Check valid date range
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'This coupon is not yet active.',
          discount: 0,
        },
      });
    }

    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'This coupon has expired.',
          discount: 0,
        },
      });
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'This coupon has reached its maximum usage limit.',
          discount: 0,
        },
      });
    }

    // Check minimum stay requirement
    if (coupon.minStay !== null && coupon.minStay !== undefined) {
      const stayNights = numNights || 0;
      if (stayNights < coupon.minStay) {
        return NextResponse.json({
          success: true,
          data: {
            valid: false,
            reason: `Minimum stay of ${coupon.minStay} night(s) required.`,
            discount: 0,
            minStay: coupon.minStay,
          },
        });
      }
    }

    // Check channel restrictions
    if (coupon.channelIds) {
      try {
        const allowedChannels: string[] = JSON.parse(coupon.channelIds);
        if (allowedChannels.length > 0 && channelId && !allowedChannels.includes(channelId)) {
          return NextResponse.json({
            success: true,
            data: {
              valid: false,
              reason: 'This coupon is not valid for the selected channel.',
              discount: 0,
            },
          });
        }
      } catch {
        // Invalid JSON — ignore channel check
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: coupon.value,
        remainingUses: coupon.maxUses !== null ? coupon.maxUses - coupon.usedCount : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to validate coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
