import { db } from '@/lib/db';
import { format } from 'date-fns';

// =============================================================================
// Invoice Service — EasyBeds
// Handles invoice creation, retrieval, and PDF generation.
// =============================================================================

export interface CreateInvoiceInput {
  hotelId: string;
  bookingId: string;
  taxRate?: number;
  notes?: string;
}

/**
 * Create a new invoice from a booking.
 */
export async function createInvoice(input: CreateInvoiceInput) {
  const { hotelId, bookingId, taxRate = 0, notes } = input;

  // Validate booking and fetch related data
  const booking = await db.booking.findFirst({
    where: { id: bookingId, hotelId },
    include: {
      room: true,
      guest: true,
      hotel: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Check if an invoice already exists for this booking
  const existingInvoice = await db.invoice.findFirst({
    where: { bookingId, hotelId },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // Calculate amounts
  const subtotal = booking.totalPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  // Generate invoice number: INV-YYYY-XXXX
  const year = new Date().getFullYear();
  const invoiceCount = await db.invoice.count({
    where: {
      hotelId,
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

  // Create the invoice
  const invoice = await db.invoice.create({
    data: {
      hotelId,
      bookingId,
      guestId: booking.guestId,
      invoiceNumber,
      status: 'sent',
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: booking.currency,
      dueDate: booking.checkInDate, // Due at check-in
      notes: notes || null,
    },
  });

  return invoice;
}

/**
 * Get invoice details with booking and guest info.
 */
export async function getInvoice(invoiceId: string, hotelId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, hotelId },
    include: {
      hotel: {
        select: {
          name: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          website: true,
          logoUrl: true,
          currency: true,
        },
      },
      booking: {
        include: {
          room: {
            select: { name: true, roomNumber: true, type: true },
          },
          guest: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              country: true,
            },
          },
        },
      },
      guest: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found.');
  }

  return invoice;
}

/**
 * List invoices for a hotel.
 */
export async function getInvoices(hotelId: string) {
  return db.invoice.findMany({
    where: { hotelId },
    include: {
      guest: {
        select: { firstName: true, lastName: true, email: true },
      },
      booking: {
        select: { confirmationCode: true, checkInDate: true, checkOutDate: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Generate a text-based PDF invoice as a downloadable HTML response.
 * Returns the HTML string that can be served as PDF content.
 */
export function generateInvoiceHtml(invoice: Awaited<ReturnType<typeof getInvoice>>): string {
  const hotel = invoice.hotel;
  const booking = invoice.booking;
  const guest = invoice.guest;

  const checkIn = format(new Date(booking.checkInDate), 'MMM dd, yyyy');
  const checkOut = format(new Date(booking.checkOutDate), 'MMM dd, yyyy');
  const issuedDate = format(new Date(invoice.createdAt), 'MMM dd, yyyy');
  const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'Due at check-in';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; color: #18181b; }
    .container { max-width: 800px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px 40px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header .invoice-meta { text-align: right; }
    .header .invoice-meta .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9; }
    .header .invoice-meta .value { font-size: 18px; font-weight: 600; }
    .body { padding: 32px 40px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 32px; gap: 24px; }
    .party { flex: 1; }
    .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 8px; }
    .party .name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .party .detail { font-size: 13px; color: #52525b; line-height: 1.5; }
    .dates { display: flex; gap: 24px; margin-bottom: 32px; background: #f9fafb; padding: 16px 20px; border-radius: 8px; }
    .date-item { flex: 1; }
    .date-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; }
    .date-item .value { font-size: 14px; font-weight: 500; margin-top: 2px; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; border-bottom: 2px solid #e4e4e7; }
    table.items td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f4f4f5; }
    table.items td.amount { text-align: right; font-weight: 600; }
    table.items td.right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #18181b; padding-top: 12px; font-size: 18px; font-weight: 700; color: #059669; }
    .footer { padding: 20px 40px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #a1a1aa; }
    @media print {
      body { background: #fff; }
      .container { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${hotel.name}</h1>
      <div class="invoice-meta">
        <div class="label">Invoice</div>
        <div class="value">${invoice.invoiceNumber}</div>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        <div class="party">
          <h3>From</h3>
          <div class="name">${hotel.name}</div>
          <div class="detail">
            ${hotel.address || ''}${hotel.city ? `, ${hotel.city}` : ''}${hotel.country ? `, ${hotel.country}` : ''}<br>
            ${hotel.phone ? `Phone: ${hotel.phone}<br>` : ''}
            ${hotel.email ? `Email: ${hotel.email}<br>` : ''}
            ${hotel.website ? `Web: ${hotel.website}` : ''}
          </div>
        </div>
        <div class="party" style="text-align:right;">
          <h3>Bill To</h3>
          <div class="name">${guest.firstName} ${guest.lastName}</div>
          <div class="detail">
            ${guest.email ? `${guest.email}<br>` : ''}
            ${guest.phone ? `Phone: ${guest.phone}<br>` : ''}
            ${guest.address ? `${guest.address}` : ''}${guest.city ? `, ${guest.city}` : ''}${guest.country ? `, ${guest.country}` : ''}
          </div>
        </div>
      </div>
      <div class="dates">
        <div class="date-item">
          <div class="label">Issued</div>
          <div class="value">${issuedDate}</div>
        </div>
        <div class="date-item">
          <div class="label">Due Date</div>
          <div class="value">${dueDate}</div>
        </div>
        <div class="date-item">
          <div class="label">Booking Ref</div>
          <div class="value">${booking.confirmationCode}</div>
        </div>
      </div>
      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th class="right">Unit Price</th>
            <th class="right">Nights</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${booking.room.name} (${booking.room.type}) — ${checkIn} to ${checkOut}</td>
            <td class="right">${invoice.currency} ${booking.pricePerNight.toLocaleString()}</td>
            <td class="right">${booking.numNights}</td>
            <td class="amount">${invoice.currency} ${invoice.subtotal.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${invoice.currency} ${invoice.subtotal.toLocaleString()}</span>
          </div>
          ${invoice.taxRate > 0 ? `<div class="totals-row">
            <span>Tax (${invoice.taxRate}%)</span>
            <span>${invoice.currency} ${invoice.taxAmount.toLocaleString()}</span>
          </div>` : ''}
          <div class="totals-row total">
            <span>Total</span>
            <span>${invoice.currency} ${invoice.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      Thank you for your business! — Generated by EasyBeds
    </div>
  </div>
</body>
</html>`;
}
