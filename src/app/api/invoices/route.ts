import { NextRequest, NextResponse } from 'next/server';
import { createInvoice, getInvoices } from '@/lib/invoices';

// GET /api/invoices?hotelId=xxx — List invoices
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const invoices = await getInvoices(hotelId);

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invoices.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/invoices — Create invoice from booking
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId query parameter is required.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { bookingId, taxRate, notes } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId is required.' },
        { status: 400 },
      );
    }

    const invoice = await createInvoice({
      hotelId,
      bookingId,
      taxRate: taxRate || 0,
      notes,
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create invoice.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
