import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rate-parity?hotelId=xxx
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 },
      );
    }

    const rooms = await db.room.findMany({
      where: { hotelId, isActive: true },
      orderBy: { name: 'asc' },
    });

    const channels = await db.channel.findMany({
      where: { hotelId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get all rate plans
    const ratePlans = await db.ratePlan.findMany({
      where: { hotelId, isActive: true },
      include: {
        room: { select: { id: true, name: true, roomNumber: true, type: true, basePrice: true } },
        channel: { select: { id: true, name: true, type: true } },
      },
    });

    // Build parity data: for each room, show prices across channels
    const parityData = rooms.map((room) => {
      const roomPlans = ratePlans.filter((rp) => rp.roomId === room.id);

      // Group by channel
      const channelPrices: Record<string, number> = {};

      // Base price (direct)
      channelPrices['Base Price'] = room.basePrice;

      for (const plan of roomPlans) {
        const chName = plan.channel?.name || 'Direct';
        channelPrices[chName] = plan.pricePerNight;
      }

      // Find the direct price for comparison
      const directPrice = channelPrices['Direct'] || channelPrices['Base Price'] || room.basePrice;

      // Flag discrepancies (>5% difference from direct)
      const discrepancies: Array<{ channel: string; price: number; difference: number; percentDifference: number }> = [];
      for (const [ch, price] of Object.entries(channelPrices)) {
        if (ch === 'Base Price') continue;
        const diff = price - directPrice;
        const pctDiff = directPrice > 0 ? (diff / directPrice) * 100 : 0;
        if (Math.abs(pctDiff) > 5) {
          discrepancies.push({
            channel: ch,
            price,
            difference: Math.round(diff * 100) / 100,
            percentDifference: Math.round(pctDiff * 10) / 10,
          });
        }
      }

      return {
        roomId: room.id,
        roomName: room.name,
        roomNumber: room.roomNumber,
        roomType: room.type,
        basePrice: room.basePrice,
        channelPrices,
        directPrice,
        minPrice: Math.min(...Object.values(channelPrices).filter((p) => p > 0)),
        maxPrice: Math.max(...Object.values(channelPrices)),
        hasDiscrepancies: discrepancies.length > 0,
        discrepancies,
      };
    });

    // Summary
    const totalRooms = rooms.length;
    const roomsWithDiscrepancies = parityData.filter((r) => r.hasDiscrepancies).length;
    const allDiscrepancies = parityData.flatMap((r) => r.discrepancies);
    const avgDiscrepancy = allDiscrepancies.length > 0
      ? allDiscrepancies.reduce((sum, d) => sum + Math.abs(d.percentDifference), 0) / allDiscrepancies.length
      : 0;

    // Channel list with types
    const channelList = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRooms,
          roomsWithDiscrepancies,
          parityRate: totalRooms > 0 ? Math.round(((totalRooms - roomsWithDiscrepancies) / totalRooms) * 100) : 100,
          avgDiscrepancy: Math.round(avgDiscrepancy * 10) / 10,
          totalDiscrepancies: allDiscrepancies.length,
        },
        channels: channelList,
        rooms: parityData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check rate parity.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
