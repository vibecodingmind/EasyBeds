import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns';

// Helper: Calculate dynamic price for a single night
async function calculateDynamicPrice(
  hotelId: string,
  roomId: string,
  dateStr: string,
  channelId?: string,
): Promise<{ basePrice: number; finalPrice: number; appliedRules: Array<{ id: string; name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; priceBefore: number; priceAfter: number }> }> {
  try {
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(12, 0, 0, 0);

    const room = await db.room.findFirst({
      where: { id: roomId, hotelId, isActive: true },
    });
    if (!room) return { basePrice: 0, finalPrice: 0, appliedRules: [] };

    let currentPrice = room.basePrice;
    const appliedRules: Array<{ id: string; name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; priceBefore: number; priceAfter: number }> = [];

    const ratePlans = await db.ratePlan.findMany({
      where: {
        hotelId, roomId, isActive: true,
        ...(channelId ? { channelId } : {}),
        OR: [{ validFrom: null }, { validFrom: { lte: targetDate } }],
        OR: [{ validTo: null }, { validTo: { gte: targetDate } }],
      },
    });

    if (ratePlans.length > 0) {
      const specificPlan = ratePlans.find((rp) => rp.channelId);
      const plan = specificPlan || ratePlans[0];
      const prevPrice = currentPrice;
      currentPrice = plan.pricePerNight;
      appliedRules.push({
        id: plan.id, name: plan.name || 'Rate Plan', ruleType: 'rate_plan',
        adjustmentType: 'fixed', adjustmentValue: plan.pricePerNight - prevPrice,
        priceBefore: prevPrice, priceAfter: currentPrice,
      });
    }

    const dayOfWeek = targetDate.getDay();
    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);
    const occupiedBlocks = await db.availabilityBlock.count({
      where: { hotelId, isActive: true, startDate: { lt: dayEnd }, endDate: { gt: dayStart } },
    });
    const currentOccupancyPercent = totalRooms > 0 ? Math.round((occupiedBlocks / totalRooms) * 100) : 0;

    const allRules = await db.dynamicRateRule.findMany({
      where: { hotelId, isActive: true }, orderBy: { priority: 'desc' },
    });

    for (const rule of allRules) {
      if (rule.roomTypeId && rule.roomTypeId !== room.type) continue;
      if (rule.channelId && rule.channelId !== channelId) continue;

      let applicable = false;
      switch (rule.ruleType) {
        case 'seasonal': {
          const from = rule.validFrom ? new Date(rule.validFrom) : null;
          const to = rule.validTo ? new Date(rule.validTo) : null;
          if (from && to) applicable = targetDate >= from && targetDate <= to;
          break;
        }
        case 'day_of_week': {
          if (rule.daysOfWeek) {
            try { const days: number[] = JSON.parse(rule.daysOfWeek); applicable = days.includes(dayOfWeek); } catch { applicable = false; }
          }
          break;
        }
        case 'occupancy_based': {
          if (rule.minOccupancy !== null && rule.minOccupancy !== undefined) applicable = currentOccupancyPercent >= rule.minOccupancy;
          if (applicable && rule.maxOccupancy !== null && rule.maxOccupancy !== undefined) applicable = currentOccupancyPercent <= rule.maxOccupancy;
          break;
        }
        case 'last_minute': {
          const hoursUntil = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60);
          applicable = hoursUntil > 0 && hoursUntil <= 48;
          break;
        }
        case 'early_bird': {
          const daysUntil = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          applicable = daysUntil >= 30;
          break;
        }
        case 'event': {
          const from = rule.validFrom ? new Date(rule.validFrom) : null;
          const to = rule.validTo ? new Date(rule.validTo) : null;
          if (from && to) applicable = targetDate >= from && targetDate <= to;
          break;
        }
      }

      if (!applicable) continue;
      const priceBefore = currentPrice;
      if (rule.adjustmentType === 'percentage') { currentPrice = currentPrice * (1 + rule.adjustmentValue / 100); } else { currentPrice = currentPrice + rule.adjustmentValue; }
      currentPrice = Math.max(0, Math.round(currentPrice * 100) / 100);
      appliedRules.push({
        id: rule.id, name: rule.name, ruleType: rule.ruleType, adjustmentType: rule.adjustmentType,
        adjustmentValue: rule.adjustmentValue, priceBefore: Math.round(priceBefore * 100) / 100, priceAfter: currentPrice,
      });
    }

    return { basePrice: room.basePrice, finalPrice: currentPrice, appliedRules };
  } catch {
    return { basePrice: 0, finalPrice: 0, appliedRules: [] };
  }
}

