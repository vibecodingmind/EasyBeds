import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const MAX_MESSAGES_PER_BOOKING = 20;

// POST /api/ai/chat — Send a message to the AI concierge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, message, guestId } = body;

    if (!bookingId || !message || !guestId) {
      return NextResponse.json(
        { success: false, error: 'bookingId, guestId, and message are required.' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message is too long (max 2000 characters).' },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await db.booking.findFirst({
      where: { id: bookingId },
      include: {
        hotel: { select: { id: true, name: true, description: true, address: true, city: true, country: true, phone: true, email: true, checkInTime: true, checkOutTime: true, website: true } },
        room: { select: { name: true, roomNumber: true, type: true, amenities: true, description: true } },
        guest: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    // Rate limit check
    const messageCount = await db.guestMessage.count({
      where: { bookingId, hotelId: booking.hotelId },
    });

    if (messageCount >= MAX_MESSAGES_PER_BOOKING) {
      return NextResponse.json(
        { success: false, error: `Message limit reached (${MAX_MESSAGES_PER_BOOKING} messages per booking). Please contact hotel staff directly.` },
        { status: 429 }
      );
    }

    // Store guest message
    await db.guestMessage.create({
      data: {
        hotelId: booking.hotelId,
        bookingId,
        guestId,
        role: 'guest',
        channel: 'chat',
        content: message.trim(),
      },
    });

    // Get recent chat history for context (last 10 messages)
    const recentMessages = await db.guestMessage.findMany({
      where: { bookingId, hotelId: booking.hotelId },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { role: true, content: true },
    });

    // Build system prompt with hotel and booking context
    const systemPrompt = `You are a helpful AI concierge for ${booking.hotel.name}. Answer guest questions about the hotel, local area, amenities, check-in/check-out times, restaurants, attractions, and any other inquiries.

Hotel Information:
- Name: ${booking.hotel.name}
- Location: ${booking.hotel.address || 'N/A'}, ${booking.hotel.city || 'N/A'}, ${booking.hotel.country}
- Description: ${booking.hotel.description || 'A comfortable hotel'}
- Check-in time: ${booking.hotel.checkInTime}
- Check-out time: ${booking.hotel.checkOutTime}
- Phone: ${booking.hotel.phone || 'N/A'}
- Email: ${booking.hotel.email || 'N/A'}
- Website: ${booking.hotel.website || 'N/A'}

Guest's Booking:
- Room: ${booking.room.name} (${booking.room.roomNumber}), ${booking.room.type}
- Room description: ${booking.room.description || 'N/A'}
- Amenities: ${booking.room.amenities || 'Standard amenities'}
- Guest: ${booking.guest.firstName} ${booking.guest.lastName}
- Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}
- Check-out: ${booking.checkOutDate.toLocaleDateString()}

Be friendly, professional, and helpful. Keep responses concise. If you don't know something specific about the local area, suggest the guest contact the hotel staff at ${booking.hotel.phone || 'the front desk'}.`;

    // Build conversation messages
    const conversationMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of recentMessages) {
      conversationMessages.push({
        role: msg.role === 'guest' ? 'user' : msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    // Call AI
    let aiResponse = 'Sorry, I am unable to process your request at the moment. Please contact the hotel front desk for assistance.';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: conversationMessages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        temperature: 0.7,
        max_tokens: 500,
      });

      aiResponse = completion.choices[0]?.message?.content || aiResponse;
    } catch (aiError) {
      console.error('[AI Concierge] Error:', aiError);
    }

    // Store AI response
    const aiMessage = await db.guestMessage.create({
      data: {
        hotelId: booking.hotelId,
        bookingId,
        guestId,
        role: 'ai',
        channel: 'chat',
        content: aiResponse,
        aiModel: 'glm-4-flash',
        aiTokens: aiResponse.length,
      },
    });

    return NextResponse.json({ success: true, data: aiMessage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process AI chat.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/ai/chat?bookingId=xxx — Get chat history
export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId');
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId query parameter is required.' },
        { status: 400 }
      );
    }

    const messages = await db.guestMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, role: true, content: true, channel: true,
        isRead: true, readAt: true, aiModel: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { messages, total: messages.length } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch chat history.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
