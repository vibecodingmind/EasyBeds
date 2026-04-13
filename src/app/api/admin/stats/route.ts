import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/admin/stats — Platform-wide statistics (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  try {
    // Run all counts in parallel for speed
    const [
      totalHotels,
      activeHotels,
      totalRooms,
      totalUsers,
      totalBookings,
      totalGuests,
      totalPayments,
      recentHotels,
    ] = await Promise.all([
      // Total hotels
      db.hotel.count(),
      // Active hotels
      db.hotel.count({ where: { isActive: true } }),
      // Total rooms across all hotels
      db.room.count(),
      // Total users
      db.user.count(),
      // Total bookings
      db.booking.count(),
      // Total guests
      db.guest.count(),
      // Total payments (completed)
      db.payment.aggregate({ where: { status: 'completed' }, _sum: { amount: true }, _count: true }),
      // Recent hotels (last 10)
      db.hotel.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, city: true, country: true, plan: true,
          _count: { select: { rooms: true, bookings: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // This month bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyBookings = await db.booking.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    // This month revenue
    const monthlyRevenue = await db.payment.aggregate({
      where: { status: 'completed', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    // Plan distribution
    const planCounts = await db.hotel.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    const planDistribution: Record<string, number> = {
      free: 0, starter: 0, pro: 0, enterprise: 0, trial: 0,
    };
    for (const pc of planCounts) {
      const key = pc.plan as string;
      if (key in planDistribution) planDistribution[key] = pc._count.id;
      else planDistribution[key] = pc._count.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalHotels,
        activeHotels,
        totalRooms,
        totalUsers,
        totalBookings,
        totalGuests,
        monthlyBookings,
        totalRevenue: totalPayments._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        planDistribution,
        recentHotels,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch platform stats.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
