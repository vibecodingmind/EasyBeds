import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/night-audit/latest?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const audit = await db.nightAudit.findFirst({
      where: { hotelId },
      include: {
        auditor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { auditDate: 'desc' },
    });

    if (!audit) {
      return NextResponse.json(
        { success: true, data: null, message: 'No night audit found.' }
      );
    }

    return NextResponse.json({ success: true, data: audit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch latest night audit.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
