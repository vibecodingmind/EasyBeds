// =============================================================================
// EasyBeds PDF / Print Utilities
// Shared helpers for generating print-optimized HTML documents.
// Uses browser-native "Print to PDF" approach — no heavy dependencies.
// =============================================================================

/**
 * Options for generating a print-optimized HTML document.
 */
export interface PDFHtmlOptions {
  /** Document title (shown in browser tab / PDF metadata) */
  title: string;
  /** Hotel name displayed in the header area */
  hotelName: string;
  /** Optional date range string (e.g. "Jan 1 – Jan 31, 2025") */
  dateRange?: string;
  /** Hotel address / contact line */
  hotelAddress?: string;
  /** The main HTML content for the document body */
  content: string;
  /** Optional footer text */
  footer?: string;
}

/**
 * Generate a complete, self-contained HTML document optimized for A4 printing.
 *
 * Features:
 * - A4 page size with proper margins
 * - Clean, professional typography
 * - Hotel branding header
 * - Auto-print on load
 * - No external dependencies (all CSS inline)
 */
export function generatePDFHtml(options: PDFHtmlOptions): string {
  const {
    title,
    hotelName,
    dateRange,
    hotelAddress = '',
    content,
    footer,
  } = options;

  const generatedAt = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* ── Reset ──────────────────────────────────────────────────────────── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Page Setup ─────────────────────────────────────────────────────── */
    @page {
      size: A4;
      margin: 15mm 12mm;
    }

    /* ── Typography ─────────────────────────────────────────────────────── */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      color: #18181b;
      background: #ffffff;
    }

    /* ── Layout ─────────────────────────────────────────────────────────── */
    .page-wrapper {
      max-width: 210mm;
      margin: 0 auto;
    }

    /* ── Document Header ────────────────────────────────────────────────── */
    .doc-header {
      padding: 20px 0 16px;
      border-bottom: 2px solid #10b981;
      margin-bottom: 24px;
    }
    .doc-header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #18181b;
      margin-bottom: 2px;
    }
    .doc-header .hotel-name {
      font-size: 13px;
      color: #52525b;
    }
    .doc-header .date-range {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }

    /* ── KPI Grid ───────────────────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .kpi-card .value {
      font-size: 20px;
      font-weight: 700;
      color: #18181b;
    }
    .kpi-card .label {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }

    /* ── Section Headings ───────────────────────────────────────────────── */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #18181b;
      margin: 24px 0 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #10b981;
    }

    /* ── Tables ─────────────────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 20px;
    }
    thead th {
      background: #f4f4f5;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #52525b;
      border-bottom: 2px solid #e4e4e7;
    }
    tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid #f4f4f5;
      color: #27272a;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .total-row td {
      font-weight: 700;
      border-top: 2px solid #d4d4d8;
      background: #fafafa;
    }
    .negative { color: #dc2626; }

    /* ── Badges ─────────────────────────────────────────────────────────── */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f4f4f5; color: #52525b; }

    /* ── Document Footer ────────────────────────────────────────────────── */
    .doc-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e4e4e7;
      font-size: 11px;
      color: #a1a1aa;
      text-align: center;
    }

    /* ── Empty State ────────────────────────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #a1a1aa;
      font-style: italic;
    }

    /* ── Print Optimization ─────────────────────────────────────────────── */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-wrapper {
        max-width: none;
      }
      .doc-header {
        page-break-after: avoid;
      }
      .section-title {
        page-break-after: avoid;
      }
      table {
        page-break-inside: avoid;
      }
      .kpi-grid {
        page-break-inside: avoid;
      }
      .no-print {
        display: none !important;
      }
    }

    /* ── Responsive (screen only) ───────────────────────────────────────── */
    @media screen and (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      body {
        padding: 0 12px;
      }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Document Header -->
    <div class="doc-header">
      <h1>${escapeHtml(title)}</h1>
      <div class="hotel-name">${escapeHtml(hotelName)}${hotelAddress ? ` &middot; ${escapeHtml(hotelAddress)}` : ''}</div>
      ${dateRange ? `<div class="date-range">${escapeHtml(dateRange)}</div>` : ''}
    </div>

    <!-- Main Content -->
    ${content}

    <!-- Footer -->
    <div class="doc-footer">
      ${footer ? `${escapeHtml(footer)}<br>` : ''}
      Generated by EasyBeds on ${escapeHtml(generatedAt)}
    </div>
  </div>

  <!-- Auto-print trigger -->
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;
}

// =============================================================================
// Client-side Helpers
// =============================================================================

/**
 * Download a printable HTML file and trigger the browser's print dialog.
 *
 * Usage (client-side only):
 * ```ts
 * downloadPrintableHtml(htmlString, 'my-report.html')
 * ```
 */
export function downloadPrintableHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Open a printable HTML document in a new tab.
 * The document should contain an auto-print script.
 */
export function openPrintPreview(html: string, title: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.document.title = title;
  }
  // Clean up the blob URL after the window loads
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// =============================================================================
// Internal Helpers
// =============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
