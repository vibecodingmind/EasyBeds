import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { forgotPasswordTemplate } from '@/lib/email-templates';

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate a random token
    const token = crypto.randomUUID();
    const hashedToken = await hash(token, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token and expiry
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry,
      },
    });

    // Build reset link — uses current origin from request headers
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const resetLink = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    // Send password reset email
    const template = forgotPasswordTemplate({
      name: user.name,
      resetLink,
    });

    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request.';
    console.error('[FORGOT-PASSWORD]', message);
    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  }
}
