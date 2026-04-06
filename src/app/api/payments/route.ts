import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getPaymentsForBooking, createStripePaymentIntent } from '@/lib/payments';

// POST /api/payments — Create payment
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
    const { bookingId, amount, method, transactionRef, notes } = body;

    if (!bookingId || amount === undefined || !method) {
      return NextResponse.json(
        { success: false, error: 'bookingId, amount, and method are required.' },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be positive.' },
        { status: 400 },
      );
    }

    const validMethods = ['cash', 'mobile_money', 'card', 'bank_transfer', 'online', 'waiver'];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 },
      );
    }

    // For online payments, create a Stripe payment intent
    let stripeData: { clientSecret: string; paymentIntentId: string } | null = null;
    if (method === 'online') {
      const { db } = await import('@/lib/db');
      const booking = await db.booking.findFirst({
        where: { id: bookingId, hotelId },
      });
      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Booking not found.' },
          { status: 404 },
        );
      }

      stripeData = createStripePaymentIntent(amount, booking.currency, bookingId);

      // Create payment record in pending state
      const payment = await createPayment({
        hotelId,
        bookingId,
        amount,
        method,
        transactionRef: stripeData.paymentIntentId,
        notes,
        stripePaymentIntentId: stripeData.paymentIntentId,
      });

      return NextResponse.json({
        success: true,
        data: {
          ...payment,
          stripeClientSecret: stripeData.clientSecret,
          stripePaymentIntentId: stripeData.paymentIntentId,
        },
      }, { status: 201 });
    }

    // For offline methods, complete immediately
    const payment = await createPayment({
      hotelId,
      bookingId,
      amount,
      method,
      transactionRef,
      notes,
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/payments?hotelId=xxx&bookingId=xxx — List payments
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId query parameter is required.' },
        { status: 400 },
      );
    }

    const payments = await getPaymentsForBooking(bookingId, hotelId);

    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payments.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
