import { NextRequest, NextResponse } from 'next/server';
import { refundPayment } from '@/lib/payments';

// POST /api/payments/[id]/refund — Refund a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { amount, reason } = body;

    const payment = await refundPayment(id, hotelId, { amount, reason });

    return NextResponse.json({ success: true, data: payment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to refund payment.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
