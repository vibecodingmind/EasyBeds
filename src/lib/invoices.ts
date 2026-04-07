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

// =============================================================================
// HTML Invoice Generation — A4 Print-Optimized
// =============================================================================

/** Minimal HTML entity escape for safety in generated markup */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a complete, print-optimized HTML invoice document.
 * Returns a self-contained HTML string with A4 layout, inline CSS, and auto-print.
 */
export function generateInvoiceHtml(invoice: Awaited<ReturnType<typeof getInvoice>>): string {
  const hotel = invoice.hotel;
  const booking = invoice.booking;
  const guest = invoice.guest;

  const checkIn = format(new Date(booking.checkInDate), 'MMM dd, yyyy');
  const checkOut = format(new Date(booking.checkOutDate), 'MMM dd, yyyy');
  const issuedDate = format(new Date(invoice.createdAt), 'MMM dd, yyyy');
  const dueDate = invoice.dueDate
    ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
    : 'Due at check-in';

  const generatedAt = new Date().toLocaleString();

  const hotelContact = [
    hotel.address && `${esc(hotel.address)}`,
    hotel.city && `${esc(hotel.city)}${hotel.country ? `, ${esc(hotel.country)}` : ''}`,
    hotel.phone && `Phone: ${esc(hotel.phone)}`,
    hotel.email && `Email: ${esc(hotel.email)}`,
    hotel.website && `Web: ${esc(hotel.website)}`,
  ]
    .filter(Boolean)
    .join('<br>');

  const guestContact = [
    guest.email && `${esc(guest.email)}`,
    guest.phone && `Phone: ${esc(guest.phone)}`,
    guest.address && `${esc(guest.address)}${guest.city ? `, ${esc(guest.city)}` : ''}${guest.country ? `, ${esc(guest.country)}` : ''}`,
  ]
    .filter(Boolean)
    .join('<br>');

  const fmtCurrency = (amount: number) => {
    try {
      return amount.toLocaleString(undefined, {
        style: 'currency',
        currency: invoice.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return `${invoice.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${esc(invoice.invoiceNumber)}</title>
  <style>
    /* ── Reset ────────────────────────────────────────────────────── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Page ─────────────────────────────────────────────────────── */
    @page { size: A4; margin: 15mm 12mm; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      color: #18181b;
      background: #ffffff;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
    }

    /* ── Header ───────────────────────────────────────────────────── */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 0 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 28px;
    }
    .hotel-brand h1 {
      font-size: 22px;
      font-weight: 700;
      color: #18181b;
    }
    .hotel-brand .contact {
      font-size: 12px;
      color: #52525b;
      margin-top: 4px;
      line-height: 1.6;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-badge .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717a;
    }
    .invoice-badge .number {
      font-size: 22px;
      font-weight: 700;
      color: #10b981;
    }
    .invoice-badge .status {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: #d1fae5;
      color: #065f46;
    }

    /* ── Parties (From / Bill To) ─────────────────────────────────── */
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 24px;
    }
    .party { flex: 1; }
    .party.right { text-align: right; }
    .party h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #71717a;
      margin-bottom: 8px;
    }
    .party .name {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .party .detail {
      font-size: 12px;
      color: #52525b;
      line-height: 1.6;
    }

    /* ── Date / Reference Bar ─────────────────────────────────────── */
    .info-bar {
      display: flex;
      gap: 0;
      margin-bottom: 28px;
      background: #f9fafb;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-item {
      flex: 1;
      padding: 12px 16px;
      border-right: 1px solid #e4e4e7;
    }
    .info-item:last-child { border-right: none; }
    .info-item .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717a;
    }
    .info-item .value {
      font-size: 14px;
      font-weight: 600;
      color: #18181b;
      margin-top: 2px;
    }

    /* ── Line Items Table ─────────────────────────────────────────── */
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.items thead th {
      background: #f4f4f5;
      text-align: left;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #52525b;
      border-bottom: 2px solid #d4d4d8;
    }
    table.items tbody td {
      padding: 12px 14px;
      font-size: 13px;
      border-bottom: 1px solid #f4f4f5;
      color: #27272a;
    }
    table.items tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .amount { font-weight: 600; }

    /* ── Totals ───────────────────────────────────────────────────── */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #3f3f46;
    }
    .totals-row.total {
      border-top: 2px solid #18181b;
      padding-top: 12px;
      margin-top: 4px;
    }
    .totals-row.total .label { font-weight: 600; color: #18181b; }
    .totals-row.total .value {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
    }

    /* ── Notes ────────────────────────────────────────────────────── */
    .notes {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 28px;
    }
    .notes h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717a;
      margin-bottom: 4px;
    }
    .notes p {
      font-size: 13px;
      color: #52525b;
    }

    /* ── Footer ───────────────────────────────────────────────────── */
    .doc-footer {
      padding-top: 16px;
      border-top: 1px solid #e4e4e7;
      text-align: center;
      font-size: 11px;
      color: #a1a1aa;
      line-height: 1.6;
    }

    /* ── Print ────────────────────────────────────────────────────── */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page { max-width: none; }
      .invoice-header { page-break-after: avoid; }
      table.items { page-break-inside: avoid; }
      .totals-section { page-break-inside: avoid; }
    }

    /* ── Screen Responsive ────────────────────────────────────────── */
    @media screen and (max-width: 640px) {
      .parties { flex-direction: column; gap: 16px; }
      .party.right { text-align: left; }
      .info-bar { flex-direction: column; }
      .info-item { border-right: none; border-bottom: 1px solid #e4e4e7; }
      .info-item:last-child { border-bottom: none; }
      body { padding: 0 8px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="invoice-header">
      <div class="hotel-brand">
        <h1>${esc(hotel.name)}</h1>
        <div class="contact">${hotelContact}</div>
      </div>
      <div class="invoice-badge">
        <div class="label">Invoice</div>
        <div class="number">${esc(invoice.invoiceNumber)}</div>
        <div class="status">${esc(invoice.status)}</div>
      </div>
    </div>

    <!-- From / Bill To -->
    <div class="parties">
      <div class="party">
        <h3>From</h3>
        <div class="name">${esc(hotel.name)}</div>
        <div class="detail">${hotelContact}</div>
      </div>
      <div class="party right">
        <h3>Bill To</h3>
        <div class="name">${esc(guest.firstName)} ${esc(guest.lastName)}</div>
        <div class="detail">${guestContact || '—'}</div>
      </div>
    </div>

    <!-- Info Bar -->
    <div class="info-bar">
      <div class="info-item">
        <div class="label">Issued</div>
        <div class="value">${esc(issuedDate)}</div>
      </div>
      <div class="info-item">
        <div class="label">Due Date</div>
        <div class="value">${esc(dueDate)}</div>
      </div>
      <div class="info-item">
        <div class="label">Booking Ref</div>
        <div class="value">${esc(booking.confirmationCode)}</div>
      </div>
      <div class="info-item">
        <div class="label">Stay</div>
        <div class="value">${esc(checkIn)} – ${esc(checkOut)}</div>
      </div>
    </div>

    <!-- Line Items -->
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Nights</th>
          <th class="text-right amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(booking.room.name)} (${esc(booking.room.type)})<br>
            <span style="font-size:11px;color:#71717a;">${esc(checkIn)} to ${esc(checkOut)}</span>
          </td>
          <td class="text-right">${fmtCurrency(booking.pricePerNight)}</td>
          <td class="text-right">${booking.numNights}</td>
          <td class="text-right amount">${fmtCurrency(invoice.subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row">
          <span class="label">Subtotal</span>
          <span class="value">${fmtCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.taxRate > 0
          ? `<div class="totals-row">
               <span class="label">Tax (${invoice.taxRate}%)</span>
               <span class="value">${fmtCurrency(invoice.taxAmount)}</span>
             </div>`
          : ''}
        <div class="totals-row total">
          <span class="label">Total</span>
          <span class="value">${fmtCurrency(invoice.totalAmount)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes
      ? `<div class="notes">
           <h4>Notes</h4>
           <p>${esc(invoice.notes)}</p>
         </div>`
      : ''}

    <!-- Footer -->
    <div class="doc-footer">
      Thank you for your business!<br>
      Generated by EasyBeds on ${esc(generatedAt)} &middot; ${esc(hotel.name)}
    </div>
  </div>

  <!-- Auto-print -->
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); };
  </script>
</body>
</html>`;
}
