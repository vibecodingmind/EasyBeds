import { db } from '@/lib/db';

// =============================================================================
// Payment Service — EasyBeds
// Handles payment creation, status management, and booking payment updates.
// =============================================================================

export interface CreatePaymentInput {
  hotelId: string;
  bookingId: string;
  amount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'online' | 'waiver';
  transactionRef?: string;
  notes?: string;
  stripePaymentIntentId?: string;
}

export interface RefundPaymentInput {
  amount?: number; // partial refund amount; full if omitted
  reason?: string;
}

/**
 * Create a new payment record and update the booking's payment status.
 */
export async function createPayment(input: CreatePaymentInput) {
  const { hotelId, bookingId, amount, method, transactionRef, notes, stripePaymentIntentId } = input;

  // Validate booking exists and belongs to hotel
  const booking = await db.booking.findFirst({
    where: { id: bookingId, hotelId },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Determine payment status
  const isOnline = method === 'online' && !stripePaymentIntentId;
  const paymentStatus = isOnline ? 'pending' : 'completed';
  const paidAt = isOnline ? null : new Date();

  // Create the payment
  const payment = await db.payment.create({
    data: {
      hotelId,
      bookingId,
      guestId: booking.guestId,
      amount,
      currency: booking.currency,
      method,
      status: paymentStatus,
      transactionRef: transactionRef || null,
      notes: notes || null,
      stripePaymentIntentId: stripePaymentIntentId || null,
      paidAt,
    },
  });

  // Update booking payment status
  await updateBookingPaymentStatus(bookingId, hotelId);

  return payment;
}

/**
 * Refund a payment (full or partial).
 */
export async function refundPayment(paymentId: string, hotelId: string, input: RefundPaymentInput) {
  const payment = await db.payment.findFirst({
    where: { id: paymentId, hotelId },
    include: { booking: true },
  });

  if (!payment) {
    throw new Error('Payment not found.');
  }

  if (payment.status === 'refunded') {
    throw new Error('Payment is already fully refunded.');
  }

  if (payment.status === 'failed') {
    throw new Error('Cannot refund a failed payment.');
  }

  const refundAmount = input.amount ?? payment.amount;

  if (refundAmount <= 0) {
    throw new Error('Refund amount must be positive.');
  }

  if (refundAmount > payment.amount) {
    throw new Error('Refund amount cannot exceed the payment amount.');
  }

  // Check if this is a partial refund
  const isPartial = refundAmount < payment.amount;
  const newStatus = isPartial ? 'partially_refunded' : 'refunded';

  // Get already refunded amount from other refund payments for this payment
  // (we store refunds as separate records tracking against the original)
  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: newStatus,
      notes: input.reason
        ? `Refund: ${input.reason}${payment.notes ? ` | ${payment.notes}` : ''}`
        : payment.notes,
      updatedAt: new Date(),
    },
  });

  // If partial refund, create a separate refund record
  if (isPartial) {
    await db.payment.create({
      data: {
        hotelId: payment.hotelId,
        bookingId: payment.bookingId,
        guestId: payment.guestId,
        amount: -refundAmount, // negative amount for refunds
        currency: payment.currency,
        method: payment.method,
        status: 'refunded',
        transactionRef: `REFUND-${payment.transactionRef || payment.id.slice(-8)}`,
        notes: `Partial refund for payment ${payment.id.slice(-8)}: ${input.reason || ''}`,
        paidAt: new Date(),
      },
    });
  }

  // Update booking payment status
  await updateBookingPaymentStatus(payment.bookingId, hotelId);

  return updatedPayment;
}

/**
 * Update a payment's status (e.g., when Stripe confirms a payment).
 */
export async function updatePaymentStatus(
  paymentId: string,
  hotelId: string,
  status: 'pending' | 'completed' | 'failed',
  stripePaymentIntentId?: string,
) {
  const payment = await db.payment.findFirst({
    where: { id: paymentId, hotelId },
  });

  if (!payment) {
    throw new Error('Payment not found.');
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'completed' && !payment.paidAt) {
    updateData.paidAt = new Date();
  }
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  const updated = await db.payment.update({
    where: { id: paymentId },
    data: updateData,
  });

  if (status === 'completed') {
    await updateBookingPaymentStatus(payment.bookingId, hotelId);
  }

  return updated;
}

/**
 * Get payments for a specific booking.
 */
export async function getPaymentsForBooking(bookingId: string, hotelId: string) {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, hotelId },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  return db.payment.findMany({
    where: { bookingId, hotelId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get payment summary for a hotel within a date range.
 */
export async function getPaymentSummary(
  hotelId: string,
  from: Date,
  to: Date,
) {
  const payments = await db.payment.findMany({
    where: {
      hotelId,
      createdAt: { gte: from, lte: to },
    },
    include: {
      booking: {
        select: {
          confirmationCode: true,
          guest: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const completedPayments = payments.filter((p) => p.status === 'completed' && p.amount > 0);
  const refundedPayments = payments.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const failedPayments = payments.filter((p) => p.status === 'failed');

  const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = refundedPayments.reduce(
    (sum, p) => sum + Math.abs(Math.min(p.amount, 0)),
    0,
  );

  // Group by method
  const byMethod: Record<string, { total: number; count: number }> = {};
  for (const p of completedPayments) {
    if (!byMethod[p.method]) {
      byMethod[p.method] = { total: 0, count: 0 };
    }
    byMethod[p.method].total += p.amount;
    byMethod[p.method].count += 1;
  }

  return {
    period: { from, to },
    summary: {
      totalPayments: payments.length,
      completedCount: completedPayments.length,
      pendingCount: pendingPayments.length,
      failedCount: failedPayments.length,
      refundedCount: refundedPayments.length,
      totalCollected,
      totalRefunded,
      netRevenue: totalCollected - totalRefunded,
    },
    byMethod,
    payments,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Recalculate and update the booking's paymentStatus field based on all payments.
 */
async function updateBookingPaymentStatus(bookingId: string, hotelId: string) {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, hotelId },
  });

  if (!booking) return;

  const payments = await db.payment.findMany({
    where: { bookingId, hotelId },
  });

  const totalPaid = payments
    .filter((p) => p.status === 'completed' && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + Math.abs(Math.min(p.amount, 0)), 0);

  const netPaid = totalPaid - totalRefunded;

  let paymentStatus: string;
  if (netPaid <= 0) {
    paymentStatus = 'unpaid';
  } else if (netPaid >= booking.totalPrice) {
    paymentStatus = 'paid';
  } else {
    paymentStatus = 'partial';
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus,
      depositAmount: netPaid,
      depositPaid: netPaid > 0,
      balanceDue: Math.max(0, booking.totalPrice - netPaid),
    },
  });
}

/**
 * Create a Stripe payment intent (mock implementation).
 * In production, this would call the Stripe API.
 */
export function createStripePaymentIntent(amount: number, currency: string, bookingId: string) {
  // Return a mock payment intent ID for now
  // In production: const intent = await stripe.paymentIntents.create({ amount, currency, metadata: { bookingId } });
  const mockIntentId = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    clientSecret: `cs_${mockIntentId}`,
    paymentIntentId: mockIntentId,
    amount,
    currency,
  };
}
