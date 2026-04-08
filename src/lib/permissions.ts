import type { ViewType } from './store'

// ─── Role definitions ──────────────────────────────────────────────────────────

export type HotelRole = 'owner' | 'manager' | 'staff' | 'housekeeping'
export type PlatformRole = 'admin' | 'user'

// ─── View permissions by role ─────────────────────────────────────────────────

/**
 * Maps each role to the views they are allowed to access.
 * Platform admins have access to everything.
 */
const ROLE_VIEWS: Record<HotelRole, ViewType[]> = {
  owner: [
    'dashboard',
    'calendar',
    'bookings',
    'rooms',
    'guests',
    'channels',
    'housekeeping',
    'activity',
    'night_audit',
    'revenue',
    'analytics',
    'rate-parity',
    'concierge',
    'reviews',
    'loyalty',
    'settings',
    'reports',
    'subscription',
  ],
  manager: [
    'dashboard',
    'calendar',
    'bookings',
    'rooms',
    'guests',
    'channels',
    'housekeeping',
    'activity',
    'night_audit',
    'revenue',
    'analytics',
    'rate-parity',
    'concierge',
    'reviews',
    'loyalty',
    'settings',
    'reports',
    'subscription',
  ],
  staff: [
    'dashboard',
    'calendar',
    'bookings',
    'rooms',
    'guests',
    'housekeeping',
  ],
  housekeeping: [
    'dashboard',
    'housekeeping',
  ],
}

// ─── Action permissions by role ───────────────────────────────────────────────

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage_staff'    // add/remove staff, change roles
  | 'manage_settings' // hotel settings, policies, plans
  | 'night_audit'     // run night audit
  | 'manage_revenue'  // rate plans, pricing rules, coupons
  | 'manage_channels' // add/edit/delete OTA channels
  | 'manage_rooms'    // add/edit/delete rooms
  | 'manage_bookings' // create, cancel, modify bookings

/**
 * Maps each action to the roles allowed to perform it.
 */
const ACTION_ROLES: Record<ActionType, HotelRole[]> = {
  // Room operations
  manage_rooms: ['owner', 'manager', 'staff'],

  // Booking operations
  manage_bookings: ['owner', 'manager', 'staff'],
  create: ['owner', 'manager', 'staff'],
  read: ['owner', 'manager', 'staff', 'housekeeping'],
  update: ['owner', 'manager', 'staff'],
  delete: ['owner', 'manager'],

  // Sensitive operations
  manage_staff: ['owner'],
  manage_settings: ['owner', 'manager'],
  night_audit: ['owner', 'manager'],
  manage_revenue: ['owner', 'manager'],
  manage_channels: ['owner', 'manager'],

  // Guest operations (staff can add/edit but not delete)
  // This is handled separately in canPerformAction
}

// ─── Public permission helpers ────────────────────────────────────────────────

/**
 * Check if a user with the given role can access a specific view.
 * Platform admins always have access.
 */
export function canAccessView(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
  view: ViewType,
): boolean {
  // Platform admins see everything
  if (platformRole === 'admin') return true

  if (!role) return false

  const allowedViews = ROLE_VIEWS[role]
  if (!allowedViews) return false

  return allowedViews.includes(view)
}

/**
 * Check if a user with the given role can perform a specific action.
 * Platform admins always have permission.
 */
export function canPerformAction(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
  action: ActionType,
): boolean {
  // Platform admins can do everything
  if (platformRole === 'admin') return true

  if (!role) return false

  const allowedRoles = ACTION_ROLES[action]
  if (!allowedRoles) return false

  return allowedRoles.includes(role)
}

/**
 * Get the list of views accessible to a user with the given role.
 * Useful for filtering navigation menus.
 */
export function getAccessibleViews(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
): ViewType[] {
  // Platform admins see everything including admin panel
  if (platformRole === 'admin') {
    return [...ROLE_VIEWS.owner, 'admin']
  }

  if (!role) return []

  return ROLE_VIEWS[role] || []
}

/**
 * Get the default redirect view for a user who doesn't have access to their current view.
 * Falls back to the first accessible view, then to dashboard.
 */
export function getDefaultView(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
): ViewType {
  const views = getAccessibleViews(role, platformRole)
  return views.length > 0 ? views[0] : 'dashboard'
}

/**
 * Check if the role can manage staff (owner only).
 */
export function canManageStaff(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
): boolean {
  return canPerformAction(role, platformRole, 'manage_staff')
}

/**
 * Check if the role can access settings.
 */
export function canAccessSettings(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
): boolean {
  return canPerformAction(role, platformRole, 'manage_settings')
}

/**
 * Check if the role can delete items (owner/manager only).
 */
export function canDelete(
  role: HotelRole | null,
  platformRole: PlatformRole | null,
): boolean {
  return canPerformAction(role, platformRole, 'delete')
}
