import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { addDays, format, subDays } from 'date-fns';

/**
 * Inline seed function — creates demo data directly without HTTP fetch.
 * This avoids issues with localhost URLs on deployment platforms like Railway.
 */
export async function seedDatabase() {
  const today = new Date();

  // Check if already seeded
  const count = await db.user.count();
  if (count > 0) return { seeded: false, reason: 'Database already has users' };

  console.log('[seed] Seeding database with demo data...');

  try {
    // Clear all existing data
    await db.$transaction([
      db.loyaltyTransaction.deleteMany(),
      db.review.deleteMany(),
      db.guestMessage.deleteMany(),
      db.nightAudit.deleteMany(),
      db.invoice.deleteMany(),
      db.notification.deleteMany(),
      db.auditLog.deleteMany(),
      db.cancellationPolicy.deleteMany(),
      db.housekeepingTask.deleteMany(),
      db.syncLog.deleteMany(),
      db.payment.deleteMany(),
      db.dynamicRateRule.deleteMany(),
      db.ratePlan.deleteMany(),
      db.availabilityBlock.deleteMany(),
      db.booking.deleteMany(),
      db.coupon.deleteMany(),
      db.guest.deleteMany(),
      db.channel.deleteMany(),
      db.room.deleteMany(),
      db.hotelUser.deleteMany(),
      db.hotel.deleteMany(),
      db.user.deleteMany(),
    ]);

    await db.$transaction(async (tx) => {
      // Create Users
      const adminUser = await tx.user.create({
        data: {
          email: 'admin@easybeds.com',
          passwordHash: await hashPassword('admin123'),
          name: 'Platform Admin',
          emailVerified: true,
          role: 'admin',
        },
      });

      const ownerUser = await tx.user.create({
        data: {
          email: 'owner@easybeds.com',
          passwordHash: await hashPassword('owner123'),
          name: 'John Owera',
          emailVerified: true,
          role: 'user',
        },
      });

      const managerUser = await tx.user.create({
        data: {
          email: 'manager@easybeds.com',
          passwordHash: await hashPassword('manager123'),
          name: 'Grace Mwangi',
          emailVerified: true,
          role: 'user',
        },
      });

      const staffUser = await tx.user.create({
        data: {
          email: 'staff@easybeds.com',
          passwordHash: await hashPassword('staff123'),
          name: 'Peter Kimaro',
          emailVerified: true,
          role: 'user',
        },
      });

      const housekeepingUser = await tx.user.create({
        data: {
          email: 'housekeeping@easybeds.com',
          passwordHash: await hashPassword('house123'),
          name: 'Fatima Hassan',
          emailVerified: true,
          role: 'user',
        },
      });

      // Create Hotel
      const hotel = await tx.hotel.create({
        data: {
          name: 'Paradise Court Hotel',
          slug: 'paradise-court',
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

      // Create HotelUser Memberships
      await tx.hotelUser.create({ data: { hotelId: hotel.id, userId: ownerUser.id, role: 'owner' } });
      await tx.hotelUser.create({ data: { hotelId: hotel.id, userId: managerUser.id, role: 'manager' } });
      await tx.hotelUser.create({ data: { hotelId: hotel.id, userId: staffUser.id, role: 'staff' } });
      await tx.hotelUser.create({ data: { hotelId: hotel.id, userId: housekeepingUser.id, role: 'housekeeping' } });

      // Create Channels
      await Promise.all([
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Walk-in', type: 'walkin', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Website', type: 'website', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Phone', type: 'phone', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Email', type: 'email', syncMethod: 'manual' } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Booking.com', type: 'ota', syncMethod: 'ical', commission: 0.15 } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Airbnb', type: 'ota', syncMethod: 'ical', commission: 0.03 } }),
        tx.channel.create({ data: { hotelId: hotel.id, name: 'Travel Agent', type: 'agent', syncMethod: 'manual', commission: 0.10 } }),
      ]);

      // Create Rooms
      const rooms = await Promise.all([
        tx.room.create({
          data: {
            hotelId: hotel.id, name: 'Ocean View Suite', roomNumber: '101', type: 'suite',
            maxGuests: 4, basePrice: 250000, description: 'Spacious suite with panoramic ocean view.',
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
            maxGuests: 5, basePrice: 200000, description: 'Large family room.',
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
            phone: '+255 756 789 012', nationality: 'Tanzanian', country: 'Tanzania', city: 'Zanzibar',
          },
        }),
      ]);

      // Create Channels for bookings
      const channels = await tx.channel.findMany({ where: { hotelId: hotel.id } });

      // Create Bookings
      const bookingData = [
        { roomIdx: 0, guestIdx: 0, channelIdx: 0, checkInOffset: 0, nights: 3, status: 'checked_in' as const, numGuests: 2 },
        { roomIdx: 1, guestIdx: 1, channelIdx: 4, checkInOffset: 1, nights: 4, status: 'confirmed' as const, numGuests: 2 },
        { roomIdx: 2, guestIdx: 2, channelIdx: 1, checkInOffset: -3, nights: 3, status: 'checked_out' as const, numGuests: 1 },
        { roomIdx: 0, guestIdx: 4, channelIdx: 5, checkInOffset: 5, nights: 7, status: 'confirmed' as const, numGuests: 2 },
        { roomIdx: 3, guestIdx: 3, channelIdx: 2, checkInOffset: 3, nights: 2, status: 'pending' as const, numGuests: 1 },
        { roomIdx: 4, guestIdx: 5, channelIdx: 6, checkInOffset: -1, nights: 5, status: 'cancelled' as const, numGuests: 4 },
        { roomIdx: 5, guestIdx: 1, channelIdx: 0, checkInOffset: -1, nights: 5, status: 'checked_in' as const, numGuests: 2 },
      ];

      for (let i = 0; i < bookingData.length; i++) {
        const bd = bookingData[i];
        const room = rooms[bd.roomIdx];
        const guest = guests[bd.guestIdx];
        const channel = channels[bd.channelIdx];
        const checkIn = addDays(today, bd.checkInOffset);
        const checkOut = addDays(checkIn, bd.nights);
        const totalPrice = bd.nights * room.basePrice;

        const booking = await tx.booking.create({
          data: {
            hotelId: hotel.id, roomId: room.id, guestId: guest.id, channelId: channel.id,
            confirmationCode: `EB-${format(checkIn, 'yyyyMMdd')}-${String(i + 1).padStart(3, '0')}`,
            checkInDate: checkIn, checkOutDate: checkOut, numGuests: bd.numGuests, numNights: bd.nights,
            pricePerNight: room.basePrice, totalPrice, currency: hotel.currency, status: bd.status,
            balanceDue: totalPrice,
            ...(bd.status === 'checked_in' && { checkedInAt: addDays(today, bd.checkInOffset) }),
            ...(bd.status === 'checked_out' && {
              checkedInAt: addDays(today, bd.checkInOffset),
              checkedOutAt: addDays(today, bd.checkInOffset + bd.nights),
            }),
            ...(bd.status === 'cancelled' && { cancelledAt: subDays(today, 1), cancellationReason: 'Guest changed plans.' }),
          },
        });

        if (bd.status !== 'cancelled') {
          await tx.availabilityBlock.create({
            data: {
              hotelId: hotel.id, roomId: room.id, bookingId: booking.id,
              startDate: checkIn, endDate: checkOut, blockType: 'booking', isActive: true,
            },
          });
        }

        if (bd.status === 'checked_in' || bd.status === 'checked_out') {
          await tx.payment.create({
            data: {
              hotelId: hotel.id, bookingId: booking.id, guestId: guest.id,
              amount: totalPrice, currency: hotel.currency,
              method: bd.channelIdx === 0 ? 'cash' : 'mobile_money',
              status: 'completed',
              paidAt: bd.status === 'checked_out' ? addDays(today, bd.checkInOffset + bd.nights) : addDays(today, bd.checkInOffset),
            },
          });
        }
      }
    });

    console.log('[seed] Database seeded successfully!');
    return { seeded: true };
  } catch (error) {
    console.error('[seed] Seed failed:', error);
    return { seeded: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
