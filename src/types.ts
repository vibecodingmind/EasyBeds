export type UserRole =
  // Platform User Roles
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_AGENT'
  | 'TECHNICAL_ADMIN'
  // Hotel Tenant Roles
  | 'PROPERTY_OWNER'
  | 'HOTEL_OWNER'
  | 'PROPERTY_MANAGER'
  | 'GENERAL_MANAGER'
  | 'HOTEL_MANAGER'
  | 'FRONT_DESK'
  | 'RESERVATION_AGENT'
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'FINANCE'
  | 'ACCOUNTANT'
  | 'CHANNEL_MANAGER'
  | 'FNB_MANAGER'
  | 'RESTAURANT_SERVER'
  | 'KITCHEN_CHEF'
  | 'POOL_ATTENDANT'
  | 'INVENTORY_MANAGER'
  | 'PURCHASING_OFFICER'
  | 'CUSTOM_ROLE';

export type AuthorizationContextType = 'PLATFORM' | 'HOTEL_ADMIN_ACCESS' | 'HOTEL_STAFF' | 'HOTEL';

export type HotelAccessReasonCode =
  | 'customer_support'
  | 'troubleshooting'
  | 'configuration'
  | 'security_investigation'
  | 'billing_tier'
  | 'other';

export interface TemporaryHotelAccessSession {
  sessionId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  targetTenantId: string;
  targetTenantName: string;
  targetTenantPlan: string;
  reason: HotelAccessReasonCode;
  reasonLabel: string;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  ipAddress?: string;
}

export type PermissionCode =
  // PMS & Calendar
  | 'pms.tape_chart.view'
  | 'pms.rooms.view'
  | 'pms.rooms.manage'
  | 'pms.rooms.status_update'
  // Reservations
  | 'reservations.view'
  | 'reservations.create'
  | 'reservations.edit'
  | 'reservations.cancel'
  | 'reservations.check_in'
  | 'reservations.check_out'
  | 'reservations.assign_room'
  // Guests
  | 'guests.view'
  | 'guests.manage'
  | 'guests.vip_tag'
  // Folio & Billing
  | 'folio.view'
  | 'folio.charge'
  | 'folio.adjust'
  | 'folio.payment_record'
  | 'folio.refund'
  // Housekeeping & Maintenance
  | 'housekeeping.view'
  | 'housekeeping.task_assign'
  | 'housekeeping.status_update'
  | 'maintenance.view'
  | 'maintenance.ticket_create'
  | 'maintenance.ticket_resolve'
  | 'maintenance.room_block'
  // Channel Manager & Rates
  | 'channels.view'
  | 'channels.configure'
  | 'channels.sync_trigger'
  | 'channels.mapping_manage'
  | 'rates.view'
  | 'rates.manage'
  | 'rates.restrictions_manage'
  // Food & Beverage / POS / KDS
  | 'fnb.tables.view'
  | 'fnb.menu.manage'
  | 'fnb.order.create'
  | 'fnb.order.settle'
  | 'fnb.order.charge_room'
  | 'kds.view'
  | 'kds.bump_ticket'
  // Swimming Pool & Leisure
  | 'pool.view'
  | 'pool.pass_issue'
  | 'pool.charge_room'
  | 'pool.water_log'
  // Inventory & Purchasing
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.product_manage'
  | 'purchasing.po_create'
  | 'purchasing.po_receive'
  // Finance & Reports
  | 'finance.ledger_view'
  | 'finance.expense_manage'
  | 'reports.analytics_view'
  | 'reports.financial_export'
  // Team, Roles & Settings
  | 'settings.property_manage'
  | 'settings.policies_manage'
  | 'users.view'
  | 'users.manage'
  | 'roles.view'
  | 'roles.manage'
  | 'modules.view'
  | 'modules.toggle'
  | 'audit.view'
  // Platform SaaS Permissions
  | 'platform.dashboard.view'
  | 'platform.tenants.view'
  | 'platform.tenants.manage'
  | 'platform.subscriptions.view'
  | 'platform.subscriptions.manage'
  | 'platform.billing.view'
  | 'platform.billing.manage'
  | 'platform.modules.view'
  | 'platform.modules.manage'
  | 'platform.users.view'
  | 'platform.users.manage'
  | 'platform.roles.view'
  | 'platform.roles.manage'
  | 'platform.permissions.manage'
  | 'platform.apis.view'
  | 'platform.apis.manage'
  | 'platform.integrations.view'
  | 'platform.integrations.manage'
  | 'platform.system.view'
  | 'platform.system.manage'
  | 'platform.audit.view'
  | 'platform.settings.view'
  | 'platform.settings.manage'
  | 'platform.hotel_access'
  | string;

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  category:
    | 'PMS & Tape Chart'
    | 'Reservations & Front Desk'
    | 'Guest CRM'
    | 'Folio & Billing'
    | 'Housekeeping'
    | 'Maintenance'
    | 'Channel Manager & Rates'
    | 'Food & Beverage / POS'
    | 'Kitchen Display (KDS)'
    | 'Swimming Pool & Leisure'
    | 'Inventory & Purchasing'
    | 'Finance & Reports'
    | 'Settings & Security'
    | 'Platform Administration';
  description: string;
}

