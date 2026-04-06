import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { syncAllChannels } from '@/lib/ical-import'

// POST /api/channels/sync-all — Trigger iCal sync for all channels with iCal URLs
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const hotelId = auth.hotelId

    const result = await syncAllChannels(hotelId)

    return NextResponse.json({
      success: true,
      data: {
        message: `Synced ${result.synced} of ${result.results.length} channels`,
        ...result,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
