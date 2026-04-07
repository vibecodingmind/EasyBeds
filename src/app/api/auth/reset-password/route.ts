import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { hashPassword } from '@/lib/auth';

// POST /api/auth/reset-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Find all users with a reset token (we need to compare hashes)
    const usersWithReset = await db.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { gt: new Date() },
      },
    });

    // Find the user whose reset token matches
    let matchedUser: typeof usersWithReset[number] | null = null;
    for (const user of usersWithReset) {
      if (user.resetToken && (await compare(token, user.resetToken))) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHashedPassword = await hashPassword(newPassword);

    // Update user — clear reset token and set new password
    await db.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password.';
    console.error('[RESET-PASSWORD]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
