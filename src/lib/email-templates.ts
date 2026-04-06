// =============================================================================
// EasyBeds — HTML Email Templates
// Each template is a function that returns { subject, html, text }.
// Templates use inline styles for maximum email client compatibility.
// =============================================================================

interface TemplateData {
  hotelName: string;
  hotelPhone?: string;
  hotelEmail?: string;
  hotelAddress?: string;
  hotelWebsite?: string;
  guestFirstName?: string;
  guestLastName?: string;
  confirmationCode?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomName?: string;
  roomType?: string;
  totalPrice?: number;
  currency?: string;
  numNights?: number;
  paymentMethod?: string;
  paymentAmount?: number;
  bookingUrl?: string;
  reviewUrl?: string;
  cancellationReason?: string;
}

function baseTemplate(
  subject: string,
  bodyHtml: string,
  hotelName: string,
  hotelWebsite?: string,
): { subject: string; html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${hotelName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:13px;">
                ${hotelWebsite ? `<a href="${hotelWebsite}" style="color:#059669;text-decoration:none;">${hotelWebsite}</a> · ` : ''}
                Sent by EasyBeds
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Strip HTML tags for text version
  const text = bodyHtml
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { subject, html, text };
}

// ─── Template Functions ──────────────────────────────────────────────────────

export function bookingConfirmationTemplate(data: TemplateData) {
  const subject = `Booking Confirmed — ${data.confirmationCode} at ${data.hotelName}`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Booking Confirmed! 🎉</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      Your booking at <strong>${data.hotelName}</strong> has been confirmed.
    </p>
    <table role="presentation" width="100%" cellpadding="12" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;margin:16px 0;border:1px solid #bbf7d0;">
      <tr>
        <td style="color:#166534;font-size:13px;font-weight:600;">Confirmation Code</td>
        <td style="color:#166534;font-size:16px;font-weight:700;text-align:right;">${data.confirmationCode || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Check-in</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.checkInDate || 'TBD'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Check-out</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.checkOutDate || 'TBD'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Room</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.roomName || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Duration</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.numNights || 0} night(s)</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Total</td>
        <td style="color:#18181b;font-size:16px;font-weight:700;text-align:right;">${data.currency || 'TZS'} ${(data.totalPrice || 0).toLocaleString()}</td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#3f3f46;font-size:14px;">
      We look forward to welcoming you! If you have any questions, don't hesitate to contact us.
    </p>
    ${data.hotelPhone ? `<p style="margin:0;color:#71717a;font-size:14px;">📞 ${data.hotelPhone}</p>` : ''}
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

export function bookingReminderTemplate(data: TemplateData) {
  const subject = `Reminder: Check-in tomorrow at ${data.hotelName}`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Check-in Reminder! 📅</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      This is a friendly reminder that your check-in at <strong>${data.hotelName}</strong> is <strong>tomorrow, ${data.checkInDate || ''}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="12" cellspacing="0" style="background-color:#fefce8;border-radius:8px;margin:16px 0;border:1px solid #fef08a;">
      <tr>
        <td style="color:#854d0e;font-size:14px;font-weight:600;">Booking Reference</td>
        <td style="color:#854d0e;font-size:14px;font-weight:700;text-align:right;">${data.confirmationCode || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Room</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.roomName || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Check-out</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.checkOutDate || 'TBD'}</td>
      </tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">
      Please remember to bring a valid ID. We look forward to seeing you!
    </p>
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

export function preArrivalTemplate(data: TemplateData) {
  const subject = `We're excited to welcome you tomorrow! — ${data.hotelName}`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Almost Time! ✨</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      We're getting everything ready for your stay at <strong>${data.hotelName}</strong> tomorrow!
    </p>
    <div style="background-color:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#166534;font-size:15px;font-weight:600;">Your Stay Details</p>
      <p style="margin:0 0 4px;color:#3f3f46;font-size:14px;">📍 ${data.hotelAddress || 'Hotel Address'}</p>
      <p style="margin:0 0 4px;color:#3f3f46;font-size:14px;">📋 Booking: ${data.confirmationCode || 'N/A'}</p>
      <p style="margin:0 0 4px;color:#3f3f46;font-size:14px;">🛏️ Room: ${data.roomName || 'N/A'}</p>
      <p style="margin:0;color:#3f3f46;font-size:14px;">📅 ${data.checkInDate || ''} → ${data.checkOutDate || ''}</p>
    </div>
    <p style="margin:0;color:#71717a;font-size:14px;">
      ${data.hotelPhone ? `Need anything before you arrive? Call us at ${data.hotelPhone}.` : 'See you soon!'}
    </p>
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

export function postCheckoutTemplate(data: TemplateData) {
  const subject = `Thank you for staying at ${data.hotelName}!`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Thank You! 🙏</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      Thank you for choosing <strong>${data.hotelName}</strong>. We hope you had a wonderful stay!
    </p>
    <div style="background-color:#eff6ff;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#1d4ed8;font-size:16px;font-weight:600;">How was your stay?</p>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:14px;">Your feedback helps us improve and helps other travelers.</p>
      ${data.reviewUrl ? `<a href="${data.reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Leave a Review</a>` : ''}
    </div>
    <p style="margin:0;color:#71717a;font-size:14px;">
      We'd love to host you again. Book your next stay directly with us for the best rates!
    </p>
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

export function cancellationTemplate(data: TemplateData) {
  const subject = `Booking Cancelled — ${data.confirmationCode} | ${data.hotelName}`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Booking Cancelled</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      Your booking <strong>${data.confirmationCode}</strong> at <strong>${data.hotelName}</strong> has been cancelled${data.cancellationReason ? ` due to: ${data.cancellationReason}` : '.'}.
    </p>
    <table role="presentation" width="100%" cellpadding="12" cellspacing="0" style="background-color:#fef2f2;border-radius:8px;margin:16px 0;border:1px solid #fecaca;">
      <tr>
        <td style="color:#991b1b;font-size:14px;">Cancelled Booking</td>
        <td style="color:#991b1b;font-size:14px;font-weight:700;text-align:right;">${data.confirmationCode || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Original Dates</td>
        <td style="color:#18181b;font-size:14px;text-align:right;">${data.checkInDate || ''} — ${data.checkOutDate || ''}</td>
      </tr>
      ${data.totalPrice ? `<tr>
        <td style="color:#3f3f46;font-size:14px;">Total</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.currency || 'TZS'} ${data.totalPrice.toLocaleString()}</td>
      </tr>` : ''}
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">
      Any applicable refund will be processed within 5-10 business days.
    </p>
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

export function paymentReceiptTemplate(data: TemplateData) {
  const subject = `Payment Receipt — ${data.confirmationCode} | ${data.hotelName}`;
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Payment Received ✅</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Dear ${data.guestFirstName || 'Guest'},<br><br>
      We've received your payment for booking <strong>${data.confirmationCode}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="12" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;margin:16px 0;border:1px solid #bbf7d0;">
      <tr>
        <td style="color:#166534;font-size:13px;font-weight:600;">Payment Method</td>
        <td style="color:#166534;font-size:14px;font-weight:600;text-align:right;">${data.paymentMethod || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#166534;font-size:13px;font-weight:600;">Amount Paid</td>
        <td style="color:#166534;font-size:16px;font-weight:700;text-align:right;">${data.currency || 'TZS'} ${(data.paymentAmount || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Booking</td>
        <td style="color:#18181b;font-size:14px;font-weight:600;text-align:right;">${data.confirmationCode || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Dates</td>
        <td style="color:#18181b;font-size:14px;text-align:right;">${data.checkInDate || ''} — ${data.checkOutDate || ''}</td>
      </tr>
      <tr>
        <td style="color:#3f3f46;font-size:14px;">Total Booking Cost</td>
        <td style="color:#18181b;font-size:14px;text-align:right;">${data.currency || 'TZS'} ${(data.totalPrice || 0).toLocaleString()}</td>
      </tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">
      This is a payment confirmation. Please keep this for your records.
    </p>
  `;
  return baseTemplate(subject, bodyHtml, data.hotelName, data.hotelWebsite);
}

// ─── Template Registry ──────────────────────────────────────────────────────

export interface EmailTemplateInfo {
  key: string;
  name: string;
  description: string;
  category: 'booking' | 'payment' | 'review' | 'general';
}

export const EMAIL_TEMPLATES: EmailTemplateInfo[] = [
  {
    key: 'booking_confirmation',
    name: 'Booking Confirmation',
    description: 'Sent when a new booking is confirmed',
    category: 'booking',
  },
  {
    key: 'booking_reminder',
    name: 'Booking Reminder',
    description: 'Reminder sent 24 hours before check-in',
    category: 'booking',
  },
  {
    key: 'pre_arrival',
    name: 'Pre-Arrival Message',
    description: 'Welcome message sent on the day of arrival',
    category: 'booking',
  },
  {
    key: 'post_checkout',
    name: 'Post-Checkout Thank You',
    description: 'Thank you message with review request after checkout',
    category: 'review',
  },
  {
    key: 'cancellation',
    name: 'Cancellation Confirmation',
    description: 'Sent when a booking is cancelled',
    category: 'booking',
  },
  {
    key: 'payment_receipt',
    name: 'Payment Receipt',
    description: 'Payment confirmation receipt',
    category: 'payment',
  },
];

export type TemplateKey = typeof EMAIL_TEMPLATES[number]['key'];

/**
 * Render an email template by key with the given data.
 */
export function renderTemplate(key: TemplateKey, data: TemplateData) {
  switch (key) {
    case 'booking_confirmation':
      return bookingConfirmationTemplate(data);
    case 'booking_reminder':
      return bookingReminderTemplate(data);
    case 'pre_arrival':
      return preArrivalTemplate(data);
    case 'post_checkout':
      return postCheckoutTemplate(data);
    case 'cancellation':
      return cancellationTemplate(data);
    case 'payment_receipt':
      return paymentReceiptTemplate(data);
    default:
      throw new Error(`Unknown template: ${key}`);
  }
}
