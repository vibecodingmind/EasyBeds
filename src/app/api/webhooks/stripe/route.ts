import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';

// =============================================================================
// Stripe Webhook Endpoint — EasyBeds
// Handles Stripe event webhooks for payment status updates.
// Implements proper signature verification when STRIPE_WEBHOOK_SECRET is set.
// =============================================================================

/**
 * Verify Stripe webhook signature using the raw body.
 * Compatible with the Stripe webhook signing scheme (t=timestamp,v1=signature).
 */
function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const elements = signature.split(',');
  let timestamp = '';
  let v1Signature = '';

  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') v1Signature = value;
  }

  if (!timestamp || !v1Signature) {
    return false;
  }

  // Check timestamp freshness (reject events older than 5 minutes)
  const tolerance = 300; // 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  const eventTimestamp = parseInt(timestamp, 10);

  if (isNaN(eventTimestamp) || currentTime - eventTimestamp > tolerance) {
    console.warn('[STRIPE WEBHOOK] Rejected: timestamp too old or invalid');
    return false;
  }

  // Construct the signed payload
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1Signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Buffers must be same length for timingSafeEqual
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body first — needed for signature verification
    const rawBody = await request.text();
    const signature = headers().get('stripe-signature');

    // Verify webhook signature when STRIPE_WEBHOOK_SECRET is configured
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      if (!signature) {
        console.warn('[STRIPE WEBHOOK] Missing stripe-signature header');
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 400 }
        );
      }

      const isValid = verifyStripeSignature(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.warn('[STRIPE WEBHOOK] Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }

      console.log('[STRIPE WEBHOOK] Signature verified successfully');
    } else {
      // In development without STRIPE_WEBHOOK_SECRET, allow through with a warning
      console.warn(
        '[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not configured — skipping signature verification. ' +
        'This is acceptable in development but must be configured in production.'
      );
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const paymentIntentId = pi.id as string;

        // Update payment status to completed
        const updateResult = await db.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: {
            status: 'completed',
            paidAt: new Date(),
          },
        });

        if (updateResult.count === 0) {
          console.log(`[STRIPE WEBHOOK] No payment found for intent: ${paymentIntentId}`);
          break;
        }

        console.log(`[STRIPE WEBHOOK] Updated ${updateResult.count} payment(s) to completed`);

        // Get the payment to find the booking and recalculate payment status
        const payment = await db.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (payment) {
          // Recalculate booking payment status
          const allPayments = await db.payment.findMany({
            where: { bookingId: payment.bookingId, status: 'completed' },
          });
          const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

          const booking = await db.booking.findUnique({
            where: { id: payment.bookingId },
          });

          if (booking) {
            let newPaymentStatus: string;
            if (totalPaid >= booking.totalPrice) {
              newPaymentStatus = 'paid';
            } else if (totalPaid > 0) {
              newPaymentStatus = 'partial';
            } else {
              newPaymentStatus = 'unpaid';
            }

            await db.booking.update({
              where: { id: payment.bookingId },
              data: {
                paymentStatus: newPaymentStatus,
                depositAmount: totalPaid,
                depositPaid: totalPaid > 0,
                balanceDue: Math.max(0, booking.totalPrice - totalPaid),
              },
            });

            console.log(`[STRIPE WEBHOOK] Booking ${booking.confirmationCode} paymentStatus → ${newPaymentStatus}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const paymentIntentId = pi.id as string;

        const updateResult = await db.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: {
            status: 'failed',
          },
        });

        console.log(`[STRIPE WEBHOOK] Updated ${updateResult.count} payment(s) to failed`);

        // Optionally create a notification about the failed payment
        if (updateResult.count > 0) {
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });
          if (payment) {
            await db.notification.create({
              data: {
                hotelId: payment.hotelId,
                bookingId: payment.bookingId,
                guestId: payment.guestId,
                type: 'system_alert',
                channel: 'in_app',
                status: 'sent',
                subject: 'Payment Failed',
                body: `Online payment of ${payment.currency} ${payment.amount.toLocaleString()} failed for booking. Please contact the guest or try an alternative payment method.`,
                sentAt: new Date(),
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`[STRIPE WEBHOOK] Subscription invoice paid: ${invoice.id}`);
        // Future: handle subscription renewal billing
        // This would update subscription status, create payment records, etc.
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
