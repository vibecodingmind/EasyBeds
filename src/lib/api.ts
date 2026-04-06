// =============================================================================
// EasyBeds API Client
// Complete typed API client wrapping all fetch calls to the backend routes.
// Every function returns a discriminated union: { success: true, data: T } | { success: false, error: string }
// =============================================================================

// ─── Response Types ───────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Entity Types (matching Prisma / API response shapes) ────────────────────

export interface ApiRoom {
  id: string
  hotelId: string
  name: string
  roomNumber: string
  type: string
  maxGuests: number
  basePrice: number
  description: string | null
  amenities: string | null // JSON string
  floor: number | null
  bedType: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { bookings: number; availabilityBlocks: number }
}

export interface ApiGuest {
  id: string
  hotelId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  idNumber: string | null
  idType: string | null
  nationality: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  vip: boolean
  createdAt: string
  updatedAt: string
  _count?: { bookings: number }
}

export interface ApiPayment {
  id: string
  hotelId: string
  bookingId: string
  amount: number
  currency: string
  method: string
  status: string
  transactionRef: string | null
  notes: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiAvailabilityBlock {
  id: string
  hotelId: string
  roomId: string
  bookingId: string | null
  startDate: string
  endDate: string
  blockType: string
  reason: string | null
  isActive: boolean
  createdAt: string
  room?: { id: string; name: string; roomNumber: string }
  booking?: {
    id: string
    confirmationCode: string
    status: string
    checkInDate: string
    checkOutDate: string
    guest?: { firstName: string; lastName: string }
  }
}

export interface ApiBooking {
  id: string
  hotelId: string
  roomId: string
  guestId: string
  channelId: string
  channelBookingRef: string | null
  confirmationCode: string
  checkInDate: string
  checkOutDate: string
  numGuests: number
  numNights: number
  pricePerNight: number
  totalPrice: number
  currency: string
  status: string
  specialRequests: string | null
  internalNotes: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  checkedInAt: string | null
  checkedOutAt: string | null
  createdAt: string
  updatedAt: string
  room?: { id: string; name: string; roomNumber: string; type: string }
  guest?: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null }
  channel?: { id: string; name: string; type: string }
  payments?: ApiPayment[]
  availabilityBlock?: ApiAvailabilityBlock
}

export interface ApiChannel {
  id: string
  hotelId: string
  name: string
  type: string
  syncMethod: string
  icalUrl: string | null
  icalExportSlug: string | null
  apiKey: string | null
  commission: number | null
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string | null
  syncError: string | null
  createdAt: string
  updatedAt: string
  _count?: { bookings: number; syncLogs: number; ratePlans: number }
}

export interface ApiHotel {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  timezone: string
  checkInTime: string
  checkOutTime: string
  currency: string
  plan: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    rooms: number
    bookings: number
    guests: number
    channels: number
    users: number
  }
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  today: {
    bookingsCreated: number
    checkIns: number
    checkOuts: number
    currentGuests: number
    occupancyRate: number
    totalRooms: number
  }
  thisMonth: {
    totalBookings: number
    totalRevenue: number
  }
  recentBookings: ApiBooking[]
  upcomingCheckIns: ApiBooking[]
}

// ─── Availability Calendar ───────────────────────────────────────────────────

export interface AvailabilityRoomSummary {
  id: string
  name: string
  roomNumber: string
  type: string
  basePrice: number
}

export interface AvailabilityData {
  year: number
  month: number
  monthStart: string
  monthEnd: string
  rooms: AvailabilityRoomSummary[]
  blocks: ApiAvailabilityBlock[]
  blocksByRoom: Record<string, ApiAvailabilityBlock[]>
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface OccupancyReportData {
  period: { from: string; to: string }
  summary: {
    totalRooms: number
    totalDays: number
    totalRoomNights: number
    occupiedRoomNights: number
    occupancyRate: number
    totalBookings: number
    activeBookings: number
    totalRevenue: number
    avgDailyRate: number
    avgStayLength: number
  }
  bookingsByStatus: Record<string, number>
  bookings: ApiBooking[]
}

export interface RevenueChannelBreakdown {
  channelId: string
  channelName: string
  channelType: string
  totalRevenue: number
  totalBookings: number
  totalNights: number
  commission: number
  netRevenue: number
}

export interface RevenueRoomTypeBreakdown {
  roomType: string
  totalRevenue: number
  totalBookings: number
  totalNights: number
}

export interface DailyRevenueItem {
  date: string
  revenue: number
}

export interface PaymentMethodBreakdown {
  method: string
  total: number
  count: number
}

export interface RevenueReportData {
  period: { from: string; to: string }
  summary: {
    totalRevenue: number
    totalBookings: number
    totalNights: number
    totalCommission: number
    netRevenue: number
    totalCollected: number
    avgBookingValue: number
  }
  revenueByChannel: RevenueChannelBreakdown[]
  revenueByRoomType: RevenueRoomTypeBreakdown[]
  dailyRevenue: DailyRevenueItem[]
  paymentsByMethod: PaymentMethodBreakdown[]
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
  hotel: {
    id: string
    name: string
    slug: string
  }
  role: string
}

export interface RegisterResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
  }
  hotel: {
    id: string
    name: string
    slug: string
  }
}