export interface UserRoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'platform' | 'hotel_executive' | 'hotel_operations' | 'food_leisure' | 'custom';
  isSystem: boolean;
  tenantId?: string; // If custom role for specific tenant
  permissions: PermissionCode[];
  defaultLandingView: string;
  allowedOutlets?: string[]; // e.g. ['*'] or specific outlet IDs
}

export interface UserScope {
  tenantId: string;
  propertyIds: string[]; // ['*'] for all properties, or list of property IDs
  outletIds: string[]; // ['*'] for all outlets, or list of dining/bar/pool/inventory IDs
  department?: string; // 'front_desk' | 'housekeeping' | 'fnb' | 'pool' | 'inventory' | 'management' | 'finance'
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  roleId?: string;
  customRoleName?: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  scope: UserScope;
  permissions?: PermissionCode[];
  active: boolean;
  lastLoginAt?: string;
}

export type SubscriptionTier = 'starter' | 'pro' | 'professional' | 'enterprise';

export interface TenantSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  autoSyncIntervalMins: number;
  enableDirectBookingEngine: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  slug?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended';
  maxProperties?: number;
  maxRooms?: number;
  settings?: TenantSettings;
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyPolicy {
  checkInTime: string;
  checkOutTime: string;
  cancellationHours: number;
  cancellationPolicy: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
}

export interface PropertyTax {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_per_night' | 'fixed_per_stay';
  amount: number;
  includedInPrice: boolean;
}

export interface PropertyFee {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_per_stay' | 'fixed_per_night';
  amount: number;
}

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  currency: string;
  timezone: string;
  description: string;
  heroImage: string;
  starRating: number;
  checkInTime?: string;
  checkOutTime?: string;
  policies: PropertyPolicy;
  taxes: PropertyTax[];
  fees: PropertyFee[];
}

export type RoomStatus =
  | 'clean'
  | 'dirty'
  | 'inspected'
  | 'occupied'
  | 'out_of_order'
  | 'maintenance';

export interface RoomType {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  code: string;
  description?: string;
  baseOccupancy?: number;
  maxAdults?: number;
  maxChildren?: number;
  maxGuests?: number;
  baseRate: number;
  weekendRate?: number;
  weekendMultiplier?: number;
  minStayDefault?: number;
  bedConfiguration: string;
  amenities: string[];
  totalUnits?: number;
}

export interface Room {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number | string;
  status: RoomStatus;
  isOccupied?: boolean;
  currentGuestName?: string;
  keyCardCode?: string;
  notes?: string;
  lastCleanedAt?: string;
  cleanedBy?: string;
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD
  roomTypeId: string;
  availableUnits: number;
  bookedUnits: number;
  blockedUnits: number;
  rate: number;
  minStay: number;
  maxStay: number;
  stopSell: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
}

export interface RatePlan {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  code: string;
  baseMultiplier: number;
  cancellationPolicy: string;
  includesBreakfast: boolean;
  isNonRefundable: boolean;
  minStay: number;
}

