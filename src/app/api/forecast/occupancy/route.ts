import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/forecast/occupancy?hotelId=xxx&days=30
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const daysStr = request.nextUrl.searchParams.get('days');
    const forecastDays = daysStr ? Math.min(parseInt(daysStr, 10), 90) : 30;

    const totalRooms = await db.room.count({ where: { hotelId, isActive: true } });
    if (totalRooms === 0) {
      return NextResponse.json({
        success: true,
        data: { totalRooms: 0, forecasts: [] },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get historical data for last 4 weeks (same day-of-week pattern)
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const historicalBookings = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in', 'checked_out'] },
        checkInDate: { gte: fourWeeksAgo, lt: today },
      },
    });

    // Build day-of-week averages
    const dayOfWeekData: Record<number, { totalOccupied: number; count: number }> = {};
    for (let d = 0; d < 7; d++) {
      dayOfWeekData[d] = { totalOccupied: 0, count: 0 };
    }

    // For each historical day, calculate occupancy
    for (let i = 0; i < 28; i++) {
      const day = new Date(fourWeeksAgo);
      day.setDate(day.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOfWeek = day.getDay();

      // Count occupied rooms for this historical day
      const occupiedSet = new Set<string>();
      for (const b of historicalBookings) {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        if (checkIn <= dayEnd && checkOut > dayStart) {
          occupiedSet.add(b.roomId);
        }
      }

      dayOfWeekData[dayOfWeek].totalOccupied += occupiedSet.size;
      dayOfWeekData[dayOfWeek].count++;
    }

    // Calculate averages
    const dayOfWeekAvg: Record<number, number> = {};
    for (let d = 0; d < 7; d++) {
      const data = dayOfWeekData[d];
      dayOfWeekAvg[d] = data.count > 0 ? (data.totalOccupied / data.count) / totalRooms * 100 : 50;
    }

    // Get seasonal adjustments from active dynamic rate rules
    const seasonalRules = await db.dynamicRateRule.findMany({
      where: {
        hotelId,
        isActive: true,
        ruleType: 'seasonal',
        validFrom: { not: null },
        validTo: { not: null },
      },
    });

    // Get current trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentBlocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: today },
        endDate: { gt: fourteenDaysAgo },
      },
    });

    let recentOccupied = 0;
    let olderOccupied = 0;

    for (const block of recentBlocks) {
      const bStart = new Date(block.startDate);
      const bEnd = new Date(block.endDate);

      // Check overlap with recent 7 days
      if (bStart < today && bEnd > sevenDaysAgo) {
        recentOccupied++;
      }
      // Check overlap with older 7 days
      if (bStart < sevenDaysAgo && bEnd > fourteenDaysAgo) {
        olderOccupied++;
      }
    }

    const recentRate = totalRooms > 0 ? recentOccupied / totalRooms : 0;
    const olderRate = totalRooms > 0 ? olderOccupied / totalRooms : 0;
    const trendFactor = olderRate > 0 ? recentRate / olderRate : 1; // >1 = increasing, <1 = decreasing

    // Generate forecasts
    const forecasts: Array<{
      date: string;
      dayOfWeek: number;
      predictedOccupancy: number;
      confidence: number;
      currentBookedRooms: number;
      totalRooms: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }> = [];

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dateStr = forecastDate.toISOString().split('T')[0];

      // Count already-booked rooms for this future date
      const dayStart = new Date(forecastDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(forecastDate);
      dayEnd.setHours(23, 59, 59, 999);

      const bookedBlocks = await db.availabilityBlock.findMany({
        where: {
          hotelId,
          isActive: true,
          startDate: { lt: dayEnd },
          endDate: { gt: dayStart },
        },
      });
      const bookedRoomIds = new Set(bookedBlocks.map((b) => b.roomId));
      const currentBookedRooms = bookedRoomIds.size;

      // Base prediction from day-of-week average
      let predictedOccupancy = dayOfWeekAvg[dayOfWeek];

      // Apply seasonal adjustment
      let seasonalFactor = 1;
      for (const rule of seasonalRules) {
        if (rule.validFrom && rule.validTo) {
          if (forecastDate >= new Date(rule.validFrom) && forecastDate <= new Date(rule.validTo)) {
            // A seasonal rule with positive adjustment suggests higher demand
            seasonalFactor += rule.adjustmentValue > 0 ? 0.05 : rule.adjustmentValue < 0 ? -0.05 : 0;
          }
        }
      }
      predictedOccupancy *= seasonalFactor;

      // Apply trend adjustment
      predictedOccupancy *= trendFactor;

      // Blend with current bookings for near-term dates
      const bookedPct = (currentBookedRooms / totalRooms) * 100;
      if (i <= 7) {
        // Near-term: weight current bookings more heavily
        const weight = 1 - (i / 14);
        predictedOccupancy = predictedOccupancy * (1 - weight) + bookedPct * weight;
      }

      // Clamp to 0-100
      predictedOccupancy = Math.max(0, Math.min(100, Math.round(predictedOccupancy * 10) / 10));

      // Confidence decreases with distance
      const baseConfidence = Math.max(30, 90 - (i * 1.5));
      const bookedBoost = currentBookedRooms > 0 ? 10 : 0;
      const confidence = Math.min(95, Math.round(baseConfidence + bookedBoost));

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (trendFactor > 1.05) trend = 'increasing';
      else if (trendFactor < 0.95) trend = 'decreasing';

      forecasts.push({
        date: dateStr,
        dayOfWeek,
        predictedOccupancy,
        confidence,
        currentBookedRooms,
        totalRooms,
        trend,
      });
    }

    // Today's actual for comparison
    const todayBlocks = await db.availabilityBlock.findMany({
      where: {
        hotelId,
        isActive: true,
        startDate: { lt: new Date(today.getTime() + 86400000) },
        endDate: { gt: today },
      },
    });
    const todayOccupied = new Set(todayBlocks.map((b) => b.roomId)).size;

    return NextResponse.json({
      success: true,
      data: {
        totalRooms,
        todayOccupancy: totalRooms > 0 ? Math.round((todayOccupied / totalRooms) * 1000) / 10 : 0,
        todayBookedRooms: todayOccupied,
        trendFactor: Math.round(trendFactor * 1000) / 1000,
        overallTrend: trendFactor > 1.05 ? 'increasing' : trendFactor < 0.95 ? 'decreasing' : 'stable',
        forecasts,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate forecast.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
