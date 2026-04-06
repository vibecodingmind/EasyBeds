// Mock data for EasyBeds Hotel Booking Platform
import { addDays, subDays, format } from 'date-fns'

const today = new Date()

export interface MockHotel {
  id: string
  name: string
  description: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  checkInTime: string
  checkOutTime: string
  currency: string
  timezone: string
}

export interface MockRoom {
  id: string
  hotelId: string
  name: string
  number: string
  type: 'standard' | 'deluxe' | 'suite' | 'family' | 'single'
  basePrice: number
  maxGuests: number
  amenities: string[]
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_service'
  floor: number
  description: string
}

export interface MockGuest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  idNumber: string
  vip: boolean
  totalStays: number
  totalSpent: number
  createdAt: string
  notes: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export interface MockBooking {
  id: string
  confirmationCode: string
  hotelId: string
  roomId: string
  guestId: string
  channel: string
  status: BookingStatus
  checkIn: string
  checkOut: string
  adults: number
  children: number
  totalPrice: number
  currency: string
  specialRequests: string
  createdAt: string
  updatedAt: string
}

export interface MockChannel {
  id: string
  hotelId: string
  name: string
  type: 'ota' | 'direct' | 'walk_in' | 'phone' | 'website'
  syncMethod: 'ical' | 'api' | 'manual' | 'none'
  isActive: boolean
  lastSync: string
  icalUrl: string
  commission: number
  color: string
}

// --- Data ---

export const mockHotel: MockHotel = {
  id: 'hotel-1',
  name: 'Paradise Court Lodge',
  description: 'A charming boutique hotel nestled in the heart of the city, offering warm hospitality and modern comforts.',
  address: '42 Garden Boulevard',
  city: 'Burlingame',
  country: 'United States',
  phone: '+1 (650) 555-0180',
  email: 'info@paradisecourtlodge.com',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  currency: 'USD',
  timezone: 'America/Los_Angeles',
}

export const mockRooms: MockRoom[] = [
  {
    id: 'room-1',
    hotelId: 'hotel-1',
    name: 'Standard Double',
    number: '101',
    type: 'standard',
    basePrice: 120,
    maxGuests: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    status: 'available',
    floor: 1,
    description: 'Comfortable double room with city view',
  },
  {
    id: 'room-2',
    hotelId: 'hotel-1',
    name: 'Standard Twin',
    number: '102',
    type: 'standard',
    basePrice: 110,
    maxGuests: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning'],
    status: 'occupied',
    floor: 1,
    description: 'Two single beds with garden view',
  },
  {
    id: 'room-3',
    hotelId: 'hotel-1',
    name: 'Deluxe King',
    number: '201',
    type: 'deluxe',
    basePrice: 180,
    maxGuests: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Bathtub', 'Balcony'],
    status: 'available',
    floor: 2,
    description: 'Spacious room with king bed and balcony',
  },
  {
    id: 'room-4',
    hotelId: 'hotel-1',
    name: 'Deluxe Queen',
    number: '202',
    type: 'deluxe',
    basePrice: 165,
    maxGuests: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Bathtub'],
    status: 'occupied',
    floor: 2,
    description: 'Elegant queen room with premium amenities',
  },
  {
    id: 'room-5',
    hotelId: 'hotel-1',
    name: 'Family Suite',
    number: '301',
    type: 'family',
    basePrice: 250,
    maxGuests: 4,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Kitchen', 'Living Area'],
    status: 'available',
    floor: 3,
    description: 'Perfect for families with separate living area',
  },
  {
    id: 'room-6',
    hotelId: 'hotel-1',
    name: 'Royal Suite',
    number: '302',
    type: 'suite',
    basePrice: 350,
    maxGuests: 3,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Jacuzzi', 'Balcony', 'Living Area', 'Butler Service'],
    status: 'maintenance',
    floor: 3,
    description: 'Luxury suite with panoramic views and premium service',
  },
]

