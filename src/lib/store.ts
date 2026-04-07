import { create } from 'zustand'
import {
  api,
  type ApiRoom,
  type ApiBooking,
  type ApiGuest,
  type ApiChannel,
  type ApiHotel,
  type DashboardStats,
  type AvailabilityData,
  type CreateBookingInput,
  type CreateRoomInput,
  type CreateGuestInput,
  type CreateChannelInput,
  type RegisterInput,
} from './api'

// ─── Public Types ────────────────────────────────────────────────────────────

export type ViewType =
  | 'dashboard'
  | 'calendar'
  | 'bookings'
  | 'rooms'
  | 'guests'
  | 'channels'
  | 'housekeeping'
  | 'reports'
  | 'analytics'
  | 'revenue'
  | 'rate-parity'
  | 'loyalty'
  | 'reviews'
  | 'concierge'
  | 'activity'
  | 'night_audit'
  | 'settings'

export type { ApiBooking } from './api'
export type BookingStatus = ApiBooking['status']

// Backward-compatible type aliases so existing components can be migrated
// incrementally without breaking TypeScript.
export type MockBooking = ApiBooking
export type MockRoom = ApiRoom
export type MockGuest = ApiGuest
export type MockChannel = ApiChannel

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

// ─── Loading State ───────────────────────────────────────────────────────────

interface LoadingState {
  dashboard: boolean
  rooms: boolean
  bookings: boolean
  guests: boolean
  channels: boolean
  hotel: boolean
  availability: boolean
}

const initialLoading: LoadingState = {
  dashboard: false,
  rooms: false,
  bookings: false,
  guests: false,
  channels: false,
  hotel: false,
  availability: false,
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean
  currentHotelId: string | null
  currentUser: User | null
  userRole: string | null
  platformRole: string | null
  allHotels: Array<{ id: string; name: string; slug: string; city: string | null; country: string; plan: string; role: string }> | null
  token: string | null

  // Navigation
  currentView: ViewType
  sidebarOpen: boolean

  // Calendar state
  calendarDate: Date
  selectedRoomIds: string[]

  // Data from API
  bookings: ApiBooking[]
  rooms: ApiRoom[]
  guests: ApiGuest[]
  channels: ApiChannel[]
  hotel: ApiHotel | null
  dashboardStats: DashboardStats | null
  availabilityData: AvailabilityData | null

  // Loading
  loading: LoadingState

  // UI state
  showNewBookingDialog: boolean
  showNewRoomDialog: boolean
  selectedBookingId: string | null
  selectedGuestId: string | null

  // ── Sync Actions (navigation / UI) ──
  setCurrentView: (view: ViewType) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCalendarDate: (date: Date) => void
  setSelectedRoomIds: (ids: string[]) => void
  setShowNewBookingDialog: (show: boolean) => void
  setShowNewRoomDialog: (show: boolean) => void
  setSelectedBookingId: (id: string | null) => void
  setSelectedGuestId: (id: string | null) => void

  // ── Auth Actions ──
  login: (email: string, password: string) => Promise<boolean>
  register: (data: RegisterInput) => Promise<boolean>
  logout: () => void

  // ── Async Data Fetching ──
  fetchDashboard: () => Promise<void>
  fetchRooms: () => Promise<void>
  fetchBookings: (status?: string) => Promise<void>
  fetchGuests: (search?: string) => Promise<void>
  fetchChannels: () => Promise<void>
  fetchHotel: () => Promise<void>
  fetchAvailability: (year: number, month: number) => Promise<void>

  // ── Mutation Actions ──
  createBooking: (data: CreateBookingInput) => Promise<ApiBooking | null>
  updateBookingStatus: (id: string, status: string) => Promise<boolean>
  createRoom: (data: CreateRoomInput) => Promise<ApiRoom | null>
  createGuest: (data: CreateGuestInput) => Promise<ApiGuest | null>
  createChannel: (data: CreateChannelInput) => Promise<ApiChannel | null>
}

