import { Resend } from 'resend';

// =============================================================================
// Email Delivery Service — EasyBeds
// Wraps the Resend SDK for sending transactional emails.
// Falls back to mock mode when RESEND_API_KEY is not configured.
// =============================================================================

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({ to, subject, html, from }: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient();

  if (!client) {
    console.log('[EMAIL] Resend not configured, would have sent:', { to, subject });
    return { success: true, messageId: 'mock-id' };
  }

  try {
    const result = await client.emails.send({
      from: from || 'EasyBeds <noreply@easybeds.com>',
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('[EMAIL] Failed:', message);
    return { success: false, error: message };
  }
}