export const mockGuests: MockGuest[] = [
  {
    id: 'guest-1',
    firstName: 'James',
    lastName: 'Anderson',
    email: 'j.anderson@email.com',
    phone: '+1 (415) 555-0101',
    nationality: 'American',
    idNumber: 'P1234567',
    vip: true,
    totalStays: 8,
    totalSpent: 4560,
    createdAt: '2024-01-15',
    notes: 'Prefers high floor rooms',
  },
  {
    id: 'guest-2',
    firstName: 'Sophie',
    lastName: 'Müller',
    email: 'sophie.muller@email.de',
    phone: '+49 170 555-0202',
    nationality: 'German',
    idNumber: 'DE892104',
    vip: false,
    totalStays: 3,
    totalSpent: 1250,
    createdAt: '2024-03-22',
    notes: 'Allergic to feather pillows',
  },
  {
    id: 'guest-3',
    firstName: 'Takeshi',
    lastName: 'Yamamoto',
    email: 't.yamamoto@email.jp',
    phone: '+81 90 5555-0303',
    nationality: 'Japanese',
    idNumber: 'JP4567890',
    vip: true,
    totalStays: 5,
    totalSpent: 3200,
    createdAt: '2023-11-10',
    notes: 'Business traveler, needs desk space',
  },
  {
    id: 'guest-4',
    firstName: 'Isabella',
    lastName: 'Rossi',
    email: 'i.rossi@email.it',
    phone: '+39 333 555-0404',
    nationality: 'Italian',
    idNumber: 'IT7890123',
    vip: false,
    totalStays: 2,
    totalSpent: 890,
    createdAt: '2024-05-18',
    notes: '',
  },
  {
    id: 'guest-5',
    firstName: 'Chen',
    lastName: 'Wei',
    email: 'chen.wei@email.cn',
    phone: '+86 138 5555-0505',
    nationality: 'Chinese',
    idNumber: 'CN123456789',
    vip: false,
    totalStays: 1,
    totalSpent: 540,
    createdAt: '2024-06-01',
    notes: 'First time visitor',
  },
  {
    id: 'guest-6',
    firstName: 'Emma',
    lastName: 'Williams',
    email: 'emma.w@email.com',
    phone: '+1 (310) 555-0606',
    nationality: 'American',
    idNumber: 'P9876543',
    vip: true,
    totalStays: 12,
    totalSpent: 7800,
    createdAt: '2023-06-20',
    notes: 'Loyalty member - Gold tier. Late checkout preferred.',
  },
  {
    id: 'guest-7',
    firstName: 'Lucas',
    lastName: 'Dubois',
    email: 'l.dubois@email.fr',
    phone: '+33 6 55 55 07 07',
    nationality: 'French',
    idNumber: 'FR456789012',
    vip: false,
    totalStays: 1,
    totalSpent: 360,
    createdAt: '2024-07-15',
    notes: '',
  },
  {
    id: 'guest-8',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'm.garcia@email.es',
    phone: '+34 655 555-0808',
    nationality: 'Spanish',
    idNumber: 'ES789012345',
    vip: false,
    totalStays: 4,
    totalSpent: 2100,
    createdAt: '2024-02-10',
    notes: 'Travels with small dog',
  },
  {
    id: 'guest-9',
    firstName: 'Oliver',
    lastName: 'Smith',
    email: 'o.smith@email.co.uk',
    phone: '+44 7700 555-0909',
    nationality: 'British',
    idNumber: 'GB123456789',
    vip: true,
    totalStays: 6,
    totalSpent: 3900,
    createdAt: '2023-09-05',
    notes: 'Executive traveler, requires quiet room',
  },
  {
    id: 'guest-10',
    firstName: 'Ananya',
    lastName: 'Sharma',
    email: 'ananya.s@email.in',
    phone: '+91 98765 55510',
    nationality: 'Indian',
    idNumber: 'IN987654321',
    vip: false,
    totalStays: 2,
    totalSpent: 720,
    createdAt: '2024-04-25',
    notes: 'Vegetarian meals required',
  },
]

