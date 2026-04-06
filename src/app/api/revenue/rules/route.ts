import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/revenue/rules?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const rules = await db.dynamicRateRule.findMany({
      where: { hotelId },
      orderBy: { priority: 'desc' },
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rate rules.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/revenue/rules
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      name,
      ruleType,
      adjustmentType,
      adjustmentValue,
      roomTypeId,
      channelId,
      validFrom,
      validTo,
      daysOfWeek,
      minOccupancy,
      maxOccupancy,
      priority,
      isActive,
    } = body;

    if (!name || !ruleType || adjustmentValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'name, ruleType, and adjustmentValue are required.' },
        { status: 400 },
      );
    }

    const validRuleTypes = ['seasonal', 'occupancy_based', 'day_of_week', 'event', 'last_minute', 'early_bird'];
    if (!validRuleTypes.includes(ruleType)) {
      return NextResponse.json(
        { success: false, error: `Invalid ruleType. Must be one of: ${validRuleTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const rule = await db.dynamicRateRule.create({
      data: {
        hotelId,
        name,
        ruleType,
        adjustmentType: adjustmentType || 'percentage',
        adjustmentValue: Number(adjustmentValue),
        roomTypeId: roomTypeId || null,
        channelId: channelId || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
        minOccupancy: minOccupancy !== undefined ? Number(minOccupancy) : null,
        maxOccupancy: maxOccupancy !== undefined ? Number(maxOccupancy) : null,
        priority: priority !== undefined ? Number(priority) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create rate rule.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
