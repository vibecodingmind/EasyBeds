import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/revenue/calculate?hotelId=xxx&roomId=xxx&date=YYYY-MM-DD&channelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    const roomId = request.nextUrl.searchParams.get('roomId');
    const dateStr = request.nextUrl.searchParams.get('date');
    const channelId = request.nextUrl.searchParams.get('channelId');

    if (!hotelId || !roomId || !dateStr) {
      return NextResponse.json(
        { success: false, error: 'hotelId, roomId, and date are required.' },
        { status: 400 },
      );
    }

    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(12, 0, 0, 0); // noon to avoid timezone issues

    // 1. Get room base price
    const room = await db.room.findFirst({
      where: { id: roomId, hotelId, isActive: true },
    });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found.' },
        { status: 404 },
      );
    }

    let currentPrice = room.basePrice;
    const appliedRules: Array<{
      id: string;
      name: string;
      ruleType: string;
      adjustmentType: string;
      adjustmentValue: number;
      priceBefore: number;
      priceAfter: number;
    }> = [];

    // 2. Check applicable RatePlans
    const ratePlans = await db.ratePlan.findMany({
      where: {
        hotelId,
        roomId,
        isActive: true,
        ...(channelId ? { channelId } : {}),
        OR: [
          { validFrom: null },
          { validFrom: { lte: targetDate } },
        ],
        OR: [
          { validTo: null },
          { validTo: { gte: targetDate } },
        ],
      },
    });

    if (ratePlans.length > 0) {
      // Use the most specific rate plan (with channel)
      const specificPlan = ratePlans.find((rp) => rp.channelId);
      const plan = specificPlan || ratePlans[0];
      const prevPrice = currentPrice;
      currentPrice = plan.pricePerNight;
      appliedRules.push({
        id: plan.id,
        name: plan.name || 'Rate Plan',
        ruleType: 'rate_plan',
        adjustmentType: 'fixed',
        adjustmentValue: plan.pricePerNight - prevPrice,
        priceBefore: prevPrice,
        priceAfter: currentPrice,
      });
    }

    // 3. Get applicable dynamic rate rules, sorted by priority desc
    const dayOfWeek = targetDate.getDay();

    // Calculate current occupancy for occupancy_based rules
    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    const occupiedBlocks = await db.availabilityBlock.count({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: dayEnd },
        endDate: { gt: dayStart },
      },
    });
    const currentOccupancyPercent = totalRooms > 0 ? Math.round((occupiedBlocks / totalRooms) * 100) : 0;

    const allRules = await db.dynamicRateRule.findMany({
      where: {
        hotelId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    for (const rule of allRules) {
      // Check room type filter
      if (rule.roomTypeId && rule.roomTypeId !== room.type) continue;

      // Check channel filter
      if (rule.channelId && rule.channelId !== channelId) continue;

      let applicable = false;

      switch (rule.ruleType) {
        case 'seasonal': {
          const from = rule.validFrom ? new Date(rule.validFrom) : null;
          const to = rule.validTo ? new Date(rule.validTo) : null;
          if (from && to) {
            applicable = targetDate >= from && targetDate <= to;
          }
          break;
        }
        case 'day_of_week': {
          if (rule.daysOfWeek) {
            try {
              const days: number[] = JSON.parse(rule.daysOfWeek);
              applicable = days.includes(dayOfWeek);
            } catch {
              applicable = false;
            }
          }
          break;
        }
        case 'occupancy_based': {
          if (rule.minOccupancy !== null && rule.minOccupancy !== undefined) {
            applicable = currentOccupancyPercent >= rule.minOccupancy;
          }
          if (applicable && rule.maxOccupancy !== null && rule.maxOccupancy !== undefined) {
            applicable = currentOccupancyPercent <= rule.maxOccupancy;
          }
          break;
        }
        case 'last_minute': {
          // Booking within 48 hours of target date
          const hoursUntil = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60);
          applicable = hoursUntil > 0 && hoursUntil <= 48;
          break;
        }
        case 'early_bird': {
          // Booking 30+ days ahead
          const daysUntil = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          applicable = daysUntil >= 30;
          break;
        }
        case 'event': {
          // Events behave like seasonal
          const from = rule.validFrom ? new Date(rule.validFrom) : null;
          const to = rule.validTo ? new Date(rule.validTo) : null;
          if (from && to) {
            applicable = targetDate >= from && targetDate <= to;
          }
          break;
        }
      }

      if (!applicable) continue;

      const priceBefore = currentPrice;

      if (rule.adjustmentType === 'percentage') {
        currentPrice = currentPrice * (1 + rule.adjustmentValue / 100);
      } else {
        currentPrice = currentPrice + rule.adjustmentValue;
      }

      // Floor at 0
      currentPrice = Math.max(0, Math.round(currentPrice * 100) / 100);

      appliedRules.push({
        id: rule.id,
        name: rule.name,
        ruleType: rule.ruleType,
        adjustmentType: rule.adjustmentType,
        adjustmentValue: rule.adjustmentValue,
        priceBefore: Math.round(priceBefore * 100) / 100,
        priceAfter: currentPrice,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        hotelId,
        date: dateStr,
        basePrice: room.basePrice,
        finalPrice: currentPrice,
        currency: room.basePrice ? undefined : undefined,
        appliedRules,
        currentOccupancyPercent,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate price.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
