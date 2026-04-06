import { NextRequest, NextResponse } from 'next/server';
import { getInvoice } from '@/lib/invoices';

// GET /api/invoices/[id]?hotelId=xxx — Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const invoice = await getInvoice(id, hotelId);

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invoice.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
