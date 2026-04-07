import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, addDays } from 'date-fns';

// GET /api/public/hotel/[slug]/calculate-price?roomId=xxx&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const roomId = request.nextUrl.searchParams.get('roomId');
    const checkInStr = request.nextUrl.searchParams.get('checkIn');
    const checkOutStr = request.nextUrl.searchParams.get('checkOut');

    if (!roomId || !checkInStr || !checkOutStr) {
      return NextResponse.json(
        { success: false, error: 'roomId, checkIn, and checkOut are required.' },
        { status: 400 },
      );
    }

    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);
    const numNights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (numNights <= 0 || numNights > 90) {
      return NextResponse.json(
        { success: false, error: 'Invalid date range.' },
        { status: 400 },
      );
    }

    // Get hotel
    const hotel = await db.hotel.findFirst({
      where: { bookingPageSlug: slug, bookingPageEnabled: true, isActive: true },
    });
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    // Get room
    const room = await db.room.findFirst({
      where: { id: roomId, hotelId: hotel.id, isActive: true },
    });
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found.' }, { status: 404 });
    }

    // Get website channel for pricing
    let channelId: string | undefined;
    const channel = await db.channel.findFirst({
      where: { hotelId: hotel.id, type: 'website', isActive: true },
    });
    channelId = channel?.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nightlyPrices: Array<{
      date: string;
      basePrice: number;
      finalPrice: number;
      appliedRules: Array<{ id: string; name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; priceBefore: number; priceAfter: number }>;
    }> = [];

    let baseTotal = 0;
    let dynamicTotal = 0;

    for (let i = 0; i < numNights; i++) {
      const nightDate = format(addDays(checkInDate, i), 'yyyy-MM-dd');
      const targetDate = new Date(nightDate);
      targetDate.setHours(12, 0, 0, 0);

      let currentPrice = room.basePrice;
      const appliedRules: Array<{ id: string; name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; priceBefore: number; priceAfter: number }> = [];

      // Rate plans
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

      // Dynamic rate rules
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

      nightlyPrices.push({ date: nightDate, basePrice: room.basePrice, finalPrice: currentPrice, appliedRules });
      baseTotal += room.basePrice;
      dynamicTotal += currentPrice;
    }

    const adjustmentsTotal = dynamicTotal - baseTotal;

    return NextResponse.json({
      success: true,
      data: {
        nightlyPrices,
        baseTotal: Math.round(baseTotal * 100) / 100,
        adjustmentsTotal: Math.round(adjustmentsTotal * 100) / 100,
        dynamicTotal: Math.round(dynamicTotal * 100) / 100,
        currency: hotel.currency,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate price.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
