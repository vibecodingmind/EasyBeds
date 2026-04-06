import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/audit-logs?hotelId=xxx&entityType=booking&entityId=xxx&action=create&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 }
      );
    }

    const entityType = request.nextUrl.searchParams.get('entityType');
    const entityId = request.nextUrl.searchParams.get('entityId');
    const action = request.nextUrl.searchParams.get('action');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = { hotelId };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Math.min(limit, 200),
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