// Helper: Validate a coupon and compute discount amount
async function validateCouponAndGetDiscount(
  hotelId: string,
  code: string,
  dynamicTotal: number,
  numNights: number,
  channelId?: string,
): Promise<{ valid: boolean; reason?: string; couponId?: string; discount: number; type?: string; code?: string }> {
  try {
    const coupon = await db.coupon.findFirst({
      where: { hotelId, code: code.toUpperCase(), isActive: true },
    });
    if (!coupon) return { valid: false, reason: 'Coupon code not found or inactive.', discount: 0 };

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) return { valid: false, reason: 'This coupon is not yet active.', discount: 0 };
    if (coupon.validTo && new Date(coupon.validTo) < now) return { valid: false, reason: 'This coupon has expired.', discount: 0 };
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { valid: false, reason: 'This coupon has reached its maximum usage limit.', discount: 0 };
    if (coupon.minStay !== null && coupon.minStay !== undefined && numNights < coupon.minStay) return { valid: false, reason: `Minimum stay of ${coupon.minStay} night(s) required.`, discount: 0 };

    if (coupon.channelIds) {
      try {
        const allowedChannels: string[] = JSON.parse(coupon.channelIds);
        if (allowedChannels.length > 0 && channelId && !allowedChannels.includes(channelId)) return { valid: false, reason: 'This coupon is not valid for the selected channel.', discount: 0 };
      } catch { /* ignore */ }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round(dynamicTotal * (coupon.value / 100) * 100) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'free_nights') {
      const avgNightlyRate = numNights > 0 ? dynamicTotal / numNights : 0;
      discount = Math.round(avgNightlyRate * coupon.value * 100) / 100;
    }
    discount = Math.min(discount, dynamicTotal);

    return { valid: true, couponId: coupon.id, code: coupon.code, type: coupon.type, discount };
  } catch {
    return { valid: false, reason: 'Failed to validate coupon.', discount: 0 };
  }
}

