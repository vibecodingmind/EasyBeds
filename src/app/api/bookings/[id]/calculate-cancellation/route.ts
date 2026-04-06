import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/bookings/:id/calculate-cancellation?hotelId=xxx
// Calculates the cancellation fee for a booking based on the hotel's cancellation policy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const booking = await db.booking.findFirst({
      where: { id, hotelId },
      include: { hotel: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    // Get the default cancellation policy
    const policy = await db.cancellationPolicy.findFirst({
      where: { hotelId, isDefault: true, isActive: true },
    });

    if (!policy) {
      return NextResponse.json({
        success: true,
        data: {
          bookingId: id,
          cancellationFee: 0,
          chargePercent: 0,
          policyName: null,
          message: 'No default cancellation policy found. No fee applied.',
        },
      });
    }

    // Parse rules
    let rules: { hoursBefore: number; chargePercent: number }[];
    try {
      rules = JSON.parse(policy.rules);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid policy rules format.' },
        { status: 500 }
      );
    }

    // Sort rules by hoursBefore descending (most restrictive last)
    rules.sort((a, b) => b.hoursBefore - a.hoursBefore);

    // Calculate hours until check-in
    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Find the applicable rule: first rule where hoursUntilCheckIn <= hoursBefore
    let applicableRule = rules[rules.length - 1]; // Default to the last (most restrictive) rule
    for (const rule of rules) {
      if (hoursUntilCheckIn >= rule.hoursBefore) {
        applicableRule = rule;
        break;
      }
    }

    const cancellationFee = (booking.totalPrice * applicableRule.chargePercent) / 100;

    return NextResponse.json({
      success: true,
      data: {
        bookingId: id,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        hoursUntilCheckIn: Math.round(hoursUntilCheckIn * 100) / 100,
        cancellationFee: Math.round(cancellationFee * 100) / 100,
        chargePercent: applicableRule.chargePercent,
        policyName: policy.name,
        policyRules: rules,
        appliedRule: applicableRule,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate cancellation fee.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
