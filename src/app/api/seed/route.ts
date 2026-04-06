import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signJwt } from '@/lib/auth';
import { addDays, subDays, format } from 'date-fns';

// POST /api/seed — Creates demo hotel with rooms, bookings, channels, guests
export async function POST() {
  try {
    // Check if demo data already exists
    const existingHotel = await db.hotel.findFirst({
      where: { slug: 'demo-hotel' },
    });

    if (existingHotel) {
      return NextResponse.json(
        { success: false, error: 'Demo data already exists. Delete the demo hotel first to re-seed.' },
        { status: 409 }
      );
    }

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const result = await db.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          email: 'demo@easybeds.com',
          passwordHash: hashPassword('demo123'),
          name: 'Demo Owner',
          emailVerified: true,
        },
      });

      // Create Hotel
      const hotel = await tx.hotel.create({
        data: {
          name: 'Paradise Court Hotel',
          slug: 'demo-hotel',
          description: 'A beautiful boutique hotel in the heart of Dar es Salaam with stunning ocean views.',
          address: '123 Azikiwe Street',
          city: 'Dar es Salaam',
          country: 'Tanzania',
          phone: '+255 22 123 4567',
          email: 'info@paradisecourt.co.tz',
          website: 'https://paradisecourt.co.tz',
          timezone: 'Africa/Dar_es_Salaam',
          checkInTime: '14:00',
          checkOutTime: '10:00',
          currency: 'TZS',
          plan: 'pro',
        },
      });

      // Create HotelUser
      const hotelUser = await tx.hotelUser.create({
        data: {
          hotelId: hotel.id,
          userId: user.id,
          role: 'owner',
        },
      });

      // Create Channels
      const channels = await Promise.all([
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Walk-in', type: 'walkin', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Website', type: 'website', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Phone', type: 'phone', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Email', type: 'email', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Booking.com', type: 'ota', syncMethod: 'ical', commission: 0.15, icalUrl: 'https://interface.booking.com/hotel/export/DEMO' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Airbnb', type: 'ota', syncMethod: 'ical', commission: 0.03, icalUrl: 'https://www.airbnb.com/calendar/ical/DEMO.ics' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Travel Agent', type: 'agent', syncMethod: 'manual', commission: 0.10 } }),
      ]);

      // Create Rooms
      const rooms = await Promise.all([
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Ocean View Suite', roomNumber: '101', type: 'suite',
            maxGuests: 4, basePrice: 250000, description: 'Spacious suite with panoramic ocean view, king bed, and private balcony.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcony', 'room_service']),
            floor: 1, bedType: 'king', sortOrder: 1,
          },
        }),
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Garden Double', roomNumber: '201', type: 'double',
            maxGuests: 2, basePrice: 150000, description: 'Comfortable double room overlooking the garden.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar']),
            floor: 2, bedType: 'queen', sortOrder: 2,
          },
        }),
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Garden Twin', roomNumber: '202', type: 'twin',
            maxGuests: 2, basePrice: 130000, description: 'Twin room with garden view.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv']),
            floor: 2, bedType: 'twin', sortOrder: 3,
          },
        }),
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Standard Single', roomNumber: '301', type: 'single',
            maxGuests: 1, basePrice: 80000, description: 'Compact single room for budget travelers.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv']),
            floor: 3, bedType: 'single', sortOrder: 4,
          },
        }),
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Family Room', roomNumber: '302', type: 'family',
            maxGuests: 5, basePrice: 200000, description: 'Large family room with one double and two single beds.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'crib']),
            floor: 3, bedType: 'king_and_twins', sortOrder: 5,
          },
        }),
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Deluxe Double', roomNumber: '102', type: 'double',
            maxGuests: 2, basePrice: 180000, description: 'Deluxe room with sea view.',
            amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'safe', 'bathrobe']),
            floor: 1, bedType: 'king', sortOrder: 6,
          },
        }),
      ]);

      // Create Guests
      const guests = await Promise.all([
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'James', lastName: 'Mwangi', email: 'james.mwangi@email.com',
            phone: '+254 712 345 678', nationality: 'Kenyan', country: 'Kenya',
            idType: 'passport', idNumber: 'KE1234567', vip: true,
          },
        }),
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com',
            phone: '+1 555 234 5678', nationality: 'American', country: 'USA',
            idType: 'passport', idNumber: 'US9876543',
          },
        }),
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'Amina', lastName: 'Hassan', email: 'amina.h@email.com',
            phone: '+255 789 123 456', nationality: 'Tanzanian', country: 'Tanzania',
            idType: 'national_id', idNumber: 'TZ201900123456',
          },
        }),
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'David', lastName: 'Kimani', email: 'd.kimani@email.com',
            phone: '+254 723 456 789', nationality: 'Kenyan', country: 'Kenya',
          },
        }),
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'Emma', lastName: 'Taylor', email: 'emma.t@email.com',
            phone: '+44 7700 900 123', nationality: 'British', country: 'United Kingdom',
            idType: 'passport', idNumber: 'GB11223344', vip: true,
          },
        }),
        tx.guest.create({
          data: {
            hotelId: hotel.id, firstName: 'Yusuf', lastName: 'Ali', email: 'yusuf.a@email.com',
            phone: '+255 756 789 012', nationality: 'Tanzanian', country: 'Tanzania',
            city: 'Zanzibar',
          },
        }),
      ]);

      // Create sample bookings with various statuses
      const bookingData = [
        // Checked in today
        { roomIdx: 0, guestIdx: 0, channelIdx: 0, checkInOffset: 0, nights: 3, status: 'checked_in' as const, numGuests: 2, ref: 'OTA-44291' },
        // Confirmed upcoming
        { roomIdx: 1, guestIdx: 1, channelIdx: 4, checkInOffset: 1, nights: 4, status: 'confirmed' as const, numGuests: 2, ref: 'BN-8827361' },
        // Checked out yesterday
        { roomIdx: 2, guestIdx: 2, channelIdx: 1, checkInOffset: -3, nights: 3, status: 'checked_out' as const, numGuests: 1, ref: null },
        // Confirmed for next week
        { roomIdx: 0, guestIdx: 4, channelIdx: 5, checkInOffset: 5, nights: 7, status: 'confirmed' as const, numGuests: 2, ref: 'AIRB-192837' },
        // Pending
        { roomIdx: 3, guestIdx: 3, channelIdx: 2, checkInOffset: 3, nights: 2, status: 'pending' as const, numGuests: 1, ref: null },
        // Cancelled
        { roomIdx: 4, guestIdx: 5, channelIdx: 6, checkInOffset: -1, nights: 5, status: 'cancelled' as const, numGuests: 4, ref: 'TA-2024-001' },
        // Checked in
        { roomIdx: 5, guestIdx: 1, channelIdx: 0, checkInOffset: -1, nights: 5, status: 'checked_in' as const, numGuests: 2, ref: null },
      ];

      const bookings = [];
      for (const bd of bookingData) {
        const room = rooms[bd.roomIdx];
        const guest = guests[bd.guestIdx];
        const channel = channels[bd.channelIdx];
        const checkIn = addDays(today, bd.checkInOffset);
        const checkOut = addDays(checkIn, bd.nights);
        const pricePerNight = room.basePrice;
        const totalPrice = bd.nights * pricePerNight;

        const booking = await tx.booking.create({
          data: {
            hotelId: hotel.id,
            roomId: room.id,
            guestId: guest.id,
            channelId: channel.id,
            channelBookingRef: bd.ref,
            confirmationCode: `EB-${format(checkIn, 'yyyyMMdd')}-${String(bookings.length + 1).padStart(3, '0')}`,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numGuests: bd.numGuests,
            numNights: bd.nights,
            pricePerNight,
            totalPrice,
            currency: hotel.currency,
            status: bd.status,
            ...(bd.status === 'checked_in' && { checkedInAt: addDays(today, bd.checkInOffset) }),
            ...(bd.status === 'checked_out' && {
              checkedInAt: addDays(today, bd.checkInOffset),
              checkedOutAt: addDays(today, bd.checkInOffset + bd.nights),
            }),
            ...(bd.status === 'cancelled' && { cancelledAt: subDays(today, 1), cancellationReason: 'Guest changed plans.' }),
          },
        });

        // Create availability block for non-cancelled bookings
        if (bd.status !== 'cancelled') {
          await tx.availabilityBlock.create({
            data: {
              hotelId: hotel.id,
              roomId: room.id,
              bookingId: booking.id,
              startDate: checkIn,
              endDate: checkOut,
              blockType: 'booking',
              isActive: true,
            },
          });
        }

        // Create some payments for checked_in/checked_out bookings
        if (bd.status === 'checked_in' || bd.status === 'checked_out') {
          await tx.payment.create({
            data: {
              hotelId: hotel.id,
              bookingId: booking.id,
              guestId: guest.id,
              amount: totalPrice,
              currency: hotel.currency,
              method: bd.channelIdx === 0 ? 'cash' : 'mobile_money',
              status: 'completed',
              paidAt: bd.status === 'checked_out' ? addDays(today, bd.checkInOffset + bd.nights) : addDays(today, bd.checkInOffset),
            },
          });
        }

        bookings.push(booking);
      }

      // Create Cancellation Policies
      await Promise.all([
        tx.cancellationPolicy.create({
          data: {
            hotelId: hotel.id, name: 'Flexible', isDefault: true,
            rules: JSON.stringify([{ hoursBefore: 48, chargePercent: 0 }, { hoursBefore: 0, chargePercent: 100 }]),
          },
        }),
        tx.cancellationPolicy.create({
          data: {
            hotelId: hotel.id, name: 'Moderate',
            rules: JSON.stringify([{ hoursBefore: 168, chargePercent: 0 }, { hoursBefore: 48, chargePercent: 50 }, { hoursBefore: 0, chargePercent: 100 }]),
          },
        }),
        tx.cancellationPolicy.create({
          data: {
            hotelId: hotel.id, name: 'Strict - Non Refundable',
            rules: JSON.stringify([{ hoursBefore: 999999, chargePercent: 100 }]),
          },
        }),
      ]);

      // Create Dynamic Rate Rules
      await Promise.all([
        tx.dynamicRateRule.create({
          data: {
            hotelId: hotel.id, name: 'High Season Peak', ruleType: 'seasonal',
            adjustmentType: 'percentage', adjustmentValue: 25,
            validFrom: new Date(today.getFullYear(), 5, 1), validTo: new Date(today.getFullYear(), 8, 31),
            priority: 10,
          },
        }),
        tx.dynamicRateRule.create({
          data: {
            hotelId: hotel.id, name: 'Weekend Surcharge', ruleType: 'day_of_week',
            adjustmentType: 'percentage', adjustmentValue: 10,
            daysOfWeek: JSON.stringify([5, 6]), // Fri, Sat
            priority: 5,
          },
        }),
        tx.dynamicRateRule.create({
          data: {
            hotelId: hotel.id, name: 'High Occupancy Premium', ruleType: 'occupancy_based',
            adjustmentType: 'percentage', adjustmentValue: 20,
            minOccupancy: 80, priority: 8,
          },
        }),
      ]);

      // Create Coupons
      await Promise.all([
        tx.coupon.create({
          data: {
            hotelId: hotel.id, code: 'WELCOME10', type: 'percentage', value: 10,
            maxUses: 100, validFrom: today, validTo: addDays(today, 90),
          },
        }),
        tx.coupon.create({
          data: {
            hotelId: hotel.id, code: 'LONGSTAY', type: 'percentage', value: 15,
            minStay: 5, validFrom: today, validTo: addDays(today, 180),
          },
        }),
      ]);

      // Create Housekeeping Tasks
      await Promise.all([
        tx.housekeepingTask.create({
          data: {
            hotelId: hotel.id, roomId: rooms[0].id, taskType: 'clean', priority: 'high',
            status: 'pending', title: 'Checkout clean - Room 101', dueDate: today, dueTime: '12:00',
          },
        }),
        tx.housekeepingTask.create({
          data: {
            hotelId: hotel.id, roomId: rooms[1].id, taskType: 'turndown', priority: 'low',
            status: 'pending', title: 'Evening turndown - Room 201', dueDate: today, dueTime: '17:00',
          },
        }),
        tx.housekeepingTask.create({
          data: {
            hotelId: hotel.id, roomId: rooms[2].id, taskType: 'deep_clean', priority: 'medium',
            status: 'in_progress', title: 'Deep clean - Room 202', dueDate: today, assignedTo: user.id,
          },
        }),
      ]);

      // Create a maintenance block
      await tx.availabilityBlock.create({
        data: {
          hotelId: hotel.id,
          roomId: rooms[3].id,
          bookingId: null,
          startDate: addDays(today, 2),
          endDate: addDays(today, 4),
          blockType: 'maintenance',
          reason: 'AC repair and room repainting',
          isActive: true,
        },
      });

      // Create sample reviews
      await tx.review.create({
        data: {
          hotelId: hotel.id, bookingId: bookings[2].id, guestId: guests[2].id,
          overallRating: 5, cleanliness: 5, service: 5, location: 4, value: 5,
          comment: 'Excellent stay! The staff was incredibly friendly and the room was spotless. Will definitely return.',
          respondedAt: subDays(today, 2),
          response: 'Thank you Amina! We are thrilled you enjoyed your stay. Looking forward to welcoming you back!',
        },
      });
      await tx.review.create({
        data: {
          hotelId: hotel.id, bookingId: bookings[0].id, guestId: guests[0].id,
          overallRating: 4, cleanliness: 4, service: 5, location: 4, value: 3,
          comment: 'Great hotel, wonderful service. The ocean view from the suite is breathtaking. Slightly pricey but worth it.',
        },
      });

      // Create a sample invoice
      const invNum = `INV-${format(today, 'yyyy')}-${String(1).padStart(4, '0')}`;
      await tx.invoice.create({
        data: {
          hotelId: hotel.id, bookingId: bookings[2].id, guestId: guests[2].id,
          invoiceNumber: invNum, status: 'paid',
          subtotal: 130000 * 3, taxRate: 18, taxAmount: 130000 * 3 * 0.18,
          totalAmount: 130000 * 3 * 1.18, currency: hotel.currency, paidAt: addDays(today, -1),
        },
      });

      // Create sync log sample
      await tx.syncLog.create({
        data: {
          hotelId: hotel.id,
          channelId: channels[4].id,
          direction: 'import',
          status: 'success',
          eventsFound: 3,
          eventsCreated: 1,
          eventsUpdated: 2,
          eventsDeleted: 0,
        },
      });

      return { user, hotel, hotelUser, channels, rooms, guests, bookings };
    });

    const token = signJwt({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      hotelId: result.hotel.id,
      role: 'owner',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Demo data created successfully!',
          credentials: { email: 'demo@easybeds.com', password: 'demo123' },
          token,
          hotel: { id: result.hotel.id, name: result.hotel.name, slug: result.hotel.slug },
          stats: {
            rooms: result.rooms.length,
            guests: result.guests.length,
            bookings: result.bookings.length,
            channels: result.channels.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create demo data.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