// POST /api/public/hotel/[slug]/book — Public booking submission (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const body = await request.json();
    const {
      roomId,
      checkIn,
      checkOut,
      numGuests,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhone,
      specialRequests,
      couponCode,
    } = body;

    // Validate required fields
    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'roomId, checkIn, and checkOut are required.' },
        { status: 400 },
      );
    }

    if (!guestFirstName || !guestLastName) {
      return NextResponse.json(
        { success: false, error: 'Guest first name and last name are required.' },
        { status: 400 },
      );
    }

    if (!guestEmail && !guestPhone) {
      return NextResponse.json(
        { success: false, error: 'Guest email or phone is required.' },
        { status: 400 },
      );
    }

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkOut date must be after checkIn date.' },
        { status: 400 },
      );
    }

    // Get hotel by slug
    const hotel = await db.hotel.findFirst({
      where: {
        bookingPageSlug: slug,
        bookingPageEnabled: true,
        isActive: true,
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found or booking page is not enabled.' },
        { status: 404 },
      );
    }

    // Validate room
    const room = await db.room.findFirst({
      where: { id: roomId, hotelId: hotel.id, isActive: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or inactive.' },
        { status: 404 },
      );
    }

    // Calculate nights
    const numNights = differenceInCalendarDays(checkOutDate, checkInDate);
    if (numNights <= 0) {
      return NextResponse.json(
        { success: false, error: 'Booking must be at least 1 night.' },
        { status: 400 },
      );
    }

    // Get or create website channel
    let channel = await db.channel.findFirst({
      where: { hotelId: hotel.id, type: 'website', isActive: true },
    });
    if (!channel) {
      channel = await db.channel.create({
        data: { hotelId: hotel.id, name: 'Online Booking', type: 'website', syncMethod: 'manual' },
      });
    }

    // ── Dynamic pricing: calculate each night ──
    let baseTotal = 0;
    let dynamicTotal = 0;
    const nightlyPrices: Array<{
      date: string;
      basePrice: number;
      finalPrice: number;
      appliedRules: Array<{ id: string; name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; priceBefore: number; priceAfter: number }>;
    }> = [];

    try {
      for (let i = 0; i < numNights; i++) {
        const nightDate = format(addDays(checkInDate, i), 'yyyy-MM-dd');
        const priceResult = await calculateDynamicPrice(hotel.id, roomId, nightDate, channel.id);
        if (priceResult.basePrice === 0) {
          const fallbackPrice = room.basePrice;
          nightlyPrices.push({ date: nightDate, basePrice: fallbackPrice, finalPrice: fallbackPrice, appliedRules: [] });
          baseTotal += fallbackPrice;
          dynamicTotal += fallbackPrice;
        } else {
          nightlyPrices.push(priceResult);
          baseTotal += priceResult.basePrice;
          dynamicTotal += priceResult.finalPrice;
        }
      }
    } catch {
      const flatTotal = numNights * room.basePrice;
      for (let i = 0; i < numNights; i++) {
        const nightDate = format(addDays(checkInDate, i), 'yyyy-MM-dd');
        nightlyPrices.push({ date: nightDate, basePrice: room.basePrice, finalPrice: room.basePrice, appliedRules: [] });
      }
      baseTotal = flatTotal;
      dynamicTotal = flatTotal;
    }

    // ── Coupon validation ──
    let couponDiscount = 0;
    let couponResult: { valid: boolean; reason?: string; couponId?: string; discount: number; type?: string; code?: string } | null = null;

    if (couponCode) {
      couponResult = await validateCouponAndGetDiscount(hotel.id, couponCode, dynamicTotal, numNights, channel.id);
      if (couponResult.valid) {
        couponDiscount = couponResult.discount;
      }
    }

    const adjustmentsTotal = dynamicTotal - baseTotal;
    const finalTotal = Math.max(0, Math.round((dynamicTotal - couponDiscount) * 100) / 100);
    const pricePerNight = numNights > 0 ? Math.round(finalTotal / numNights * 100) / 100 : room.basePrice;

    // Create booking in a single transaction with availability check inside
    const result = await db.$transaction(async (tx) => {
      // ── Availability check INSIDE transaction ──
      const overlappingBlocks = await tx.availabilityBlock.findMany({
        where: { roomId, isActive: true, startDate: { lt: checkOutDate }, endDate: { gt: checkInDate } },
      });

      if (overlappingBlocks.length > 0) {
        throw new Error('CONFLICT: Room is no longer available for the selected dates.');
      }

      // Generate confirmation code inside transaction
      const today = format(new Date(), 'yyyyMMdd');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const bookingCount = await tx.booking.count({
        where: { hotelId: hotel.id, createdAt: { gte: todayStart } },
      });
      const confirmationCode = `EB-${today}-${String(bookingCount + 1).padStart(3, '0')}`;

      // Find or create guest
      let guest = await tx.guest.findFirst({
        where: { hotelId: hotel.id, email: guestEmail || undefined },
      });
      if (!guest && guestPhone) {
        guest = await tx.guest.findFirst({ where: { hotelId: hotel.id, phone: guestPhone } });
      }

      if (guest) {
        guest = await tx.guest.update({
          where: { id: guest.id },
          data: {
            firstName: guestFirstName,
            lastName: guestLastName,
            ...(guestEmail && { email: guestEmail }),
            ...(guestPhone && { phone: guestPhone }),
          },
        });
      } else {
        guest = await tx.guest.create({
          data: {
            hotelId: hotel.id,
            firstName: guestFirstName,
            lastName: guestLastName,
            email: guestEmail || null,
            phone: guestPhone || null,
          },
        });
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          hotelId: hotel.id,
          roomId,
          guestId: guest.id,
          channelId: channel.id,
          confirmationCode,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numGuests: numGuests || 1,
          numNights,
          pricePerNight,
          totalPrice: finalTotal,
          currency: hotel.currency,
          status: 'confirmed',
          specialRequests: specialRequests || null,
          balanceDue: finalTotal,
        },
        include: { room: true, guest: true, channel: true },
      });

      // Create availability block
      await tx.availabilityBlock.create({
        data: {
          hotelId: hotel.id, roomId, bookingId: booking.id,
          startDate: checkInDate, endDate: checkOutDate,
          blockType: 'booking', isActive: true,
        },
      });

      // Increment coupon used count if valid
      if (couponResult && couponResult.valid && couponResult.couponId) {
        await tx.coupon.update({
          where: { id: couponResult.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { booking, guest };
    });

    const pricingBreakdown = {
      nightlyPrices,
      baseTotal: Math.round(baseTotal * 100) / 100,
      adjustmentsTotal: Math.round(adjustmentsTotal * 100) / 100,
      dynamicTotal: Math.round(dynamicTotal * 100) / 100,
      couponDiscount: Math.round(couponDiscount * 100) / 100,
      couponCode: couponResult?.valid ? couponResult.code : null,
      couponType: couponResult?.valid ? couponResult.type : null,
      finalTotal,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: result.booking,
          guest: { id: result.guest.id, firstName: result.guest.firstName, lastName: result.guest.lastName },
        },
        pricing: pricingBreakdown,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create booking.';
    if (message.startsWith('CONFLICT:')) {
      return NextResponse.json(
        { success: false, error: 'Room is no longer available for the selected dates. Please try different dates.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