// ─── Input Types for Create/Update operations ────────────────────────────────

export interface CreateBookingInput {
  roomId: string
  guestId?: string
  channelId?: string
  checkIn: string
  checkOut: string
  numGuests?: number
  specialRequests?: string
  internalNotes?: string
  channelBookingRef?: string
  guestFirstName?: string
  guestLastName?: string
  guestEmail?: string
  guestPhone?: string
}

export interface CreateRoomInput {
  name: string
  roomNumber: string
  basePrice: number
  type?: string
  maxGuests?: number
  description?: string
  amenities?: string[]
  floor?: number
  bedType?: string
  imageUrl?: string
  sortOrder?: number
}

export interface CreateGuestInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  idNumber?: string
  idType?: string
  nationality?: string
  address?: string
  city?: string
  country?: string
  notes?: string
  vip?: boolean
}

export interface CreateChannelInput {
  name: string
  type?: string
  syncMethod?: string
  icalUrl?: string
  commission?: number
  isActive?: boolean
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  hotelName: string
  hotelSlug: string
  phone?: string
  country?: string
  city?: string
  address?: string
}

// =============================================================================
// API Client Class
// =============================================================================

class ApiClient {
  private baseUrl = '/api'

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('easybeds-token')
      if (stored) return stored
      // Fallback: try to read from zustand persisted state
      const state = JSON.parse(localStorage.getItem('easybeds-store') || '{}')
      return state?.state?.token || null
    } catch {
      return null
    }
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`
      const token = this.getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(url, {
        ...options,
        headers,
      })

      const json = await res.json()

      if (json.success === true) {
        return { success: true, data: json.data as T }
      }
      return { success: false, error: json.error || 'Unknown error' }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network error. Please try again.'
      return { success: false, error: message }
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(data: RegisterInput): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ─── Hotel ─────────────────────────────────────────────────────────────────

  async getHotel(hotelId: string): Promise<ApiResponse<ApiHotel>> {
    return this.request<ApiHotel>(
      `/hotel?hotelId=${encodeURIComponent(hotelId)}`,
    )
  }

  async updateHotel(
    hotelId: string,
    data: Partial<Omit<ApiHotel, 'id' | 'createdAt' | 'updatedAt' | '_count'>>,
  ): Promise<ApiResponse<ApiHotel>> {
    return this.request<ApiHotel>(
      `/hotel?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    )
  }

  // ─── Rooms ─────────────────────────────────────────────────────────────────

  async getRooms(hotelId: string): Promise<ApiResponse<ApiRoom[]>> {
    return this.request<ApiRoom[]>(
      `/rooms?hotelId=${encodeURIComponent(hotelId)}`,
    )
  }

  async createRoom(
    hotelId: string,
    data: CreateRoomInput,
  ): Promise<ApiResponse<ApiRoom>> {
    return this.request<ApiRoom>(
      `/rooms?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
  }

  async updateRoom(
    roomId: string,
    hotelId: string,
    data: Partial<CreateRoomInput>,
  ): Promise<ApiResponse<ApiRoom>> {
    return this.request<ApiRoom>(
      `/rooms/${encodeURIComponent(roomId)}?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    )
  }

  async deleteRoom(
    roomId: string,
    hotelId: string,
  ): Promise<ApiResponse<ApiRoom>> {
    return this.request<ApiRoom>(
      `/rooms/${encodeURIComponent(roomId)}?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'DELETE',
      },
    )
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────

  async getBookings(
    hotelId: string,
    params?: {
      status?: string
      roomId?: string
      guestId?: string
      from?: string
      to?: string
      page?: number
      limit?: number
    },
  ): Promise<ApiResponse<{ bookings: ApiBooking[]; pagination: PaginationInfo }>> {
    const sp = new URLSearchParams({ hotelId })
    if (params?.status) sp.set('status', params.status)
    if (params?.roomId) sp.set('roomId', params.roomId)
    if (params?.guestId) sp.set('guestId', params.guestId)
    if (params?.from) sp.set('from', params.from)
    if (params?.to) sp.set('to', params.to)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))
    return this.request(`/bookings?${sp.toString()}`)
  }

  async createBooking(
    hotelId: string,
    data: CreateBookingInput,
  ): Promise<ApiResponse<ApiBooking>> {
    return this.request<ApiBooking>(
      `/bookings?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
  }

  async getBooking(
    bookingId: string,
    hotelId: string,
  ): Promise<ApiResponse<ApiBooking>> {
    return this.request<ApiBooking>(
      `/bookings/${encodeURIComponent(bookingId)}?hotelId=${encodeURIComponent(hotelId)}`,
    )
  }

  async updateBookingStatus(
    bookingId: string,
    hotelId: string,
    status: string,
  ): Promise<ApiResponse<ApiBooking>> {
    return this.request<ApiBooking>(
      `/bookings/${encodeURIComponent(bookingId)}?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    )
  }

  async cancelBooking(
    bookingId: string,
    hotelId: string,
  ): Promise<ApiResponse<ApiBooking>> {
    return this.request<ApiBooking>(
      `/bookings/${encodeURIComponent(bookingId)}?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'DELETE',
      },
    )
  }

  async checkAvailability(
    hotelId: string,
    roomId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<
    ApiResponse<{
      roomId: string
      hotelId: string
      checkIn: string
      checkOut: string
      isAvailable: boolean
      conflictingBlocks: ApiAvailabilityBlock[]
    }>
  > {
    const sp = new URLSearchParams({ hotelId, roomId, checkIn, checkOut })
    return this.request(`/bookings/check-availability?${sp.toString()}`)
  }

  // ─── Guests ────────────────────────────────────────────────────────────────

  async getGuests(
    hotelId: string,
    params?: {
      search?: string
      page?: number
      limit?: number
    },
  ): Promise<ApiResponse<{ guests: ApiGuest[]; pagination: PaginationInfo }>> {
    const sp = new URLSearchParams({ hotelId })
    if (params?.search) sp.set('search', params.search)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))
    return this.request(`/guests?${sp.toString()}`)
  }

  async createGuest(
    hotelId: string,
    data: CreateGuestInput,
  ): Promise<ApiResponse<ApiGuest>> {
    return this.request<ApiGuest>(
      `/guests?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
  }

  async updateGuest(
    guestId: string,
    hotelId: string,
    data: Partial<CreateGuestInput>,
  ): Promise<ApiResponse<ApiGuest>> {
    return this.request<ApiGuest>(
      `/guests/${encodeURIComponent(guestId)}?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    )
  }

  // ─── Channels ──────────────────────────────────────────────────────────────

  async getChannels(hotelId: string): Promise<ApiResponse<ApiChannel[]>> {
    return this.request<ApiChannel[]>(
      `/channels?hotelId=${encodeURIComponent(hotelId)}`,
    )
  }

  async createChannel(
    hotelId: string,
    data: CreateChannelInput,
  ): Promise<ApiResponse<ApiChannel>> {
    return this.request<ApiChannel>(
      `/channels?hotelId=${encodeURIComponent(hotelId)}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
  }

  // ─── Availability Calendar ─────────────────────────────────────────────────

  async getAvailability(
    hotelId: string,
    year: number,
    month: number,
  ): Promise<ApiResponse<AvailabilityData>> {
    return this.request<AvailabilityData>(
      `/availability?hotelId=${encodeURIComponent(hotelId)}&year=${year}&month=${month}`,
    )
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboardStats(hotelId: string): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>(
      `/dashboard?hotelId=${encodeURIComponent(hotelId)}`,
    )
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  async getOccupancyReport(
    hotelId: string,
    from?: string,
    to?: string,
  ): Promise<ApiResponse<OccupancyReportData>> {
    const sp = new URLSearchParams({ hotelId })
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    return this.request(`/reports/occupancy?${sp.toString()}`)
  }

  async getRevenueReport(
    hotelId: string,
    from?: string,
    to?: string,
  ): Promise<ApiResponse<RevenueReportData>> {
    const sp = new URLSearchParams({ hotelId })
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    return this.request(`/reports/revenue?${sp.toString()}`)
  }
}

// Singleton instance exported for the entire app
export const api = new ApiClient()

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse the amenities JSON string from the API into a string array.
 * Returns an empty array if the input is null/undefined/invalid.
 */
export function parseAmenities(amenities: string | null | undefined): string[] {
  if (!amenities) return []
  try {
    const parsed = JSON.parse(amenities)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/**
 * Derive a human-readable room status based on the number of active bookings.
 * 'occupied' if there are any active bookings, 'available' otherwise.
 */
export function deriveRoomStatus(activeBookingCount: number): 'available' | 'occupied' {
  return activeBookingCount > 0 ? 'occupied' : 'available'
}
