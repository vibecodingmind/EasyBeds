import type { ViewType } from './store'

// ─── Hash ↔ ViewType mapping ─────────────────────────────────────────────
// URL hashes use hyphens (night-audit, rate-parity) while store ViewType
// uses underscores (night_audit).  This map bridges the two.

const HASH_TO_VIEW: Record<string, ViewType> = {
  '': 'dashboard',
  dashboard: 'dashboard',
  calendar: 'calendar',
  bookings: 'bookings',
  rooms: 'rooms',
  guests: 'guests',
  channels: 'channels',
  housekeeping: 'housekeeping',
  revenue: 'revenue',
  reports: 'reports',
  analytics: 'analytics',
  'rate-parity': 'rate-parity',
  concierge: 'concierge',
  reviews: 'reviews',
  loyalty: 'loyalty',
  'night-audit': 'night_audit',
  activity: 'activity',
  settings: 'settings',
  // Legacy / alias support (underscore variants in URL)
  night_audit: 'night_audit',
  rate_parity: 'rate-parity',
}

const VIEW_TO_HASH: Record<ViewType, string> = {
  dashboard: '',
  calendar: 'calendar',
  bookings: 'bookings',
  rooms: 'rooms',
  guests: 'guests',
  channels: 'channels',
  housekeeping: 'housekeeping',
  reports: 'reports',
  analytics: 'analytics',
  revenue: 'revenue',
  'rate-parity': 'rate-parity',
  concierge: 'concierge',
  reviews: 'reviews',
  loyalty: 'loyalty',
  night_audit: 'night-audit',
  activity: 'activity',
  settings: 'settings',
}

// ─── Document titles ─────────────────────────────────────────────────────

const VIEW_TITLES: Record<ViewType, string> = {
  dashboard: 'Dashboard — EasyBeds',
  calendar: 'Room Calendar — EasyBeds',
  bookings: 'Bookings — EasyBeds',
  rooms: 'Room Management — EasyBeds',
  guests: 'Guest Directory — EasyBeds',
  channels: 'Channel Manager — EasyBeds',
  housekeeping: 'Housekeeping — EasyBeds',
  reports: 'Reports — EasyBeds',
  analytics: 'Analytics — EasyBeds',
  revenue: 'Revenue & Pricing — EasyBeds',
  'rate-parity': 'Rate Parity — EasyBeds',
  concierge: 'AI Concierge — EasyBeds',
  reviews: 'Reviews — EasyBeds',
  loyalty: 'Loyalty — EasyBeds',
  night_audit: 'Night Audit — EasyBeds',
  activity: 'Activity Log — EasyBeds',
  settings: 'Settings — EasyBeds',
}

// ─── Public helpers ──────────────────────────────────────────────────────

/** Resolve the current URL hash to a ViewType (defaults to dashboard). */
export function getViewFromHash(): ViewType {
  const hash = window.location.hash.replace('#', '').trim()
  return HASH_TO_VIEW[hash] || 'dashboard'
}

/** Update the URL hash to match the given view. */
export function navigateTo(view: ViewType): void {
  const hash = VIEW_TO_HASH[view] ?? ''
  // Use history API to avoid unnecessary extra history entry
  const target = hash ? `#${hash}` : window.location.pathname + window.location.search
  if (window.location.hash !== (hash ? `#${hash}` : '')) {
    window.location.hash = hash
  }
}

/** Get a human-readable page title for a view. */
export function getViewTitle(view: ViewType): string {
  return VIEW_TITLES[view] || 'EasyBeds'
}

/**
 * Initialise the hash-based router.
 *
 * 1. Reads the current hash and syncs it to the store on mount.
 * 2. Listens for `hashchange` events (browser back/forward, manual edits).
 * 3. Returns a cleanup function to remove the listener.
 */
export function initRouter(
  setCurrentView: (view: ViewType) => void,
  updateTitle: (view: ViewType) => void,
): () => void {
  // Sync initial hash → store
  const initial = getViewFromHash()
  setCurrentView(initial)
  updateTitle(initial)

  const handler = () => {
    const view = getViewFromHash()
    setCurrentView(view)
    updateTitle(view)
  }

  window.addEventListener('hashchange', handler)

  return () => window.removeEventListener('hashchange', handler)
}
