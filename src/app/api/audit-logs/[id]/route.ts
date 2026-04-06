import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/audit-logs/:id?hotelId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const log = await db.auditLog.findFirst({
      where: { id, hotelId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'Audit log not found.' },
        { status: 404 }
      );
    }

    // Parse JSON values for the response
    let parsedOldValue: unknown = null;
    let parsedNewValue: unknown = null;
    try {
      parsedOldValue = log.oldValue ? JSON.parse(log.oldValue) : null;
    } catch {
      parsedOldValue = log.oldValue;
    }
    try {
      parsedNewValue = log.newValue ? JSON.parse(log.newValue) : null;
    } catch {
      parsedNewValue = log.newValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...log,
        parsedOldValue,
        parsedNewValue,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit log.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
