import { db } from '@/lib/db';
import { renderTemplate, EMAIL_TEMPLATES, type TemplateKey, type EmailTemplateInfo } from '@/lib/email-templates';

// =============================================================================
// Notification Service — EasyBeds
// Manages sending notifications via email, WhatsApp, and in-app channels.
// =============================================================================

export interface SendNotificationInput {
  hotelId: string;
  bookingId?: string;
  guestId?: string;
  userId?: string;
  type: TemplateKey | string;
  channel: 'email' | 'whatsapp' | 'in_app';
  customSubject?: string;
  customBody?: string;
}

interface NotificationResult {
  notification: {
    id: string;
    type: string;
    channel: string;
    status: string;
    toAddress: string | null;
    subject: string | null;
  };
  sent: boolean;
}

/**
 * Send a notification through the specified channel.
 * - For email: renders the HTML template and records the notification.
 * - For whatsapp: records the notification (actual WhatsApp API integration would be added).
 * - For in_app: creates an in-app notification record.
 */
export async function sendNotification(input: SendNotificationInput): Promise<NotificationResult> {
  const { hotelId, bookingId, guestId, userId, type, channel, customSubject, customBody } = input;

  // Validate hotel
  const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    throw new Error('Hotel not found.');
  }

  // Gather context data for template rendering
  let toAddress: string | null = null;
  let guestFirstName: string | undefined;
  let guestLastName: string | undefined;
  let guestEmail: string | undefined;
  let guestPhone: string | undefined;

  if (guestId) {
    const guest = await db.guest.findFirst({ where: { id: guestId, hotelId } });
    if (guest) {
      guestFirstName = guest.firstName;
      guestLastName = guest.lastName;
      guestEmail = guest.email || undefined;
      guestPhone = guest.phone || undefined;
      toAddress = guest.email || guest.phone || null;
    }
  }

  let confirmationCode: string | undefined;
  let checkInDate: string | undefined;
  let checkOutDate: string | undefined;
  let roomName: string | undefined;
  let totalPrice: number | undefined;
  let currency: string | undefined;
  let numNights: number | undefined;

  if (bookingId) {
    const booking = await db.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: { room: true, guest: true },
    });
    if (booking) {
      confirmationCode = booking.confirmationCode;
      checkInDate = booking.checkInDate.toLocaleDateString();
      checkOutDate = booking.checkOutDate.toLocaleDateString();
      roomName = booking.room.name;
      totalPrice = booking.totalPrice;
      currency = booking.currency;
      numNights = booking.numNights;

      if (!guestId && booking.guest) {
        guestFirstName = booking.guest.firstName;
        guestLastName = booking.guest.lastName;
        guestEmail = booking.guest.email || undefined;
        guestPhone = booking.guest.phone || undefined;
        toAddress = booking.guest.email || booking.guest.phone || null;
      }
    }
  }

  // Build template data
  const templateData = {
    hotelName: hotel.name,
    hotelPhone: hotel.phone || undefined,
    hotelEmail: hotel.email || undefined,
    hotelAddress: hotel.address || undefined,
    hotelWebsite: hotel.website || undefined,
    guestFirstName,
    guestLastName,
    confirmationCode,
    checkInDate,
    checkOutDate,
    roomName,
    totalPrice,
    currency,
    numNights,
  };

  // Determine subject and body
  let subject: string;
  let bodyHtml: string | null = null;
  let bodyText: string | null = null;

  if (customSubject && customBody) {
    subject = customSubject;
    bodyText = customBody;
  } else if (EMAIL_TEMPLATES.some((t) => t.key === type)) {
    try {
      const rendered = renderTemplate(type as TemplateKey, templateData);
      subject = rendered.subject;
      bodyHtml = rendered.html;
      bodyText = rendered.text;
    } catch {
      subject = `Notification from ${hotel.name}`;
      bodyText = customBody || `A new notification regarding your booking${confirmationCode ? ` (${confirmationCode})` : ''}.`;
    }
  } else {
    subject = customSubject || `Notification from ${hotel.name}`;
    bodyText = customBody || `A new notification from ${hotel.name}.`;
  }

  // Determine notification status
  let status: 'pending' | 'sent' | 'failed' = 'sent';

  // For email, check if email is enabled
  if (channel === 'email' && !hotel.emailEnabled) {
    status = 'failed';
  }

  // For WhatsApp, check if WhatsApp is enabled
  if (channel === 'whatsapp' && !hotel.whatsappEnabled) {
    status = 'failed';
  }

  // Create notification record
  const notification = await db.notification.create({
    data: {
      hotelId,
      bookingId: bookingId || null,
      guestId: guestId || null,
      userId: userId || null,
      type: type as NotificationType,
      channel: channel as NotificationChannel,
      status: status as NotificationStatus,
      subject,
      body: bodyText,
      bodyHtml,
      toAddress,
      sentAt: status === 'sent' ? new Date() : null,
      errorMessage: status === 'failed'
        ? channel === 'email' ? 'Email notifications are disabled for this hotel.'
        : channel === 'whatsapp' ? 'WhatsApp notifications are disabled for this hotel.'
        : null
        : null,
    },
  });

  return {
    notification: {
      id: notification.id,
      type: notification.type,
      channel: notification.channel,
      status: notification.status,
      toAddress: notification.toAddress,
      subject: notification.subject,
    },
    sent: status === 'sent',
  };
}

/**
 * Send a notification with payment details.
 */
export async function sendPaymentReceipt(input: {
  hotelId: string;
  bookingId: string;
  paymentMethod: string;
  paymentAmount: number;
  channel?: 'email' | 'whatsapp' | 'in_app';
}) {
  const { hotelId, bookingId, paymentMethod, paymentAmount, channel = 'email' } = input;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, hotelId },
    include: { room: true, guest: true },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    throw new Error('Hotel not found.');
  }

  // Render the payment receipt template with payment details
  const templateData = {
    hotelName: hotel.name,
    hotelPhone: hotel.phone || undefined,
    hotelEmail: hotel.email || undefined,
    hotelAddress: hotel.address || undefined,
    hotelWebsite: hotel.website || undefined,
    guestFirstName: booking.guest.firstName,
    guestLastName: booking.guest.lastName,
    confirmationCode: booking.confirmationCode,
    checkInDate: booking.checkInDate.toLocaleDateString(),
    checkOutDate: booking.checkOutDate.toLocaleDateString(),
    roomName: booking.room.name,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    numNights: booking.numNights,
    paymentMethod,
    paymentAmount,
  };

  const rendered = renderTemplate('payment_receipt', templateData);

  const notification = await db.notification.create({
    data: {
      hotelId,
      bookingId,
      guestId: booking.guestId,
      type: 'payment_receipt',
      channel,
      status: 'sent',
      subject: rendered.subject,
      body: rendered.text,
      bodyHtml: rendered.html,
      toAddress: booking.guest.email || booking.guest.phone || null,
      sentAt: new Date(),
    },
  });

  return notification;
}

/**
 * Get notifications for a booking.
 */
export async function getNotificationsForBooking(bookingId: string, hotelId: string) {
  return db.notification.findMany({
    where: { bookingId, hotelId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all notification templates.
 */
export function getTemplates(): EmailTemplateInfo[] {
  return EMAIL_TEMPLATES;
}

// Prisma enum types used for type casting
type NotificationType = 'booking_confirmation' | 'booking_reminder' | 'pre_arrival' | 'post_checkout' | 'cancellation' | 'payment_receipt' | 'review_request' | 'low_balance' | 'housekeeping_alert' | 'system_alert' | 'custom';
type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';
type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