export const mockBookings: MockBooking[] = [
  // Checked in guests (today)
  {
    id: 'booking-1',
    confirmationCode: 'EB-20250115-001',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    guestId: 'guest-1',
    channel: 'channel-1',
    status: 'checked_in',
    checkIn: format(subDays(today, 2), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 3), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 720,
    currency: 'USD',
    specialRequests: 'Late checkout requested',
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  {
    id: 'booking-2',
    confirmationCode: 'EB-20250115-002',
    hotelId: 'hotel-1',
    roomId: 'room-2',
    guestId: 'guest-3',
    channel: 'channel-2',
    status: 'checked_in',
    checkIn: format(subDays(today, 1), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 2), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 540,
    currency: 'USD',
    specialRequests: 'Business center access needed',
    createdAt: format(subDays(today, 7), 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  {
    id: 'booking-3',
    confirmationCode: 'EB-20250115-003',
    hotelId: 'hotel-1',
    roomId: 'room-4',
    guestId: 'guest-6',
    channel: 'channel-3',
    status: 'checked_in',
    checkIn: format(subDays(today, 3), 'yyyy-MM-dd'),
    checkOut: format(today, 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 495,
    currency: 'USD',
    specialRequests: 'Extra pillows please',
    createdAt: format(subDays(today, 14), 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  // Today check-outs
  {
    id: 'booking-4',
    confirmationCode: 'EB-20250113-004',
    hotelId: 'hotel-1',
    roomId: 'room-3',
    guestId: 'guest-9',
    channel: 'channel-1',
    status: 'checked_in',
    checkIn: format(subDays(today, 4), 'yyyy-MM-dd'),
    checkOut: format(today, 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 720,
    currency: 'USD',
    specialRequests: 'Airport shuttle at 9am',
    createdAt: format(subDays(today, 20), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 1), 'yyyy-MM-dd'),
  },
  // Today check-ins
  {
    id: 'booking-5',
    confirmationCode: 'EB-20250117-005',
    hotelId: 'hotel-1',
    roomId: 'room-3',
    guestId: 'guest-2',
    channel: 'channel-2',
    status: 'confirmed',
    checkIn: format(today, 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 4), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 720,
    currency: 'USD',
    specialRequests: 'Hypoallergenic bedding',
    createdAt: format(subDays(today, 5), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 2), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-6',
    confirmationCode: 'EB-20250117-006',
    hotelId: 'hotel-1',
    roomId: 'room-5',
    guestId: 'guest-8',
    channel: 'channel-3',
    status: 'confirmed',
    checkIn: format(today, 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 5), 'yyyy-MM-dd'),
    adults: 2,
    children: 1,
    totalPrice: 1250,
    currency: 'USD',
    specialRequests: 'Traveling with small dog',
    createdAt: format(subDays(today, 3), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 1), 'yyyy-MM-dd'),
  },
  // Future bookings
  {
    id: 'booking-7',
    confirmationCode: 'EB-20250119-007',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    guestId: 'guest-4',
    channel: 'channel-4',
    status: 'confirmed',
    checkIn: format(addDays(today, 2), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 6), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 480,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(subDays(today, 2), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 2), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-8',
    confirmationCode: 'EB-20250120-008',
    hotelId: 'hotel-1',
    roomId: 'room-5',
    guestId: 'guest-10',
    channel: 'channel-3',
    status: 'confirmed',
    checkIn: format(addDays(today, 3), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 7), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 1000,
    currency: 'USD',
    specialRequests: 'Vegetarian meals',
    createdAt: format(subDays(today, 1), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 1), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-9',
    confirmationCode: 'EB-20250122-009',
    hotelId: 'hotel-1',
    roomId: 'room-3',
    guestId: 'guest-7',
    channel: 'channel-1',
    status: 'pending',
    checkIn: format(addDays(today, 5), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 8), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 540,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(today, 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  // Past bookings
  {
    id: 'booking-10',
    confirmationCode: 'EB-20250101-010',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    guestId: 'guest-6',
    channel: 'channel-3',
    status: 'checked_out',
    checkIn: format(subDays(today, 20), 'yyyy-MM-dd'),
    checkOut: format(subDays(today, 15), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 600,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(subDays(today, 30), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 15), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-11',
    confirmationCode: 'EB-20250105-011',
    hotelId: 'hotel-1',
    roomId: 'room-4',
    guestId: 'guest-5',
    channel: 'channel-2',
    status: 'checked_out',
    checkIn: format(subDays(today, 12), 'yyyy-MM-dd'),
    checkOut: format(subDays(today, 8), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 660,
    currency: 'USD',
    specialRequests: 'Taxi booking needed',
    createdAt: format(subDays(today, 18), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 8), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-12',
    confirmationCode: 'EB-20250108-012',
    hotelId: 'hotel-1',
    roomId: 'room-2',
    guestId: 'guest-1',
    channel: 'channel-1',
    status: 'checked_out',
    checkIn: format(subDays(today, 10), 'yyyy-MM-dd'),
    checkOut: format(subDays(today, 5), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 550,
    currency: 'USD',
    specialRequests: 'VIP welcome package',
    createdAt: format(subDays(today, 16), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 5), 'yyyy-MM-dd'),
  },
  // Cancelled bookings
  {
    id: 'booking-13',
    confirmationCode: 'EB-20250112-013',
    hotelId: 'hotel-1',
    roomId: 'room-3',
    guestId: 'guest-4',
    channel: 'channel-4',
    status: 'cancelled',
    checkIn: format(subDays(today, 3), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 2), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 900,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 4), 'yyyy-MM-dd'),
  },
  // More upcoming
  {
    id: 'booking-14',
    confirmationCode: 'EB-20250125-014',
    hotelId: 'hotel-1',
    roomId: 'room-2',
    guestId: 'guest-9',
    channel: 'channel-1',
    status: 'confirmed',
    checkIn: format(addDays(today, 8), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 12), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 440,
    currency: 'USD',
    specialRequests: 'Quiet room',
    createdAt: format(subDays(today, 1), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 1), 'yyyy-MM-dd'),
  },
  {
    id: 'booking-15',
    confirmationCode: 'EB-20250128-015',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    guestId: 'guest-3',
    channel: 'channel-2',
    status: 'confirmed',
    checkIn: format(addDays(today, 10), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 14), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 480,
    currency: 'USD',
    specialRequests: 'Desk and good WiFi',
    createdAt: format(today, 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  {
    id: 'booking-16',
    confirmationCode: 'EB-20250201-016',
    hotelId: 'hotel-1',
    roomId: 'room-4',
    guestId: 'guest-2',
    channel: 'channel-1',
    status: 'pending',
    checkIn: format(addDays(today, 15), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 19), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 660,
    currency: 'USD',
    specialRequests: 'Anniversary celebration',
    createdAt: format(today, 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  {
    id: 'booking-17',
    confirmationCode: 'EB-20250115-017',
    hotelId: 'hotel-1',
    roomId: 'room-2',
    guestId: 'guest-5',
    channel: 'channel-4',
    status: 'pending',
    checkIn: format(addDays(today, 1), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 4), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    totalPrice: 330,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(today, 'yyyy-MM-dd'),
    updatedAt: format(today, 'yyyy-MM-dd'),
  },
  {
    id: 'booking-18',
    confirmationCode: 'EB-20250116-018',
    hotelId: 'hotel-1',
    roomId: 'room-3',
    guestId: 'guest-7',
    channel: 'channel-3',
    status: 'pending',
    checkIn: format(addDays(today, 4), 'yyyy-MM-dd'),
    checkOut: format(addDays(today, 6), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    totalPrice: 360,
    currency: 'USD',
    specialRequests: '',
    createdAt: format(subDays(today, 1), 'yyyy-MM-dd'),
    updatedAt: format(subDays(today, 1), 'yyyy-MM-dd'),
  },
]

export const mockChannels: MockChannel[] = [
  {
    id: 'channel-1',
    hotelId: 'hotel-1',
    name: 'Booking.com',
    type: 'ota',
    syncMethod: 'ical',
    isActive: true,
    lastSync: format(subDays(today, 0), "yyyy-MM-dd'T'HH:mm:ss"),
    icalUrl: 'https://distribution-xml.booking.com/ical/hotel/123456',
    commission: 15,
    color: '#003580',
  },
  {
    id: 'channel-2',
    hotelId: 'hotel-1',
    name: 'Airbnb',
    type: 'ota',
    syncMethod: 'ical',
    isActive: true,
    lastSync: format(subDays(today, 0), "yyyy-MM-dd'T'HH:mm:ss"),
    icalUrl: 'https://www.airbnb.com/calendar/ical/789012',
    commission: 3,
    color: '#FF5A5F',
  },
  {
    id: 'channel-3',
    hotelId: 'hotel-1',
    name: 'Direct Website',
    type: 'website',
    syncMethod: 'api',
    isActive: true,
    lastSync: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
    icalUrl: '',
    commission: 0,
    color: '#10B981',
  },
  {
    id: 'channel-4',
    hotelId: 'hotel-1',
    name: 'Walk-in',
    type: 'walk_in',
    syncMethod: 'manual',
    isActive: true,
    lastSync: '',
    icalUrl: '',
    commission: 0,
    color: '#8B5CF6',
  },
  {
    id: 'channel-5',
    hotelId: 'hotel-1',
    name: 'Phone',
    type: 'phone',
    syncMethod: 'manual',
    isActive: true,
    lastSync: '',
    icalUrl: '',
    commission: 0,
    color: '#F59E0B',
  },
]

// Helper functions
export function getGuestById(id: string): MockGuest | undefined {
  return mockGuests.find((g) => g.id === id)
}

export function getRoomById(id: string): MockRoom | undefined {
  return mockRooms.find((r) => r.id === id)
}

export function getChannelById(id: string): MockChannel | undefined {
  return mockChannels.find((c) => c.id === id)
}

export function getBookingsForRoom(roomId: string): MockBooking[] {
  return mockBookings.filter((b) => b.roomId === roomId)
}

export function getBookingsForGuest(guestId: string): MockBooking[] {
  return mockBookings.filter((b) => b.guestId === guestId)
}

export function getTodayCheckIns(): MockBooking[] {
  const todayStr = format(today, 'yyyy-MM-dd')
  return mockBookings.filter(
    (b) => b.checkIn === todayStr && b.status !== 'cancelled'
  )
}

export function getTodayCheckOuts(): MockBooking[] {
  const todayStr = format(today, 'yyyy-MM-dd')
  return mockBookings.filter(
    (b) => b.checkOut === todayStr && b.status !== 'cancelled'
  )
}

export function getUpcomingArrivals(days: number = 3): MockBooking[] {
  const todayStr = format(today, 'yyyy-MM-dd')
  const endDate = format(addDays(today, days), 'yyyy-MM-dd')
  return mockBookings.filter(
    (b) =>
      b.checkIn > todayStr &&
      b.checkIn <= endDate &&
      b.status !== 'cancelled'
  )
}

export function getOccupancyRate(): number {
  const totalRooms = mockRooms.length
  const occupiedRooms = mockRooms.filter((r) => r.status === 'occupied').length
  return Math.round((occupiedRooms / totalRooms) * 100)
}

export function getMonthlyRevenue(): number {
  return mockBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPrice, 0)
}

export function getActiveBookings(): MockBooking[] {
  return mockBookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in')
}

// Monthly report data (last 6 months)
export function getMonthlyReportData() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      month: format(date, 'MMM yyyy'),
      occupancy: Math.floor(Math.random() * 30) + 55,
      revenue: Math.floor(Math.random() * 15000) + 20000,
      bookings: Math.floor(Math.random() * 30) + 40,
    })
  }
  return months
}

// Revenue by channel data
export function getRevenueByChannelData() {
  return [
    { channel: 'Booking.com', revenue: 12400, color: '#003580' },
    { channel: 'Airbnb', revenue: 8200, color: '#FF5A5F' },
    { channel: 'Direct Website', revenue: 15600, color: '#10B981' },
    { channel: 'Walk-in', revenue: 4300, color: '#8B5CF6' },
    { channel: 'Phone', revenue: 2100, color: '#F59E0B' },
  ]
}
