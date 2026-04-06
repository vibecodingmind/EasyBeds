import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

// =============================================================================
// Stripe Webhook Endpoint — EasyBeds
// Handles Stripe event webhooks for payment status updates.
// Requires STRIPE_WEBHOOK_SECRET for signature verification in production.
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    // Verify webhook signature if STRIPE_WEBHOOK_SECRET is configured
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      // In production, use @stripe/stripe-js or stripe npm package:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
      // For now, we accept the webhook payload after basic validation.
      console.log('[STRIPE WEBHOOK] Signature present, webhook secret configured.');
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
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