export interface Guest {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  idPassportNumber?: string;
  idType?: 'passport' | 'national_id' | 'driver_license';
  vip: boolean;
  totalStays: number;
  lifetimeSpend?: number;
  totalSpent?: number;
  specialRequests?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ReservationSource =
  | 'direct'
  | 'walk_in'
  | 'phone'
  | 'booking_com'
  | 'airbnb'
  | 'expedia'
  | 'agoda'
  | 'hostelworld'
  | 'google_hotels'
  | 'ical'
  | 'nobeds';

export type ReservationStatus =
  | 'inquiry'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'refunded';

export interface FolioItem {
  id: string;
  date: string;
  description: string;
  category: 'room' | 'tax' | 'fee' | 'minibar' | 'fnb' | 'laundry' | 'other';
  amount: number;
  quantity: number;
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: 'credit_card' | 'cash' | 'bank_transfer' | 'ota_virtual_card' | 'pos';
  reference?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  propertyId: string;
  reservationCode: string;
  guestId: string;
  guest: Guest;
  roomTypeId: string;
  roomId?: string; // Optional physical room assignment
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  source: ReservationSource;
  channelReservationId?: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  nightlyRate: number;
  totalNights: number;
  subtotal: number;
  taxAmount: number;
  feeAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  folio: FolioItem[];
  payments: PaymentTransaction[];
  specialRequests?: string;
  internalNotes?: string;
  estimatedArrivalTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChannelId =
  | 'booking_com'
  | 'airbnb'
  | 'expedia'
  | 'agoda'
  | 'hostelworld'
  | 'google_hotels'
  | 'ical'
  | 'nobeds';

export interface ChannelConnection {
  id: string;
  tenantId: string;
  propertyId: string;
  channelId: ChannelId;
  channelName: string;
  accountIdentifier?: string;
  apiKeyMasked?: string;
  hotelIdOnChannel?: string;
  iCalExportUrl?: string;
  iCalImportUrl?: string;
  isConnected: boolean;
  isActive?: boolean;
  syncRates: boolean;
  syncAvailability: boolean;
  syncReservations: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'disconnected';
  lastSyncTime?: string;
  lastErrorMessage?: string;
}

export interface ChannelRoomMapping {
  id: string;
  channelConnectionId: string;
  channelId: ChannelId;
  internalRoomTypeId: string;
  externalRoomTypeId: string;
  externalRoomTypeName: string;
  rateMultiplier: number; // e.g. 1.0 (100%), 1.15 (+15% markup)
}

export type ChannelMapping = ChannelRoomMapping;

export interface SyncLog {
  id: string;
  tenantId: string;
  propertyId: string;
  channelId: ChannelId;
  direction: 'outbound' | 'inbound';
  action: 'push_rates' | 'push_availability' | 'pull_reservations' | 'push_restrictions' | 'ical_export' | 'ical_import';
  status: 'success' | 'failed' | 'warning';
  recordsAffected: number;
  payloadSummary: string;
  errorDetails?: string;
  timestamp: string;
}

export interface HousekeepingTask {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  roomNumber?: string;
  roomTypeName?: string;
  taskType: 'full_clean' | 'touch_up' | 'linen_change' | 'inspection' | 'deep_clean' | 'checkout' | 'stayover';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'clean' | 'dirty' | 'inspected';
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  roomNumber?: string;
  title: string;
  category?: 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 'appliance' | 'structural' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'open' | 'in_progress' | 'waiting_parts' | 'resolved';
  roomBlocked?: boolean;
  isOutOfOrder?: boolean;
  reportedBy?: string;
  assignedTo?: string;
  costEstimate?: number;
  reportedAt?: string;
  createdAt?: string;
  resolvedAt?: string;
  description: string;
}

export type MaintenanceTicket = MaintenanceWorkOrder;

export interface FinancialExpense {
  id: string;
  tenantId: string;
  propertyId: string;
  category: 'utilities' | 'supplies' | 'payroll' | 'maintenance' | 'ota_commissions' | 'software' | 'marketing' | 'other' | string;
  amount: number;
  date: string;
  vendor: string;
  paymentMethod?: string;
  description?: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  propertyId: string;
  reservationId: string;
  invoiceNumber: string;
  guestName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
}

export interface Message {
  id: string;
  tenantId: string;
  propertyId: string;
  reservationId?: string;
  guestId?: string;
  guestName: string;
  channel: ReservationSource;
  sender: 'guest' | 'hotel';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface GuestReview {
  id: string;
  tenantId: string;
  propertyId: string;
  reservationId?: string;
  guestName: string;
  source: ReservationSource;
  rating: number; // 1 to 10 or 1 to 5 normalized
  title: string;
  comment: string;
  stayDate: string;
  hotelResponse?: string;
  responseDate?: string;
  status: 'published' | 'pending_response' | 'archived';
}

export interface OperationsTask {
  id: string;
  tenantId: string;
  propertyId: string;
  title: string;
  department: 'front_desk' | 'housekeeping' | 'maintenance' | 'management' | 'finance';
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  relatedReservationId?: string;
  relatedRoomId?: string;
}

export interface AnalyticsMetrics {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number; // %
  adr: number; // Average Daily Rate ($)
  revPar: number; // Revenue Per Available Room ($)
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  monthRevenue: number;
  projectedMonthRevenue: number;
  channelBreakdown: { source: ReservationSource; count: number; revenue: number; percentage: number }[];
  revenueLast7Days: { date: string; revenue: number; occupancy: number }[];
}

// ==========================================
// 1. MODULAR HOTEL OS - MODULE REGISTRY & LIFECYCLE
// ==========================================

export type ModuleCategory =
  | 'core_pms'
  | 'distribution'
  | 'food_beverage'
  | 'leisure_wellness'
  | 'operations'
  | 'guest_services'
  | 'events_sales'
  | 'finance_reporting';

export type ModuleLifecycleStatus =
  | 'AVAILABLE'
  | 'ENABLED'
  | 'DISABLED'
  | 'LOCKED'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'DEPRECATED';

export type ModuleCode =
  | 'PMS'
  | 'RESERVATIONS'
  | 'FRONT_DESK'
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'CHANNEL_MANAGER'
  | 'RATES_AVAILABILITY'
  | 'GUEST_MANAGEMENT'
  | 'RESTAURANT'
  | 'RESTAURANT_POS'
  | 'KITCHEN'
  | 'KITCHEN_KDS'
  | 'BAR'
  | 'BAR_POS'
  | 'SWIMMING_POOL'
  | 'INVENTORY'
  | 'PURCHASING'
  | 'RECIPES'
  | 'GUEST_FOLIO'
  | 'FINANCE'
  | 'SPA'
  | 'GYM'
  | 'LAUNDRY'
  | 'ROOM_SERVICE'
  | 'MINIBAR'
  | 'CONFERENCE'
  | 'EVENTS'
  | 'PARKING'
  | 'TOURS'
  | 'ACTIVITIES'
  | string;

export interface ModuleDefinition {
  id: string;
  code: ModuleCode;
  name: string;
  description: string;
  category: ModuleCategory;
  icon: string; // Lucide icon name
  version: string;
  featureKey: string;
  dependencies: ModuleCode[]; // Required codes before activating
  sortOrder: number;
  isCore: boolean;
  isAvailable: boolean;
  requiredPlanTier: 'starter' | 'pro' | 'professional' | 'enterprise';
  addonAvailable?: boolean;
  addonPriceMonthly?: number;
  configurationSchema?: Record<string, any>;
  defaultConfiguration?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantModuleActivation {
  id: string;
  tenantId: string;
  propertyId?: string; // If undefined, applies to all properties
  moduleCode: ModuleCode;
  status: ModuleLifecycleStatus;
  enabledAt?: string;
  enabledBy?: string;
  disabledAt?: string;
  disabledBy?: string;
  configuration: Record<string, any>;
  limits?: Record<string, number>;
}

export interface SubscriptionAddon {
  id: string;
  code: string;
  name: string;
  description: string;
  moduleCodes: ModuleCode[];
  monthlyPrice: number;
  category: ModuleCategory;
  featuresGranted: string[];
}

export interface TenantEntitlement {
  tenantId: string;
  planTier: SubscriptionTier;
  planStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended';
  activeAddons: string[]; // Addon IDs or codes
  customOverrides: {
    moduleCode: ModuleCode;
    allowed: boolean;
    expiresAt?: string;
    reason?: string;
  }[];
  limits: {
    maxProperties: number;
    maxRooms: number;
    maxUsers: number;
    maxOutlets: number;
    maxPosTerminals: number;
    maxPoolCapacity: number;
    maxInventoryLocations: number;
  };
  currentUsage: {
    properties: number;
    rooms: number;
    users: number;
    outlets: number;
    posTerminals: number;
    inventoryLocations: number;
  };
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  propertyId?: string;
  userId?: string;
  userName?: string;
  action:
    | 'MODULE_ENABLED'
    | 'MODULE_DISABLED'
    | 'MODULE_CONFIG_UPDATED'
    | 'MODULE_ENTITLEMENT_CHANGED'
    | 'PLAN_CHANGED'
    | 'ADDON_ACTIVATED'
    | 'ADDON_CANCELLED'
    | 'ADDON_SUBSCRIBED'
    | 'FOLIO_CHARGE_CREATED'
    | 'PAYMENT_RECORDED'
    | 'INVENTORY_ADJUSTMENT'
    | 'STOCK_ADJUSTED'
    | 'PO_RECEIVED'
    | 'ORDER_CREATED'
    | 'ORDER_SETTLED'
    | 'POOL_PASS_ISSUED'
    | 'POOL_WATER_LOGGED'
    | string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ==========================================
// 2. RESTAURANT, BAR & POS OPERATIONAL MODELS
// ==========================================

export interface DiningTable {
  id: string;
  propertyId: string;
  outletId: string;
  number: string;
  name?: string;
  section: 'indoor' | 'patio' | 'rooftop' | 'poolside' | 'bar' | 'terrace';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId?: string;
  currentGuests?: number;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  priceDelta: number; // e.g. +$2 for extra cheese, +$0 for rare
  isDefault?: boolean;
}

export interface MenuItemModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: MenuItemModifier[];
}

export interface MenuItem {
  id: string;
  tenantId: string;
  propertyId: string;
  outletId: string; // e.g. 'restaurant-main' or 'bar-rooftop'
  category: string; // 'Appetizers' | 'Mains' | 'Cocktails' | 'Beverages' | 'Desserts' | 'Snacks'
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  taxRate: number; // e.g. 0.10 for 10%
  imageUrl?: string;
  station: 'hot_kitchen' | 'cold_kitchen' | 'grill' | 'bar' | 'pastry';
  isAvailable: boolean;
  dietaryTags: ('vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'signature')[];
  modifierGroups?: MenuItemModifierGroup[];
  recipeIngredientIds?: { ingredientId: string; quantity: number; unit: string }[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  station: 'hot_kitchen' | 'cold_kitchen' | 'grill' | 'bar' | 'pastry';
  selectedModifiers?: { name: string; priceDelta: number }[];
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'voided';
  preparedAt?: string;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  tenantId: string;
  propertyId: string;
  outletId: string; // 'restaurant' | 'bar' | 'room_service' | 'pool_bar'
  outletName: string;
  orderType: 'dine_in' | 'takeaway' | 'room_charge' | 'bar_tab';
  tableId?: string;
  tableNumber?: string;
  // PMS Guest Integration
  guestId?: string;
  guestName?: string;
  reservationId?: string;
  roomId?: string;
  roomNumber?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'paid_room_charge' | 'room_charged' | 'paid_cash' | 'paid_card' | 'voided';
  paymentReference?: string;
  status: 'open' | 'sent_to_kitchen' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  serverName: string;
}

// ==========================================
// 3. KITCHEN DISPLAY SYSTEM (KDS)
// ==========================================

export interface KDSTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  propertyId: string;
  outletName: string;
  destination: string; // 'Table 4' | 'Room 204' | 'Takeaway' | 'Bar Tab'
  station: 'all' | 'hot_kitchen' | 'cold_kitchen' | 'grill' | 'bar' | 'pastry';
  items: {
    id: string;
    name: string;
    quantity: number;
    modifiers?: string[];
    specialInstructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served';
  }[];
  status: 'pending' | 'in_progress' | 'ready' | 'completed';
  serverName: string;
  createdAt: string;
  timerMinutes: number;
  priority: 'normal' | 'rush' | 'delayed';
}

// ==========================================
// 4. SWIMMING POOL & LEISURE HUB
// ==========================================

export interface PoolFacility {
  id: string;
  propertyId: string;
  name: string;
  maxCapacity: number;
  currentOccupancy: number;
  operatingHours: string;
  status: 'open' | 'closed' | 'cleaning' | 'maintenance';
  adultVisitorPrice: number;
  childVisitorPrice: number;
  guestAccessPolicy: 'complimentary' | 'ticketed';
  towelRentalPrice: number;
}

export interface PoolTicket {
  id: string;
  ticketNumber: string;
  propertyId: string;
  type: 'hotel_guest' | 'external_visitor' | 'day_pass' | 'membership';
  holderName: string;
  partySize: number;
  roomId?: string;
  roomNumber?: string;
  guestId?: string;
  reservationId?: string;
  checkInTime: string;
  checkOutTime?: string;
  amountPaid: number;
  paymentMethod: 'room_folio' | 'cash' | 'card' | 'free_inhouse' | 'room_charge';
  towelsIssued: number;
  towelsReturned: number;
  status: 'active' | 'completed' | 'checked_out' | 'expired';
}

export interface PoolWaterQualityLog {
  id: string;
  propertyId: string;
  poolId: string;
  testedAt: string;
  testedBy: string;
  phLevel: number; // ideal: 7.2 - 7.6
  freeChlorinePpm: number; // ideal: 1.0 - 3.0
  totalChlorinePpm: number;
  waterTemperatureC: number; // e.g. 27°C
  clarity: 'crystal_clear' | 'slightly_cloudy' | 'cloudy';
  chemicalDosageAdded?: string;
  notes?: string;
  isCompliant: boolean;
}

// ==========================================
// 5. INVENTORY, PURCHASING & RECIPES
// ==========================================

export interface InventoryLocation {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  type: 'warehouse' | 'kitchen' | 'restaurant' | 'bar' | 'pool' | 'housekeeping' | 'spa';
  manager?: string;
}

export interface InventoryProduct {
  id: string;
  tenantId: string;
  propertyId: string;
  sku: string;
  name: string;
  category: 'beverages' | 'food_ingredients' | 'liquor' | 'cleaning_linens' | 'guest_amenities' | 'pool_chemicals' | 'maintenance_parts';
  unit: 'kg' | 'g' | 'liters' | 'ml' | 'bottles' | 'pieces' | 'boxes' | 'packs';
  currentStock: number;
  minStockLevel: number; // Reorder alert threshold
  targetStockLevel: number;
  costPerUnit: number;
  supplierId: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  lastStockCheck?: string;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  propertyId: string;
  productId: string;
  productName: string;
  type: 'PURCHASE' | 'SALE' | 'CONSUMPTION' | 'WASTE' | 'DAMAGE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantityChange: number; // e.g. +50 or -5
  unit: string;
  fromLocationId?: string;
  toLocationId?: string;
  costValue: number;
  reference?: string; // Order #, PO #, Waste Reason
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  paymentTerms: string;
  address: string;
  leadTimeDays: number;
  active: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  tenantId: string;
  propertyId: string;
  supplierId: string;
  supplierName: string;
  destinationLocationId: string;
  destinationLocationName: string;
  status: 'draft' | 'submitted' | 'partially_received' | 'received' | 'cancelled';
  items: {
    productId: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  expectedDeliveryDate: string;
  createdAt: string;
  receivedAt?: string;
  createdBy: string;
  notes?: string;
}

// ==========================================
// 6. SAAS PLATFORM ADMINISTRATION MODELS
// ==========================================

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  trialingTenants: number;
  suspendedTenants: number;
  totalProperties: number;
  totalRooms: number;
  totalPlatformUsers: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  failedPaymentsCount: number;
  globalModuleAdoptions: Record<string, number>;
  activeOtaConnections: number;
  apiRequests24h: number;
  systemUptimePercentage: number;
  averageResponseTimeMs: number;
}

export interface PlatformTenantDetail extends Tenant {
  propertiesCount: number;
  roomsCount: number;
  usersCount: number;
  activeModules: string[];
  monthlyFee: number;
  billingContactEmail?: string;
  nextBillingDate?: string;
  lastActiveAt?: string;
}

export interface PlatformSubscriptionPlan {
  id: string;
  code: string;
  name: string;
  tier: SubscriptionTier;
  monthlyPrice: number;
  annualPrice: number;
  maxProperties: number;
  maxRooms: number;
  includedModules: string[];
  features: string[];
  tenantCount: number;
  isPopular?: boolean;
}

export interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'refunded';
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod: string;
}

export interface PlatformAPIClient {
  id: string;
  name: string;
  clientId: string;
  clientSecretMasked: string;
  tenantId?: string; // If scoped to a tenant or global platform client
  tier: 'free' | 'standard' | 'unlimited';
  rateLimitRps: number;
  dailyQuota: number;
  requestsToday: number;
  webhookUrl?: string;
  status: 'active' | 'revoked' | 'suspended';
  createdAt: string;
  lastUsedAt: string;
}

export interface PlatformIntegrationService {
  id: string;
  name: string;
  category: 'payment' | 'ota_gateway' | 'email_sms' | 'accounting' | 'iot_locks';
  provider: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'offline';
  latencyMs: number;
  uptime24h: number;
  errorRatePercentage: number;
  lastHealthCheck: string;
  configSummary?: string;
}

export interface PlatformSystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  databaseStatus: 'connected' | 'degraded' | 'disconnected';
  databaseLatencyMs: number;
  backgroundQueues: {
    name: string;
    pendingJobs: number;
    processed24h: number;
    failedJobs: number;
  }[];
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeWebsockets: number;
  lastBackupAt: string;
}

export interface PlatformAuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  contextType: 'PLATFORM' | 'HOTEL_ADMIN_ACCESS' | 'HOTEL_OPERATIONAL';
  targetTenantId?: string;
  targetTenantName?: string;
  reason?: string;
  reasonCode?: string;
  durationSeconds?: number;
  details: string;
  ipAddress: string;
  timestamp: string;
}
