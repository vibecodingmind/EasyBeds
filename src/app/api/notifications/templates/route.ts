import { NextResponse } from 'next/server';
import { getTemplates } from '@/lib/notifications';

// GET /api/notifications/templates — List available email templates
export async function GET() {
  try {
    const templates = getTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
