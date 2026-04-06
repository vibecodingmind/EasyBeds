import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, generateInvoiceHtml } from '@/lib/invoices';

// GET /api/invoices/[id]/pdf?hotelId=xxx — Generate and serve PDF invoice as HTML
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
    const html = generateInvoiceHtml(invoice);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate invoice PDF.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
