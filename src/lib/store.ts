import { create } from 'zustand'
import type { MockBooking, MockRoom, MockGuest } from './mock-data'

export type ViewType =
  | 'dashboard'
  | 'calendar'
  | 'bookings'
  | 'rooms'
  | 'guests'
  | 'channels'
  | 'reports'
  | 'settings'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AppState {
  // Auth
  isAuthenticated: boolean
  currentHotelId: string | null
  currentUser: User | null

  // Navigation
  currentView: ViewType
  sidebarOpen: boolean

  // Calendar state
  calendarDate: Date
  selectedRoomIds: string[]

  // Bookings
  bookings: MockBooking[]
  rooms: MockRoom[]
  guests: MockGuest[]

  // UI state
  showNewBookingDialog: boolean
  showNewRoomDialog: boolean
  selectedBookingId: string | null
  selectedGuestId: string | null

  // Actions
  login: (user: User, hotelId: string) => void
  logout: () => void
  setCurrentView: (view: ViewType) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCalendarDate: (date: Date) => void
  setSelectedRoomIds: (ids: string[]) => void
  setShowNewBookingDialog: (show: boolean) => void
  setShowNewRoomDialog: (show: boolean) => void
  setSelectedBookingId: (id: string | null) => void
  setSelectedGuestId: (id: string | null) => void
  addBooking: (booking: MockBooking) => void
  updateBookingStatus: (id: string, status: MockBooking['status']) => void
  addRoom: (room: MockRoom) => void
  addGuest: (guest: MockGuest) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  currentHotelId: null,
  currentUser: null,

  // Navigation
  currentView: 'dashboard',
  sidebarOpen: true,

  // Calendar
  calendarDate: new Date(),
  selectedRoomIds: [],

  // Data (will be populated from mock)
  bookings: [],
  rooms: [],
  guests: [],

  // UI state
  showNewBookingDialog: false,
  showNewRoomDialog: false,
  selectedBookingId: null,
  selectedGuestId: null,

  // Actions
  login: (user, hotelId) =>
    set({
      isAuthenticated: true,
      currentUser: user,
      currentHotelId: hotelId,
      currentView: 'dashboard',
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      currentUser: null,
      currentHotelId: null,
      currentView: 'dashboard',
      bookings: [],
      rooms: [],
      guests: [],
    }),

  setCurrentView: (view) =>
    set({ currentView: view, selectedBookingId: null, selectedGuestId: null }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setCalendarDate: (date) => set({ calendarDate: date }),

  setSelectedRoomIds: (ids) => set({ selectedRoomIds: ids }),

  setShowNewBookingDialog: (show) => set({ showNewBookingDialog: show }),

  setShowNewRoomDialog: (show) => set({ showNewRoomDialog: show }),

  setSelectedBookingId: (id) => set({ selectedBookingId: id }),

  setSelectedGuestId: (id) => set({ selectedGuestId: id }),

  addBooking: (booking) =>
    set((state) => ({ bookings: [...state.bookings, booking] })),

  updateBookingStatus: (id, status) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    })),

  addRoom: (room) =>
    set((state) => ({ rooms: [...state.rooms, room] })),

  addGuest: (guest) =>
    set((state) => ({ guests: [...state.guests, guest] })),
}))
