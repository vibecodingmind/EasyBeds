import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSummary } from '@/lib/payments';

// GET /api/payments/summary?hotelId=xxx&from=DATE&to=DATE
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const fromStr = request.nextUrl.searchParams.get('from');
    const toStr = request.nextUrl.searchParams.get('to');

    // Default to current month if not provided
    const now = new Date();
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toStr ? new Date(toStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    const summary = await getPaymentSummary(hotelId, from, to);

    return NextResponse.json({ success: true, data: summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment summary.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