// ─── Store Implementation ────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  currentHotelId: null,
  currentUser: null,
  userRole: null,
  platformRole: null,
  allHotels: null,
  token: null,

  // Navigation
  currentView: 'dashboard',
  sidebarOpen: true,

  // Calendar
  calendarDate: new Date(),
  selectedRoomIds: [],

  // Data (populated from API)
  bookings: [],
  rooms: [],
  guests: [],
  channels: [],
  hotel: null,
  dashboardStats: null,
  availabilityData: null,

  // Loading
  loading: { ...initialLoading },

  // UI state
  showNewBookingDialog: false,
  showNewRoomDialog: false,
  selectedBookingId: null,
  selectedGuestId: null,

  // ── Sync Actions ──────────────────────────────────────────────────────────

  setCurrentView: (view) =>
    set({ currentView: view, selectedBookingId: null, selectedGuestId: null }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setCalendarDate: (date) => set({ calendarDate: date }),

  setSelectedRoomIds: (ids) => set({ selectedRoomIds: ids }),

  setShowNewBookingDialog: (show) => set({ showNewBookingDialog: show }),

  setShowNewRoomDialog: (show) => set({ showNewRoomDialog: show }),

  setSelectedBookingId: (id) => set({ selectedBookingId: id }),

  setSelectedGuestId: (id) => set({ selectedGuestId: id }),

  // ── Auth Actions ──────────────────────────────────────────────────────────

  login: async (email, password) => {
    const response = await api.login(email, password)
    if (!response.success) return false

    const { token, user, hotel, role, platformRole, allHotels } = response.data

    // Persist token to localStorage for API client
    if (typeof window !== 'undefined') {
      localStorage.setItem('easybeds-token', token)
    }

    set({
      isAuthenticated: true,
      currentHotelId: hotel.id,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      userRole: role,
      platformRole: platformRole || 'user',
      allHotels: allHotels || null,
      token,
      currentView: 'dashboard',
    })

    // Fetch all initial data in parallel
    const hotelId = hotel.id
    const promises = [
      get().fetchDashboard(),
      get().fetchRooms(),
      get().fetchBookings(),
      get().fetchGuests(),
      get().fetchChannels(),
      get().fetchHotel(),
    ]
    // Fire-and-forget — errors are handled inside each fetch
    await Promise.allSettled(promises)

    return true
  },

  register: async (data) => {
    const response = await api.register(data)
    if (!response.success) return false

    const { token, user, hotel } = response.data

    // Persist token to localStorage for API client
    if (typeof window !== 'undefined') {
      localStorage.setItem('easybeds-token', token)
    }

    set({
      isAuthenticated: true,
      currentHotelId: hotel.id,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      userRole: 'owner',
      platformRole: 'user',
      allHotels: null,
      token,
      currentView: 'dashboard',
    })

    // Fetch initial data
    const promises = [
      get().fetchDashboard(),
      get().fetchRooms(),
      get().fetchBookings(),
      get().fetchGuests(),
      get().fetchChannels(),
      get().fetchHotel(),
    ]
    await Promise.allSettled(promises)

    return true
  },

  logout: () => {
    // Clear persisted token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('easybeds-token')
    }
    set({
      isAuthenticated: false,
      currentHotelId: null,
      currentUser: null,
      userRole: null,
      platformRole: null,
      allHotels: null,
      token: null,
      currentView: 'dashboard',
      bookings: [],
      rooms: [],
      guests: [],
      channels: [],
      hotel: null,
      dashboardStats: null,
      availabilityData: null,
      loading: { ...initialLoading },
      showNewBookingDialog: false,
      showNewRoomDialog: false,
      selectedBookingId: null,
      selectedGuestId: null,
    })
  },

  // ── Async Data Fetching ──────────────────────────────────────────────────

  fetchDashboard: async () => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, dashboard: true } }))
    const response = await api.getDashboardStats(hotelId)
    set((s) => ({ loading: { ...s.loading, dashboard: false } }))

    if (response.success) {
      set({ dashboardStats: response.data })
    } else {
      console.error('[store] fetchDashboard failed:', response.error)
    }
  },

  fetchRooms: async () => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, rooms: true } }))
    const response = await api.getRooms(hotelId)
    set((s) => ({ loading: { ...s.loading, rooms: false } }))

    if (response.success) {
      set({ rooms: response.data })
    } else {
      console.error('[store] fetchRooms failed:', response.error)
    }
  },

  fetchBookings: async (status?: string) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, bookings: true } }))
    const response = await api.getBookings(hotelId, status ? { status } : undefined)
    set((s) => ({ loading: { ...s.loading, bookings: false } }))

    if (response.success) {
      set({ bookings: response.data.bookings })
    } else {
      console.error('[store] fetchBookings failed:', response.error)
    }
  },

  fetchGuests: async (search?: string) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, guests: true } }))
    const response = await api.getGuests(hotelId, search ? { search } : undefined)
    set((s) => ({ loading: { ...s.loading, guests: false } }))

    if (response.success) {
      set({ guests: response.data.guests })
    } else {
      console.error('[store] fetchGuests failed:', response.error)
    }
  },

  fetchChannels: async () => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, channels: true } }))
    const response = await api.getChannels(hotelId)
    set((s) => ({ loading: { ...s.loading, channels: false } }))

    if (response.success) {
      set({ channels: response.data })
    } else {
      console.error('[store] fetchChannels failed:', response.error)
    }
  },

  fetchHotel: async () => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, hotel: true } }))
    const response = await api.getHotel(hotelId)
    set((s) => ({ loading: { ...s.loading, hotel: false } }))

    if (response.success) {
      set({ hotel: response.data })
    } else {
      console.error('[store] fetchHotel failed:', response.error)
    }
  },

  fetchAvailability: async (year, month) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return

    set((s) => ({ loading: { ...s.loading, availability: true } }))
    const response = await api.getAvailability(hotelId, year, month)
    set((s) => ({ loading: { ...s.loading, availability: false } }))

    if (response.success) {
      set({ availabilityData: response.data })
    } else {
      console.error('[store] fetchAvailability failed:', response.error)
    }
  },

  // ── Mutation Actions ─────────────────────────────────────────────────────

  createBooking: async (data) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return null

    const response = await api.createBooking(hotelId, data)
    if (!response.success) {
      console.error('[store] createBooking failed:', response.error)
      return null
    }

    // Refresh bookings list
    await get().fetchBookings()
    // Refresh dashboard stats too
    await get().fetchDashboard()

    return response.data
  },

  updateBookingStatus: async (id, status) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return false

    const response = await api.updateBookingStatus(id, hotelId, status)
    if (!response.success) {
      console.error('[store] updateBookingStatus failed:', response.error)
      return false
    }

    // Optimistically update the booking in state
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: response.data.status,
              checkedInAt: response.data.checkedInAt ?? b.checkedInAt,
              checkedOutAt: response.data.checkedOutAt ?? b.checkedOutAt,
              cancelledAt: response.data.cancelledAt ?? b.cancelledAt,
            }
          : b,
      ),
    }))

    // Also refresh dashboard stats
    await get().fetchDashboard()

    return true
  },

  createRoom: async (data) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return null

    const response = await api.createRoom(hotelId, data)
    if (!response.success) {
      console.error('[store] createRoom failed:', response.error)
      return null
    }

    // Refresh rooms list
    await get().fetchRooms()

    return response.data
  },

  createGuest: async (data) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return null

    const response = await api.createGuest(hotelId, data)
    if (!response.success) {
      console.error('[store] createGuest failed:', response.error)
      return null
    }

    // Refresh guests list
    await get().fetchGuests()

    return response.data
  },

  createChannel: async (data) => {
    const hotelId = get().currentHotelId
    if (!hotelId) return null

    const response = await api.createChannel(hotelId, data)
    if (!response.success) {
      console.error('[store] createChannel failed:', response.error)
      return null
    }

    // Refresh channels list
    await get().fetchChannels()

    return response.data
  },
}))
