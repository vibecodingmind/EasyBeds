import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cancellation-policies?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const policies = await db.cancellationPolicy.findMany({
      where: { hotelId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cancellation policies.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/cancellation-policies?hotelId=xxx — Create policy
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, rules, isDefault } = body;

    if (!name || !rules) {
      return NextResponse.json(
        { success: false, error: 'name and rules are required.' },
        { status: 400 }
      );
    }

    // Validate rules format
    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'rules must be a non-empty array of {hoursBefore, chargePercent}.' },
        { status: 400 }
      );
    }

    for (const rule of rules) {
      if (typeof rule.hoursBefore !== 'number' || typeof rule.chargePercent !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Each rule must have hoursBefore (number) and chargePercent (number).' },
          { status: 400 }
        );
      }
      if (rule.chargePercent < 0 || rule.chargePercent > 100) {
        return NextResponse.json(
          { success: false, error: 'chargePercent must be between 0 and 100.' },
          { status: 400 }
        );
      }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.cancellationPolicy.updateMany({
        where: { hotelId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const policy = await db.cancellationPolicy.create({
      data: {
        hotelId,
        name,
        description: description || null,
        rules: JSON.stringify(rules),
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ success: true, data: policy }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create cancellation policy.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
