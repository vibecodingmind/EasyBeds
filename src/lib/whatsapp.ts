// =============================================================================
// WhatsApp Notification Service
// Logger-based implementation (actual WhatsApp Business API integration later)
// =============================================================================

interface WhatsAppMessagePayload {
  to: string
  templateName: string
  templateParams?: Record<string, string>
  body?: string
  hotelId: string
  bookingId?: string
  guestId?: string
}

interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  externalRef?: string
  error?: string
}

type NotificationType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'pre_arrival'
  | 'post_checkout'
  | 'cancellation'
  | 'payment_receipt'
  | 'review_request'
  | 'low_balance'
  | 'housekeeping_alert'
  | 'system_alert'
  | 'custom'

// Template definitions
const WHATSAPP_TEMPLATES: Record<string, { body: string; notificationType: NotificationType }> = {
  booking_confirmation: {
    body: 'Hello {{guestName}}, your booking at {{hotelName}} is confirmed! Room: {{roomName}}. Check-in: {{checkInDate}}, Check-out: {{checkOutDate}}. Confirmation: {{confirmationCode}}. Total: {{totalPrice}} {{currency}}. We look forward to welcoming you!',
    notificationType: 'booking_confirmation',
  },
  check_in_reminder: {
    body: 'Hello {{guestName}}, this is a friendly reminder that your check-in at {{hotelName}} is tomorrow, {{checkInDate}}. Check-in time starts at {{checkInTime}}. Your room: {{roomName}}. See you soon!',
    notificationType: 'pre_arrival',
  },
  check_out_thanks: {
    body: 'Thank you {{guestName}} for staying at {{hotelName}}! We hope you enjoyed your visit. Your total was {{totalPrice}} {{currency}}. We would love to hear your feedback. Safe travels!',
    notificationType: 'post_checkout',
  },
  payment_received: {
    body: 'Hello {{guestName}}, we have received your payment of {{amount}} {{currency}} for booking {{confirmationCode}} at {{hotelName}}. Thank you!',
    notificationType: 'payment_receipt',
  },
}

function applyTemplate(template: string, params: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export class WhatsAppService {
  /**
   * Send a custom WhatsApp message
   * For now, logs the message and stores as Notification record
   */
  static async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    const { to, body, hotelId, bookingId, guestId } = payload
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    try {
      // Log the message (simulated send)
      console.log(`[WhatsApp] Sending to: ${to}`)
      console.log(`[WhatsApp] Body: ${body}`)
      console.log(`[WhatsApp] Message ID: ${messageId}`)

      // Store as Notification record
      const { db } = await import('@/lib/db')
      await db.notification.create({
        data: {
          hotelId,
          bookingId,
          guestId,
          type: 'custom',
          channel: 'whatsapp',
          status: 'sent',
          subject: `WhatsApp to ${to}`,
          body,
          toAddress: to,
          externalRef: messageId,
          sentAt: new Date(),
        },
      })

      return { success: true, messageId, externalRef: messageId }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[WhatsApp] Failed to send: ${message}`)

      // Store failed notification
      try {
        const { db } = await import('@/lib/db')
        await db.notification.create({
          data: {
            hotelId,
            bookingId,
            guestId,
            type: 'custom',
            channel: 'whatsapp',
            status: 'failed',
            subject: `WhatsApp to ${to}`,
            body,
            toAddress: to,
            externalRef: messageId,
            errorMessage: message,
          },
        })
      } catch {
        // Ignore notification creation errors
      }

      return { success: false, error: message }
    }
  }

  /**
   * Send a template-based WhatsApp message
   */
  static async sendTemplate(payload: WhatsAppMessagePayload & { templateParams: Record<string, string> }): Promise<WhatsAppSendResult> {
    const template = WHATSAPP_TEMPLATES[payload.templateName]
    if (!template) {
      return { success: false, error: `Unknown template: ${payload.templateName}` }
    }

    const body = applyTemplate(template.body, payload.templateParams)
    const messageId = `wa_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    try {
      console.log(`[WhatsApp Template] Template: ${payload.templateName}`)
      console.log(`[WhatsApp Template] To: ${payload.to}`)
      console.log(`[WhatsApp Template] Rendered body: ${body}`)

      const { db } = await import('@/lib/db')
      await db.notification.create({
        data: {
          hotelId: payload.hotelId,
          bookingId: payload.bookingId,
          guestId: payload.guestId,
          type: template.notificationType,
          channel: 'whatsapp',
          status: 'sent',
          subject: `WhatsApp Template: ${payload.templateName}`,
          body,
          toAddress: payload.to,
          externalRef: messageId,
          sentAt: new Date(),
        },
      })

      return { success: true, messageId, externalRef: messageId }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[WhatsApp Template] Failed: ${message}`)

      return { success: false, error: message }
    }
  }

  /**
   * Get available template names
   */
  static getAvailableTemplates(): string[] {
    return Object.keys(WHATSAPP_TEMPLATES)
  }

  /**
   * Send booking confirmation
   */
  static async sendBookingConfirmation(params: {
    hotelId: string; bookingId: string; guestId: string;
    to: string; guestName: string; hotelName: string; roomName: string;
    checkInDate: string; checkOutDate: string; confirmationCode: string;
    totalPrice: string; currency: string;
  }): Promise<WhatsAppSendResult> {
    return WhatsAppService.sendTemplate({
      to: params.to,
      templateName: 'booking_confirmation',
      hotelId: params.hotelId,
      bookingId: params.bookingId,
      guestId: params.guestId,
      templateParams: params,
    })
  }

  /**
   * Send check-in reminder
   */
  static async sendCheckInReminder(params: {
    hotelId: string; bookingId: string; guestId: string;
    to: string; guestName: string; hotelName: string; roomName: string;
    checkInDate: string; checkInTime: string;
  }): Promise<WhatsAppSendResult> {
    return WhatsAppService.sendTemplate({
      to: params.to,
      templateName: 'check_in_reminder',
      hotelId: params.hotelId,
      bookingId: params.bookingId,
      guestId: params.guestId,
      templateParams: params,
    })
  }

  /**
   * Send check-out thanks
   */
  static async sendCheckOutThanks(params: {
    hotelId: string; bookingId: string; guestId: string;
    to: string; guestName: string; hotelName: string;
    totalPrice: string; currency: string;
  }): Promise<WhatsAppSendResult> {
    return WhatsAppService.sendTemplate({
      to: params.to,
      templateName: 'check_out_thanks',
      hotelId: params.hotelId,
      bookingId: params.bookingId,
      guestId: params.guestId,
      templateParams: params,
    })
  }

  /**
   * Send payment received notification
   */
  static async sendPaymentReceived(params: {
    hotelId: string; bookingId: string; guestId: string;
    to: string; guestName: string; hotelName: string;
    confirmationCode: string; amount: string; currency: string;
  }): Promise<WhatsAppSendResult> {
    return WhatsAppService.sendTemplate({
      to: params.to,
      templateName: 'payment_received',
      hotelId: params.hotelId,
      bookingId: params.bookingId,
      guestId: params.guestId,
      templateParams: params,
    })
  }
}
