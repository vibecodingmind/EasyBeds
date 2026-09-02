import {
  Tenant, Property, RoomType, Room, Guest, Reservation,
  ChannelConnection, ChannelRoomMapping, SyncLog,
  HousekeepingTask, MaintenanceWorkOrder, FinancialExpense,
  Message, GuestReview, OperationsTask, User, DateAvailability,
  ModuleDefinition, TenantModuleActivation, SubscriptionAddon,
  TenantEntitlement, AuditLogEntry, DiningTable, MenuItem,
  RestaurantOrder, KDSTicket, PoolFacility, PoolTicket,
  PoolWaterQualityLog, InventoryLocation, InventoryProduct,
  StockMovement, Supplier, PurchaseOrder, ModuleCode,
  UserRoleDefinition, PermissionDefinition, PermissionCode, UserScope,
  PlatformMetrics, PlatformTenantDetail, PlatformSubscriptionPlan,
  PlatformInvoice, PlatformAPIClient, PlatformIntegrationService,
  PlatformSystemHealth, PlatformAuditLog, TemporaryHotelAccessSession,
  HotelAccessReasonCode
} from '../src/types';
import { PERMISSIONS_CATALOG, DEFAULT_ROLES, AuthorizationService } from './auth';
import { auditService } from './auditService';

class HotelDatabase {
  tenants: Tenant[] = [];
  users: User[] = [];
  roles: UserRoleDefinition[] = [];
  permissions: PermissionDefinition[] = [];
  properties: Property[] = [];
  roomTypes: RoomType[] = [];
  rooms: Room[] = [];
  guests: Guest[] = [];
  reservations: Reservation[] = [];
  availabilityOverrides: Record<string, Partial<DateAvailability>> = {}; // key: `${propertyId}_${roomTypeId}_${date}`
  channelConnections: ChannelConnection[] = [];
  channelRoomMappings: ChannelRoomMapping[] = [];
  syncLogs: SyncLog[] = [];
  housekeepingTasks: HousekeepingTask[] = [];
  maintenanceWorkOrders: MaintenanceWorkOrder[] = [];
  expenses: FinancialExpense[] = [];
  messages: Message[] = [];
  reviews: GuestReview[] = [];
  operationsTasks: OperationsTask[] = [];

  // Modular Hotel OS Entities
  modules: ModuleDefinition[] = [];
  tenantActivations: TenantModuleActivation[] = [];
  addons: SubscriptionAddon[] = [];
  auditLogs: AuditLogEntry[] = [];

  // SaaS Platform Administration Models & Sessions
  activeHotelAccessSessions: TemporaryHotelAccessSession[] = [];
  platformAuditLogs: PlatformAuditLog[] = [];
  platformSubscriptionPlans: PlatformSubscriptionPlan[] = [];
  platformInvoices: PlatformInvoice[] = [];
  platformApiClients: PlatformAPIClient[] = [];
  platformIntegrations: PlatformIntegrationService[] = [];
  platformSystemHealth: PlatformSystemHealth = {
    status: 'healthy',
    databaseStatus: 'connected',
    databaseLatencyMs: 3.8,
    backgroundQueues: [
      { name: 'ota-channel-sync', pendingJobs: 0, processed24h: 18420, failedJobs: 0 },
      { name: 'folio-auto-night-audit', pendingJobs: 0, processed24h: 3, failedJobs: 0 },
      { name: 'webhook-dispatch-queue', pendingJobs: 2, processed24h: 9410, failedJobs: 1 },
      { name: 'email-sms-notifications', pendingJobs: 0, processed24h: 1250, failedJobs: 0 },
    ],
    cpuUsage: 18.4,
    memoryUsage: 42.1,
    diskUsage: 28.6,
    activeWebsockets: 34,
    lastBackupAt: '2026-09-01T04:00:00Z',
  };
  platformSettings: Record<string, any> = {
    platformName: 'Vanguard PMS OS SaaS',
    supportEmail: 'support@vanguardpms.com',
    defaultCurrency: 'USD',
    enforceMfaForSuperAdmin: true,
    requireReasonForHotelAccess: true,
    maxHotelAccessSessionMinutes: 120,
    allowAutoOtaSync: true,
    stripeLiveMode: true,
    maintenanceMode: false,
    sessionTimeoutMins: 60,
  };

  // Operational Modules Data
  diningTables: DiningTable[] = [];
  menuItems: MenuItem[] = [];
  restaurantOrders: RestaurantOrder[] = [];
  kdsTickets: KDSTicket[] = [];
  poolFacilities: PoolFacility[] = [];
  poolTickets: PoolTicket[] = [];
  poolWaterLogs: PoolWaterQualityLog[] = [];
  inventoryLocations: InventoryLocation[] = [];
  inventoryProducts: InventoryProduct[] = [];
  stockMovements: StockMovement[] = [];
  suppliers: Supplier[] = [];
  purchaseOrders: PurchaseOrder[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const today = '2026-09-01';

    // 1. Tenants
    this.tenants = [
      {
        id: 'tenant-azure',
        name: 'Azure Hospitality Holdings',
        slug: 'azure-hospitality',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        maxProperties: 10,
        maxRooms: 150,
        createdAt: '2025-01-15T00:00:00Z',
      },
      {
        id: 'tenant-highland',
        name: 'Highland Alpine Retreats',
        slug: 'highland-alpine',
        subscriptionTier: 'professional',
        subscriptionStatus: 'active',
        maxProperties: 3,
        maxRooms: 40,
        createdAt: '2025-04-10T00:00:00Z',
      },
      {
        id: 'tenant-urban',
        name: 'Urban Loft Collection',
        slug: 'urban-loft',
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
        maxProperties: 1,
        maxRooms: 15,
        createdAt: '2025-08-01T00:00:00Z',
      },
    ];

    // 1.5 System Permissions & Roles Catalog
    this.permissions = [...PERMISSIONS_CATALOG];
    this.roles = [
      ...DEFAULT_ROLES,
      // Sample Tenant Custom Role
      {
        id: 'role-custom-night-audit',
        code: 'NIGHT_AUDITOR',
        name: 'Night Auditor & Security',
        description: 'Overnight operations, guest check-in, tape chart, night audit run, and maintenance emergency tickets.',
        category: 'custom',
        isSystem: false,
        tenantId: 'tenant-azure',
        defaultLandingView: 'frontdesk',
        allowedOutlets: ['*'],
        permissions: [
          'pms.tape_chart.view',
          'pms.rooms.view',
          'reservations.view',
          'reservations.check_in',
          'reservations.check_out',
          'folio.view',
          'folio.charge',
          'folio.payment_record',
          'finance.ledger_view',
          'maintenance.view',
          'maintenance.ticket_create',
          'audit.view'
        ]
      }
    ];

    // 2. Users (SaaS Platform Admins & Hotel Staff)
    this.users = [
      // SaaS Platform Team (Platform Context, NOT tied to any hotel)
      {
        id: 'usr-admin-1',
        tenantId: 'platform',
        name: 'Alexander Cross',
        email: 'alexander@vanguard-pms.io',
        role: 'SUPER_ADMIN',
        roleId: 'role-super-admin',
        department: 'Platform Architecture & Security',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 019-2831',
        scope: {
          tenantId: 'platform',
          propertyIds: [],
          outletIds: [],
          department: 'Platform Operations'
        },
        active: true,
        lastLoginAt: '2026-09-01T08:30:00Z',
      },
      {
        id: 'usr-plat-support',
        tenantId: 'platform',
        name: 'Maya Lin',
        email: 'maya.lin@vanguard-pms.io',
        role: 'SUPPORT_AGENT',
        roleId: 'role-support-agent',
        department: 'Customer Success & Support',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 019-3311',
        scope: {
          tenantId: 'platform',
          propertyIds: [],
          outletIds: [],
          department: 'Support'
        },
        active: true,
        lastLoginAt: '2026-09-01T09:00:00Z',
      },
      {
        id: 'usr-plat-finance',
        tenantId: 'platform',
        name: 'Robert Sterling',
        email: 'robert.s@vanguard-pms.io',
        role: 'FINANCE_ADMIN',
        roleId: 'role-finance-admin',
        department: 'SaaS Finance & Revenue',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 019-4422',
        scope: {
          tenantId: 'platform',
          propertyIds: [],
          outletIds: [],
          department: 'Finance'
        },
        active: true,
        lastLoginAt: '2026-09-01T08:15:00Z',
      },
      {
        id: 'usr-plat-tech',
        tenantId: 'platform',
        name: 'Jordan Rivera',
        email: 'jordan.r@vanguard-pms.io',
        role: 'TECHNICAL_ADMIN',
        roleId: 'role-technical-admin',
        department: 'Cloud Infrastructure & Integrations',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 019-5533',
        scope: {
          tenantId: 'platform',
          propertyIds: [],
          outletIds: [],
          department: 'Infrastructure'
        },
        active: true,
        lastLoginAt: '2026-09-01T07:45:00Z',
      },

      // Tenant 1: Grand Azure Bay Resort (Enterprise)
      {
        id: 'usr-owner-1',
        tenantId: 'tenant-azure',
        name: 'Elena Rostova',
        email: 'elena@azurehospitality.com',
        role: 'PROPERTY_OWNER',
        roleId: 'role-property-owner',
        department: 'Executive Board',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 012-9988',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['*'],
          outletIds: ['*'],
          department: 'management'
        },
        active: true,
        lastLoginAt: '2026-09-01T09:15:00Z',
      },
      {
        id: 'usr-mgr-1',
        tenantId: 'tenant-azure',
        name: 'Marcus Vance',
        email: 'marcus@azurehospitality.com',
        role: 'PROPERTY_MANAGER',
        roleId: 'role-property-manager',
        department: 'General Operations',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 018-7721',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay', 'prop-azure-villas'],
          outletIds: ['*'],
          department: 'management'
        },
        active: true,
        lastLoginAt: '2026-09-01T07:45:00Z',
      },
      {
        id: 'usr-fd-1',
        tenantId: 'tenant-azure',
        name: 'Sarah Jenkins',
        email: 'sarah.j@azurehospitality.com',
        role: 'FRONT_DESK',
        roleId: 'role-front-desk',
        department: 'Front Office',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 014-4421',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['*'],
          department: 'front_desk'
        },
        active: true,
        lastLoginAt: '2026-09-01T06:55:00Z',
      },
      {
        id: 'usr-hk-1',
        tenantId: 'tenant-azure',
        name: 'Maria Santos',
        email: 'maria.s@azurehospitality.com',
        role: 'HOUSEKEEPING',
        roleId: 'role-housekeeping',
        department: 'Housekeeping',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 017-3392',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['loc-hk'],
          department: 'housekeeping'
        },
        active: true,
        lastLoginAt: '2026-09-01T06:00:00Z',
      },
      {
        id: 'usr-maint-1',
        tenantId: 'tenant-azure',
        name: 'Kenji Sato',
        email: 'kenji.s@azurehospitality.com',
        role: 'MAINTENANCE',
        roleId: 'role-maintenance',
        department: 'Engineering & Facilities',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 016-1188',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['loc-maint'],
          department: 'maintenance'
        },
        active: true,
        lastLoginAt: '2026-09-01T07:10:00Z',
      },
      {
        id: 'usr-fin-1',
        tenantId: 'tenant-azure',
        name: 'David Sterling',
        email: 'david.s@azurehospitality.com',
        role: 'FINANCE',
        roleId: 'role-finance',
        department: 'Accounting & Finance',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 013-6677',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['*'],
          outletIds: ['*'],
          department: 'finance'
        },
        active: true,
        lastLoginAt: '2026-09-01T08:15:00Z',
      },
      {
        id: 'usr-cm-1',
        tenantId: 'tenant-azure',
        name: 'Chloe Laurent',
        email: 'chloe.l@azurehospitality.com',
        role: 'CHANNEL_MANAGER',
        roleId: 'role-channel-manager',
        department: 'Revenue & Distribution',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 015-8833',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['*'],
          outletIds: ['*'],
          department: 'distribution'
        },
        active: true,
        lastLoginAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'usr-fnb-1',
        tenantId: 'tenant-azure',
        name: 'Laurent Moreau',
        email: 'laurent.m@azurehospitality.com',
        role: 'FNB_MANAGER',
        roleId: 'role-fnb-manager',
        department: 'Food & Beverage',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 019-4455',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['restaurant-main', 'bar-rooftop'],
          department: 'fnb'
        },
        active: true,
        lastLoginAt: '2026-09-01T11:00:00Z',
      },
      {
        id: 'usr-chef-1',
        tenantId: 'tenant-azure',
        name: 'Chef Antoine Blanc',
        email: 'antoine.b@azurehospitality.com',
        role: 'KITCHEN_CHEF',
        roleId: 'role-kitchen-chef',
        department: 'Culinary & Kitchen',
        avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 018-9922',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['loc-kitchen'],
          department: 'kitchen'
        },
        active: true,
        lastLoginAt: '2026-09-01T10:30:00Z',
      },
      {
        id: 'usr-pool-1',
        tenantId: 'tenant-azure',
        name: 'Kai Takahashi',
        email: 'kai.t@azurehospitality.com',
        role: 'POOL_ATTENDANT',
        roleId: 'role-pool-attendant',
        department: 'Leisure & Recreation',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 011-5544',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['pool-main'],
          department: 'leisure'
        },
        active: true,
        lastLoginAt: '2026-09-01T09:00:00Z',
      },
      {
        id: 'usr-inv-1',
        tenantId: 'tenant-azure',
        name: 'Rachel Rivera',
        email: 'rachel.r@azurehospitality.com',
        role: 'INVENTORY_MANAGER',
        roleId: 'role-inventory-manager',
        department: 'Procurement & Supply',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 012-7733',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay', 'prop-azure-villas'],
          outletIds: ['loc-wh', 'loc-kitchen', 'loc-hk'],
          department: 'inventory'
        },
        active: true,
        lastLoginAt: '2026-09-01T07:30:00Z',
      },
      {
        id: 'usr-night-1',
        tenantId: 'tenant-azure',
        name: 'Oliver Thorne',
        email: 'oliver.t@azurehospitality.com',
        role: 'CUSTOM_ROLE',
        roleId: 'role-custom-night-audit',
        customRoleName: 'Night Auditor & Security',
        department: 'Front Office (Night)',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
        phone: '+1 (555) 013-8899',
        scope: {
          tenantId: 'tenant-azure',
          propertyIds: ['prop-azure-bay'],
          outletIds: ['*'],
          department: 'front_desk'
        },
        active: true,
        lastLoginAt: '2026-09-01T23:00:00Z',
      },

      // Tenant 2: Highland Alpine Resorts
      {
        id: 'usr-owner-highland',
        tenantId: 'tenant-highland',
        name: 'David MacLeod',
        email: 'david@highlandalpine.com',
        role: 'PROPERTY_OWNER',
        roleId: 'role-property-owner',
        department: 'Executive Board',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        phone: '+44 131 496 0123',
        scope: {
          tenantId: 'tenant-highland',
          propertyIds: ['*'],
          outletIds: ['*'],
          department: 'management'
        },
        active: true,
        lastLoginAt: '2026-09-01T08:00:00Z',
      },

      // Tenant 3: Urban Loft Collection
      {
        id: 'usr-owner-urban',
        tenantId: 'tenant-urban',
        name: 'Chloe Dubois',
        email: 'chloe@urbanloftcollection.com',
        role: 'PROPERTY_OWNER',
        roleId: 'role-property-owner',
        department: 'Executive Board',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
        phone: '+33 1 42 68 55 00',
        scope: {
          tenantId: 'tenant-urban',
          propertyIds: ['*'],
          outletIds: ['*'],
          department: 'management'
        },
        active: true,
        lastLoginAt: '2026-09-01T09:30:00Z',
      },
    ];

    // 3. Properties
    this.properties = [
      {
        id: 'prop-azure-bay',
        tenantId: 'tenant-azure',
        name: 'Grand Azure Bay Resort & Spa',
        code: 'GABR',
        address: '840 Coastal Boulevard',
        city: 'Miami Beach',
        country: 'United States',
        postalCode: '33139',
        phone: '+1 (305) 555-0199',
        email: 'reservations@grandazurebay.com',
        website: 'https://grandazurebay.com',
        currency: 'USD',
        timezone: 'America/New_York',
        description: 'Luxury oceanfront resort featuring 24 suites, infinity pools, fine dining, and private beach access.',
        heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        starRating: 5,
        policies: {
          checkInTime: '15:00',
          checkOutTime: '11:00',
          cancellationHours: 48,
          cancellationPolicy: 'Free cancellation up to 48 hours prior to arrival. Late cancellations incur a 1-night charge.',
          petsAllowed: true,
          smokingAllowed: false,
        },
        taxes: [
          { id: 'tax-vat', name: 'State Sales Tax', type: 'percentage', amount: 7.0, includedInPrice: false },
          { id: 'tax-city', name: 'City Resort & Tourism Tax', type: 'percentage', amount: 6.0, includedInPrice: false },
        ],
        fees: [
          { id: 'fee-resort', name: 'Daily Resort Amenity Fee', type: 'fixed_per_night', amount: 35.0 },
          { id: 'fee-clean', name: 'Departure Housekeeping Fee', type: 'fixed_per_stay', amount: 50.0 },
        ],
      },
      {
        id: 'prop-azure-villas',
        tenantId: 'tenant-azure',
        name: 'Azure Beachfront Villas',
        code: 'ABV',
        address: '102 Palms Key Way',
        city: 'Key West',
        country: 'United States',
        postalCode: '33040',
        phone: '+1 (305) 555-0442',
        email: 'villas@azurehospitality.com',
        currency: 'USD',
        timezone: 'America/New_York',
        description: 'Secluded private beachfront villas with private plunge pools and butler service.',
        heroImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        starRating: 5,
        policies: {
          checkInTime: '16:00',
          checkOutTime: '11:00',
          cancellationHours: 72,
          cancellationPolicy: '72-hour notice required.',
          petsAllowed: false,
          smokingAllowed: false,
        },
        taxes: [
          { id: 'tax-vat2', name: 'Florida Sales Tax', type: 'percentage', amount: 7.5, includedInPrice: false },
        ],
        fees: [
          { id: 'fee-clean2', name: 'Villa Cleaning Fee', type: 'fixed_per_stay', amount: 120.0 },
        ],
      },
      {
        id: 'prop-highland-lodge',
        tenantId: 'tenant-highland',
        name: 'Highland Alpine Lodge',
        code: 'HAL',
        address: '420 Mountain Pass Road',
        city: 'Aspen',
        country: 'United States',
        postalCode: '81611',
        phone: '+1 (970) 555-0320',
        email: 'stay@highlandalpine.com',
        currency: 'USD',
        timezone: 'America/Denver',
        description: 'Rustic luxury ski-in/ski-out lodge with wood-burning fireplaces and thermal hot springs.',
        heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        starRating: 4,
        policies: {
          checkInTime: '15:00',
          checkOutTime: '10:00',
          cancellationHours: 72,
          cancellationPolicy: 'Winter season requires 7-day cancellation notice.',
          petsAllowed: true,
          smokingAllowed: false,
        },
        taxes: [
          { id: 'tax-co', name: 'Colorado Lodging Tax', type: 'percentage', amount: 9.3, includedInPrice: false },
        ],
        fees: [
          { id: 'fee-ski', name: 'Ski Locker & Valet Fee', type: 'fixed_per_night', amount: 25.0 },
        ],
      },
    ];

    // 4. Room Types (Grand Azure Bay Resort)
    this.roomTypes = [
      {
        id: 'rt-ocean-suite',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        name: 'Deluxe Oceanfront Suite',
        code: 'DOS',
        description: 'King bed, panoramic balcony with direct Atlantic ocean views, marble jacuzzi bath.',
        baseOccupancy: 2,
        maxAdults: 3,
        maxChildren: 1,
        baseRate: 380.0,
        weekendRate: 440.0,
        bedConfiguration: '1 King Bed + 1 Queen Sofa Bed',
        amenities: ['Ocean View', 'Balcony', 'Jacuzzi', 'Nespresso', 'High-Speed Wi-Fi', 'Room Service'],
        totalUnits: 4,
      },
      {
        id: 'rt-exec-king',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        name: 'Executive King Room',
        code: 'EKR',
        description: 'Spacious 450 sq ft room with plush king bed, ergonomic desk, and rainfall shower.',
        baseOccupancy: 2,
        maxAdults: 2,
        maxChildren: 1,
        baseRate: 260.0,
        weekendRate: 310.0,
        bedConfiguration: '1 King Bed',
        amenities: ['City/Garden View', 'Mini Bar', 'Smart TV', 'Workstation', 'Luxury Linens'],
        totalUnits: 6,
      },
      {
        id: 'rt-garden-villa',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        name: 'Garden Pool Villa',
        code: 'GPV',
        description: 'Private 800 sq ft standalone villa surrounded by tropical gardens with plunge pool.',
        baseOccupancy: 4,
        maxAdults: 4,
        maxChildren: 2,
        baseRate: 590.0,
        weekendRate: 680.0,
        bedConfiguration: '2 King Beds',
        amenities: ['Private Pool', 'Outdoor Shower', 'Garden Patio', 'Butler Service', 'Kitchenette'],
        totalUnits: 3,
      },
      {
        id: 'rt-penthouse',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        name: 'Presidential Penthouse',
        code: 'PPH',
        description: '2,200 sq ft top-floor residence with wrap-around terrace, grand piano, and private chef kitchen.',
        baseOccupancy: 6,
        maxAdults: 6,
        maxChildren: 3,
        baseRate: 1450.0,
        weekendRate: 1650.0,
        bedConfiguration: '3 King Bedrooms + Living Suite',
        amenities: ['Private Elevator', '360 Terrace', 'Full Kitchen', 'Private Sauna', 'Dedicated Concierge'],
        totalUnits: 1,
      },
    ];

    // 5. Individual Physical Rooms
    this.rooms = [
      // Deluxe Ocean Suites
      { id: 'rm-101', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-ocean-suite', roomNumber: '101', floor: '1', status: 'clean', isOccupied: false, keyCardCode: 'KC-101-A' },
      { id: 'rm-102', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-ocean-suite', roomNumber: '102', floor: '1', status: 'occupied', isOccupied: true, currentGuestName: 'Dr. Arthur Pendelton', keyCardCode: 'KC-102-B' },
      { id: 'rm-103', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-ocean-suite', roomNumber: '103', floor: '1', status: 'dirty', isOccupied: false, keyCardCode: 'KC-103-A' },
      { id: 'rm-104', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-ocean-suite', roomNumber: '104', floor: '1', status: 'inspected', isOccupied: false, keyCardCode: 'KC-104-A' },

      // Executive King
      { id: 'rm-201', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '201', floor: '2', status: 'occupied', isOccupied: true, currentGuestName: 'Jessica Sterling', keyCardCode: 'KC-201-B' },
      { id: 'rm-202', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '202', floor: '2', status: 'clean', isOccupied: false, keyCardCode: 'KC-202-A' },
      { id: 'rm-203', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '203', floor: '2', status: 'occupied', isOccupied: true, currentGuestName: 'Lucas Lindqvist', keyCardCode: 'KC-203-A' },
      { id: 'rm-204', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '204', floor: '2', status: 'dirty', isOccupied: false, keyCardCode: 'KC-204-C' },
      { id: 'rm-205', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '205', floor: '2', status: 'clean', isOccupied: false, keyCardCode: 'KC-205-A' },
      { id: 'rm-206', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-exec-king', roomNumber: '206', floor: '2', status: 'maintenance', isOccupied: false, keyCardCode: 'KC-206-X', notes: 'AC thermostat capacitor replacement' },

      // Garden Villas
      { id: 'rm-301', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-garden-villa', roomNumber: 'Villa 1', floor: 'Ground', status: 'occupied', isOccupied: true, currentGuestName: 'Sebastian Croft', keyCardCode: 'V-01-SMART' },
      { id: 'rm-302', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-garden-villa', roomNumber: 'Villa 2', floor: 'Ground', status: 'clean', isOccupied: false, keyCardCode: 'V-02-SMART' },
      { id: 'rm-303', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-garden-villa', roomNumber: 'Villa 3', floor: 'Ground', status: 'out_of_order', isOccupied: false, keyCardCode: 'V-03-LOCK', notes: 'Plunge pool relining scheduled' },

      // Presidential Penthouse
      { id: 'rm-401', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomTypeId: 'rt-penthouse', roomNumber: 'PH-401', floor: 'Top', status: 'clean', isOccupied: false, keyCardCode: 'PH-VIP-1' },
    ];

    // 6. Guests CRM Profiles
    this.guests = [
      {
        id: 'gst-1',
        tenantId: 'tenant-azure',
        firstName: 'Arthur',
        lastName: 'Pendelton',
        email: 'arthur.pendelton@oxford.ac.uk',
        phone: '+44 7700 900142',
        nationality: 'United Kingdom',
        idPassportNumber: 'UK-99214081',
        idType: 'passport',
        vip: true,
        totalStays: 4,
        lifetimeSpend: 4280.0,
        specialRequests: 'High floor, hypoallergenic pillows, quiet wing.',
        notes: 'Loyal corporate guest. Prefers sparkling water in room at check-in.',
        createdAt: '2025-02-10T14:30:00Z',
      },
      {
        id: 'gst-2',
        tenantId: 'tenant-azure',
        firstName: 'Jessica',
        lastName: 'Sterling',
        email: 'jessica.sterling@vanguardtech.co',
        phone: '+1 (415) 555-8910',
        nationality: 'United States',
        idPassportNumber: 'USA-4410982',
        idType: 'driver_license',
        vip: false,
        totalStays: 1,
        lifetimeSpend: 1140.0,
        specialRequests: 'Early check-in requested if available.',
        notes: 'Booked via Booking.com. Validated corporate card.',
        createdAt: '2026-08-20T09:15:00Z',
      },
      {
        id: 'gst-3',
        tenantId: 'tenant-azure',
        firstName: 'Lucas',
        lastName: 'Lindqvist',
        email: 'lucas.lindqvist@stockholmair.se',
        phone: '+46 8 123 4567',
        nationality: 'Sweden',
        idPassportNumber: 'SWE-8830114',
        idType: 'passport',
        vip: false,
        totalStays: 2,
        lifetimeSpend: 1850.0,
        specialRequests: 'Late arrival (approx 21:00).',
        notes: 'Airbnb instant reservation.',
        createdAt: '2026-08-24T18:00:00Z',
      },
      {
        id: 'gst-4',
        tenantId: 'tenant-azure',
        firstName: 'Sebastian',
        lastName: 'Croft',
        email: 'sebastian.croft@manorfilms.com',
        phone: '+1 (310) 555-0912',
        nationality: 'United States',
        idPassportNumber: 'USA-7721890',
        idType: 'passport',
        vip: true,
        totalStays: 3,
        lifetimeSpend: 7800.0,
        specialRequests: 'Discretion requested. Private villa plunge pool temperature set to 86°F.',
        notes: 'VIP film director. Direct phone bookings.',
        createdAt: '2025-06-11T12:00:00Z',
      },
      {
        id: 'gst-5',
        tenantId: 'tenant-azure',
        firstName: 'Camilla',
        lastName: 'Duarte',
        email: 'c.duarte@riodesign.br',
        phone: '+55 21 98765-4321',
        nationality: 'Brazil',
        idPassportNumber: 'BRA-332901',
        idType: 'passport',
        vip: false,
        totalStays: 1,
        lifetimeSpend: 890.0,
        specialRequests: 'Twin beds if possible.',
        createdAt: '2026-08-28T11:00:00Z',
      },
    ];

    // 7. Reservations (Realistic dates spanning August to September 2026)
    this.reservations = [
      {
        id: 'res-001',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0891',
        guestId: 'gst-1',
        guest: this.guests[0],
        roomTypeId: 'rt-ocean-suite',
        roomId: 'rm-102',
        checkIn: '2026-08-30',
        checkOut: '2026-09-03',
        adults: 2,
        children: 0,
        source: 'booking_com',
        channelReservationId: 'BCOM-892174620',
        status: 'checked_in',
        paymentStatus: 'paid',
        nightlyRate: 380.0,
        totalNights: 4,
        subtotal: 1520.0,
        taxAmount: 197.6,
        feeAmount: 190.0,
        totalAmount: 1907.6,
        paidAmount: 1907.6,
        balanceDue: 0.0,
        folio: [
          { id: 'f-1', date: '2026-08-30', description: 'Room Charge - Deluxe Ocean Suite (Night 1)', category: 'room', amount: 380.0, quantity: 1 },
          { id: 'f-2', date: '2026-08-31', description: 'Room Charge - Deluxe Ocean Suite (Night 2)', category: 'room', amount: 380.0, quantity: 1 },
          { id: 'f-3', date: '2026-09-01', description: 'Room Charge - Deluxe Ocean Suite (Night 3)', category: 'room', amount: 380.0, quantity: 1 },
          { id: 'f-4', date: '2026-09-02', description: 'Room Charge - Deluxe Ocean Suite (Night 4)', category: 'room', amount: 380.0, quantity: 1 },
          { id: 'f-5', date: '2026-08-30', description: 'Combined State & City Taxes', category: 'tax', amount: 197.6, quantity: 1 },
          { id: 'f-6', date: '2026-08-30', description: 'Resort & Cleaning Fees', category: 'fee', amount: 190.0, quantity: 1 },
        ],
        payments: [
          { id: 'p-1', date: '2026-08-30', amount: 1907.6, method: 'ota_virtual_card', reference: 'VC-BCOM-9912' },
        ],
        specialRequests: 'Champagne on ice at 17:00.',
        createdAt: '2026-08-15T10:30:00Z',
        updatedAt: '2026-08-30T15:10:00Z',
      },
      {
        id: 'res-002',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0892',
        guestId: 'gst-2',
        guest: this.guests[1],
        roomTypeId: 'rt-exec-king',
        roomId: 'rm-201',
        checkIn: '2026-08-31',
        checkOut: '2026-09-02',
        adults: 1,
        children: 0,
        source: 'direct',
        status: 'checked_in',
        paymentStatus: 'paid',
        nightlyRate: 260.0,
        totalNights: 2,
        subtotal: 520.0,
        taxAmount: 67.6,
        feeAmount: 120.0,
        totalAmount: 707.6,
        paidAmount: 707.6,
        balanceDue: 0.0,
        folio: [
          { id: 'f-201', date: '2026-08-31', description: 'Room Charge - Executive King (Night 1)', category: 'room', amount: 260.0, quantity: 1 },
          { id: 'f-202', date: '2026-09-01', description: 'Room Charge - Executive King (Night 2)', category: 'room', amount: 260.0, quantity: 1 },
          { id: 'f-203', date: '2026-08-31', description: 'Taxes & Fees', category: 'tax', amount: 187.6, quantity: 1 },
        ],
        payments: [
          { id: 'p-201', date: '2026-08-31', amount: 707.6, method: 'credit_card', reference: 'AUTH-VISA-8821' },
        ],
        createdAt: '2026-08-20T09:15:00Z',
        updatedAt: '2026-08-31T14:45:00Z',
      },
      {
        id: 'res-003',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0893',
        guestId: 'gst-3',
        guest: this.guests[2],
        roomTypeId: 'rt-exec-king',
        roomId: 'rm-203',
        checkIn: '2026-09-01',
        checkOut: '2026-09-04',
        adults: 2,
        children: 0,
        source: 'airbnb',
        channelReservationId: 'HMABNB-99042',
        status: 'confirmed', // Arriving Today!
        paymentStatus: 'paid',
        nightlyRate: 260.0,
        totalNights: 3,
        subtotal: 780.0,
        taxAmount: 101.4,
        feeAmount: 155.0,
        totalAmount: 1036.4,
        paidAmount: 1036.4,
        balanceDue: 0.0,
        folio: [
          { id: 'f-301', date: '2026-09-01', description: 'Room Charge - Executive King (3 nights)', category: 'room', amount: 780.0, quantity: 1 },
          { id: 'f-302', date: '2026-09-01', description: 'Airbnb Channel Payout Package', category: 'fee', amount: 256.4, quantity: 1 },
        ],
        payments: [
          { id: 'p-301', date: '2026-09-01', amount: 1036.4, method: 'bank_transfer', reference: 'AIRBNB-PAYOUT-902' },
        ],
        estimatedArrivalTime: '19:30',
        createdAt: '2026-08-24T18:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'res-004',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0894',
        guestId: 'gst-4',
        guest: this.guests[3],
        roomTypeId: 'rt-garden-villa',
        roomId: 'rm-301',
        checkIn: '2026-08-29',
        checkOut: '2026-09-05',
        adults: 3,
        children: 1,
        source: 'phone',
        status: 'checked_in',
        paymentStatus: 'partially_paid',
        nightlyRate: 590.0,
        totalNights: 7,
        subtotal: 4130.0,
        taxAmount: 536.9,
        feeAmount: 295.0,
        totalAmount: 4961.9,
        paidAmount: 2500.0,
        balanceDue: 2461.9,
        folio: [
          { id: 'f-401', date: '2026-08-29', description: 'Villa Rental (7 Nights)', category: 'room', amount: 4130.0, quantity: 1 },
          { id: 'f-402', date: '2026-08-30', description: 'Private Sommelier Wine Tasting', category: 'fnb', amount: 450.0, quantity: 1 },
          { id: 'f-403', date: '2026-08-29', description: 'Taxes & Fees', category: 'tax', amount: 831.9, quantity: 1 },
        ],
        payments: [
          { id: 'p-401', date: '2026-08-29', amount: 2500.0, method: 'credit_card', reference: 'AMEX-VIP-0021' },
        ],
        createdAt: '2026-08-10T11:00:00Z',
        updatedAt: '2026-08-29T16:00:00Z',
      },
      {
        id: 'res-005',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0895',
        guestId: 'gst-5',
        guest: this.guests[4],
        roomTypeId: 'rt-ocean-suite',
        roomId: 'rm-104',
        checkIn: '2026-09-02',
        checkOut: '2026-09-06',
        adults: 2,
        children: 0,
        source: 'expedia',
        channelReservationId: 'EXP-11094821',
        status: 'confirmed',
        paymentStatus: 'paid',
        nightlyRate: 380.0,
        totalNights: 4,
        subtotal: 1520.0,
        taxAmount: 197.6,
        feeAmount: 190.0,
        totalAmount: 1907.6,
        paidAmount: 1907.6,
        balanceDue: 0.0,
        folio: [],
        payments: [],
        createdAt: '2026-08-28T11:00:00Z',
        updatedAt: '2026-08-28T11:00:00Z',
      },
      {
        id: 'res-006',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        reservationCode: 'GABR-2026-0896',
        guestId: 'gst-1',
        guest: this.guests[0],
        roomTypeId: 'rt-penthouse',
        roomId: 'rm-401',
        checkIn: '2026-09-10',
        checkOut: '2026-09-14',
        adults: 4,
        children: 0,
        source: 'direct',
        status: 'confirmed',
        paymentStatus: 'partially_paid',
        nightlyRate: 1450.0,
        totalNights: 4,
        subtotal: 5800.0,
        taxAmount: 754.0,
        feeAmount: 350.0,
        totalAmount: 6904.0,
        paidAmount: 3452.0,
        balanceDue: 3452.0,
        folio: [],
        payments: [
          { id: 'p-601', date: '2026-08-25', amount: 3452.0, method: 'credit_card', reference: '50%-DEPOSIT-STRIPE' },
        ],
        createdAt: '2026-08-25T14:00:00Z',
        updatedAt: '2026-08-25T14:00:00Z',
      },
    ];

    // 8. Channel Connections
    this.channelConnections = [
      {
        id: 'conn-bcom',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'booking_com',
        channelName: 'Booking.com BAPI',
        accountIdentifier: 'hotel_881923_gab',
        hotelIdOnChannel: '881923',
        apiKeyMasked: 'bk_live_••••••••••••89A2',
        isConnected: true,
        syncRates: true,
        syncAvailability: true,
        syncReservations: true,
        syncStatus: 'synced',
        lastSyncTime: '2026-09-01T14:30:00Z',
      },
      {
        id: 'conn-abnb',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'airbnb',
        channelName: 'Airbnb Host API',
        accountIdentifier: 'host_azure_holdings',
        apiKeyMasked: 'abnb_oauth_••••••••••••101F',
        isConnected: true,
        syncRates: true,
        syncAvailability: true,
        syncReservations: true,
        syncStatus: 'synced',
        lastSyncTime: '2026-09-01T14:45:00Z',
      },
      {
        id: 'conn-exp',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'expedia',
        channelName: 'Expedia QuickConnect (EQC)',
        accountIdentifier: 'EQC_339101',
        hotelIdOnChannel: 'EXP-99210',
        apiKeyMasked: 'eqc_key_••••••••••••774B',
        isConnected: true,
        syncRates: true,
        syncAvailability: true,
        syncReservations: true,
        syncStatus: 'synced',
        lastSyncTime: '2026-09-01T13:10:00Z',
      },
      {
        id: 'conn-agoda',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'agoda',
        channelName: 'Agoda YCS',
        isConnected: false,
        syncRates: false,
        syncAvailability: false,
        syncReservations: false,
        syncStatus: 'disconnected',
      },
      {
        id: 'conn-hw',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'hostelworld',
        channelName: 'Hostelworld Inbox',
        isConnected: false,
        syncRates: false,
        syncAvailability: false,
        syncReservations: false,
        syncStatus: 'disconnected',
      },
      {
        id: 'conn-ical',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'ical',
        channelName: 'iCalendar Two-Way Sync',
        iCalExportUrl: '/api/ical/tenant-azure/prop-azure-bay/rt-ocean-suite/calendar.ics',
        iCalImportUrl: 'https://calendar.vrbo.com/ical/feed_mock_992.ics',
        isConnected: true,
        syncRates: false,
        syncAvailability: true,
        syncReservations: true,
        syncStatus: 'synced',
        lastSyncTime: '2026-09-01T12:00:00Z',
      },
      {
        id: 'conn-nobeds',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        channelId: 'nobeds',
        channelName: 'NOBEDS API v2 Gateway',
        accountIdentifier: 'nobeds_tenant_azure_live',
        apiKeyMasked: 'nb_live_••••••••••••911C',
        isConnected: true,
        syncRates: true,
        syncAvailability: true,
        syncReservations: true,
        syncStatus: 'synced',
        lastSyncTime: '2026-09-01T14:15:00Z',
      },
    ];

    // 9. Channel Room Mappings
    this.channelRoomMappings = [
      { id: 'crm-1', channelConnectionId: 'conn-bcom', channelId: 'booking_com', internalRoomTypeId: 'rt-ocean-suite', externalRoomTypeId: 'BCOM_ROOM_4401', externalRoomTypeName: 'Deluxe Suite Ocean View (B.com #4401)', rateMultiplier: 1.0 },
      { id: 'crm-2', channelConnectionId: 'conn-bcom', channelId: 'booking_com', internalRoomTypeId: 'rt-exec-king', externalRoomTypeId: 'BCOM_ROOM_4402', externalRoomTypeName: 'Executive King (B.com #4402)', rateMultiplier: 1.0 },
      { id: 'crm-3', channelConnectionId: 'conn-abnb', channelId: 'airbnb', internalRoomTypeId: 'rt-garden-villa', externalRoomTypeId: 'ABNB_LISTING_99210', externalRoomTypeName: 'Private Pool Villa Paradise (Airbnb)', rateMultiplier: 1.10 },
      { id: 'crm-4', channelConnectionId: 'conn-exp', channelId: 'expedia', internalRoomTypeId: 'rt-ocean-suite', externalRoomTypeId: 'EXP_RM_771', externalRoomTypeName: 'Suite, Oceanfront (Expedia)', rateMultiplier: 1.05 },
    ];

    // 10. Sync Logs
    this.syncLogs = [
      { id: 'log-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', channelId: 'booking_com', direction: 'outbound', action: 'push_availability', status: 'success', recordsAffected: 30, payloadSummary: 'Pushed 30-day inventory matrix for 4 room types to Booking.com BAPI', timestamp: '2026-09-01T14:30:12Z' },
      { id: 'log-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', channelId: 'airbnb', direction: 'outbound', action: 'push_rates', status: 'success', recordsAffected: 14, payloadSummary: 'Updated weekend dynamic rate rules (+15%) on Airbnb API v2', timestamp: '2026-09-01T14:45:00Z' },
      { id: 'log-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', channelId: 'ical', direction: 'inbound', action: 'ical_import', status: 'success', recordsAffected: 0, payloadSummary: 'Polled VRBO external calendar feed: 0 new blocking events found', timestamp: '2026-09-01T12:00:15Z' },
      { id: 'log-4', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', channelId: 'nobeds', direction: 'outbound', action: 'push_availability', status: 'success', recordsAffected: 12, payloadSummary: 'Synchronized availability slots with NOBEDS Swagger OpenAPI Gateway', timestamp: '2026-09-01T14:15:22Z' },
    ];

    // 11. Housekeeping Tasks
    this.housekeepingTasks = [
      { id: 'hk-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-103', roomNumber: '103', roomTypeName: 'Deluxe Ocean Suite', taskType: 'full_clean', priority: 'high', status: 'pending', assignedStaffName: 'Maria Santos', dueDate: '2026-09-01T16:00:00Z', notes: 'Arrival arriving at 17:00. Restock luxury bathrobes.' },
      { id: 'hk-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-204', roomNumber: '204', roomTypeName: 'Executive King Room', taskType: 'touch_up', priority: 'medium', status: 'in_progress', assignedStaffName: 'Carlos Ray', dueDate: '2026-09-01T15:00:00Z', notes: 'Dusting and balcony glass polish.' },
      { id: 'hk-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-104', roomNumber: '104', roomTypeName: 'Deluxe Ocean Suite', taskType: 'inspection', priority: 'medium', status: 'completed', assignedStaffName: 'Maria Santos', dueDate: '2026-09-01T11:00:00Z', notes: 'Inspected and certified for VIP arrival tomorrow.' },
    ];

    // 12. Maintenance Work Orders
    this.maintenanceWorkOrders = [
      { id: 'maint-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-206', roomNumber: '206', title: 'HVAC Compressor Thermostat Replacement', category: 'hvac', priority: 'high', status: 'in_progress', roomBlocked: true, reportedBy: 'Sarah Jenkins', assignedTo: 'Kenji Sato', costEstimate: 240.0, reportedAt: '2026-08-31T09:00:00Z', description: 'AC unit in 206 blowing ambient air. Replacement thermostat ordered and arriving today.' },
      { id: 'maint-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-303', roomNumber: 'Villa 3', title: 'Plunge Pool Mosaic Relining & Filtration Check', category: 'plumbing', priority: 'medium', status: 'open', roomBlocked: true, reportedBy: 'Marcus Vance', assignedTo: 'Apex Pools Contractor', costEstimate: 850.0, reportedAt: '2026-08-28T14:00:00Z', description: 'Annual relining of private plunge pool basin. Scheduled for completion Sept 5.' },
      { id: 'maint-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', roomId: 'rm-101', roomNumber: '101', title: 'Balcony Sliding Door Track Lubrication', category: 'structural', priority: 'low', status: 'resolved', roomBlocked: false, reportedBy: 'Maria Santos', assignedTo: 'Kenji Sato', costEstimate: 25.0, reportedAt: '2026-08-30T10:00:00Z', resolvedAt: '2026-08-30T14:30:00Z', description: 'Track cleaned and silicone lubricated.' },
    ];

    // 13. Financial Expenses
    this.expenses = [
      { id: 'exp-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', category: 'ota_commissions', amount: 580.0, date: '2026-08-31', vendor: 'Booking.com BV', paymentMethod: 'Direct Debit', reference: 'INV-BCOM-AUG26' },
      { id: 'exp-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', category: 'supplies', amount: 920.0, date: '2026-08-25', vendor: 'Luxe Hotel Amenities Co.', paymentMethod: 'Corporate Credit Card', reference: 'PO-9912' },
      { id: 'exp-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', category: 'utilities', amount: 1450.0, date: '2026-08-20', vendor: 'Florida Power & Light', paymentMethod: 'Bank Transfer', reference: 'BILL-FPL-0826' },
      { id: 'exp-4', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', category: 'payroll', amount: 4800.0, date: '2026-08-31', vendor: 'Staff Payroll Bi-Weekly', paymentMethod: 'Direct Deposit', reference: 'PAYROLL-2026-17' },
    ];

    // 14. Messages
    this.messages = [
      { id: 'msg-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', reservationId: 'res-001', guestId: 'gst-1', guestName: 'Dr. Arthur Pendelton', channel: 'booking_com', sender: 'guest', content: 'Hello front desk, could we request two extra espresso pods for the room machine tomorrow morning? Thank you!', timestamp: '2026-09-01T13:45:00Z', read: true },
      { id: 'msg-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', reservationId: 'res-001', guestId: 'gst-1', guestName: 'Dr. Arthur Pendelton', channel: 'booking_com', sender: 'hotel', content: 'Good afternoon Dr. Pendelton! Absolutely, housekeeping has just replenished your Nespresso supply. Let us know if you need anything else.', timestamp: '2026-09-01T13:52:00Z', read: true },
      { id: 'msg-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', reservationId: 'res-003', guestId: 'gst-3', guestName: 'Lucas Lindqvist', channel: 'airbnb', sender: 'guest', content: 'Hi! Our flight lands around 18:30, will check-in still be open at 19:30?', timestamp: '2026-09-01T11:20:00Z', read: false },
    ];

    // 15. Reviews
    this.reviews = [
      { id: 'rev-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', reservationId: 'res-001', guestName: 'Dr. Arthur Pendelton', source: 'booking_com', rating: 9.8, title: 'Spectacular coastal retreat with world-class hospitality', comment: 'The view from the Deluxe Ocean Suite is unmatched. Staff were discreet and attentive. Will be returning for my third corporate stay next month.', stayDate: '2026-07-15', hotelResponse: 'Thank you so much Dr. Pendelton! It is always our distinct pleasure to welcome you back to Grand Azure Bay.', responseDate: '2026-07-16', status: 'published' },
      { id: 'rev-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', guestName: 'Amanda Richardson', source: 'direct', rating: 9.5, title: 'Exceeded every expectation for our anniversary', comment: 'The private pool villa was immaculate and the chef tasting menu was memorable.', stayDate: '2026-08-10', status: 'published' },
      { id: 'rev-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', guestName: 'Carlos Mendez', source: 'expedia', rating: 8.4, title: 'Great location and rooms, valet parking was busy on weekend', comment: 'Rooms are modern and clean. Valet was a bit slow on Sunday morning.', stayDate: '2026-08-22', status: 'pending_response' },
    ];

    // 16. Operations Tasks
    this.operationsTasks = [
      { id: 'task-1', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', title: 'Prepare VIP welcome letter & champagne for Penthouse reservation', department: 'front_desk', assignedTo: 'Sarah Jenkins', priority: 'high', status: 'todo', dueDate: '2026-09-09', relatedReservationId: 'res-006' },
      { id: 'task-2', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', title: 'Complete monthly OTA commission reconciliation with Booking.com', department: 'finance', assignedTo: 'David Sterling', priority: 'medium', status: 'in_progress', dueDate: '2026-09-05' },
      { id: 'task-3', tenantId: 'tenant-azure', propertyId: 'prop-azure-bay', title: 'Audit weekend rate multipliers for upcoming Columbus Day holiday', department: 'management', assignedTo: 'Chloe Laurent', priority: 'medium', status: 'todo', dueDate: '2026-09-03' },
    ];

    // ==========================================
    // 17. MODULE REGISTRY (PLATFORM-DEFINED)
    // ==========================================
    this.modules = [
      // Core PMS
      {
        id: 'mod-pms',
        code: 'PMS',
        name: 'Core PMS & Tape Chart',
        description: 'Multi-property room inventory, tape chart calendar, front desk operations and live room status matrix.',
        category: 'core_pms',
        icon: 'CalendarDays',
        version: '2.4.0',
        featureKey: 'feature.core_pms',
        dependencies: [],
        sortOrder: 1,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
      {
        id: 'mod-reservations',
        code: 'RESERVATIONS',
        name: 'Reservations & Booking Engine',
        description: 'Direct booking intake, reservation ledger, guest check-in/out workflows, and rate assignment.',
        category: 'core_pms',
        icon: 'BookOpenCheck',
        version: '2.4.0',
        featureKey: 'feature.reservations',
        dependencies: ['PMS'],
        sortOrder: 2,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
      {
        id: 'mod-guest-management',
        code: 'GUEST_MANAGEMENT',
        name: 'Guest CRM & Profiles',
        description: 'Comprehensive guest profile database, VIP tagging, stay history, lifetime spend tracking, and preferences.',
        category: 'core_pms',
        icon: 'Users',
        version: '2.1.0',
        featureKey: 'feature.guest_crm',
        dependencies: ['PMS'],
        sortOrder: 3,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
      {
        id: 'mod-housekeeping',
        code: 'HOUSEKEEPING',
        name: 'Housekeeping Operations',
        description: 'Room turnover management, staff cleaning queue assignment, inspection sign-offs, and linen tracking.',
        category: 'core_pms',
        icon: 'Sparkles',
        version: '2.2.0',
        featureKey: 'feature.housekeeping',
        dependencies: ['PMS'],
        sortOrder: 4,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
      {
        id: 'mod-maintenance',
        code: 'MAINTENANCE',
        name: 'Maintenance & Work Orders',
        description: 'Facilities maintenance ticket dispatch, equipment repair tracking, and automated room blocking (OOO).',
        category: 'core_pms',
        icon: 'Wrench',
        version: '2.0.0',
        featureKey: 'feature.maintenance',
        dependencies: ['PMS'],
        sortOrder: 5,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },

      // Distribution
      {
        id: 'mod-channel-manager',
        code: 'CHANNEL_MANAGER',
        name: 'Channel Manager & 2-Way OTA Sync',
        description: 'Direct 2-way XML and iCal connectivity with Booking.com, Airbnb, Expedia, Agoda, and Hostelworld.',
        category: 'distribution',
        icon: 'Share2',
        version: '3.1.0',
        featureKey: 'feature.channel_manager',
        dependencies: ['PMS', 'RESERVATIONS'],
        sortOrder: 6,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-rates-availability',
        code: 'RATES_AVAILABILITY',
        name: 'Dynamic Rates & Restrictions Matrix',
        description: 'Daily rate overrides, weekend multipliers, stop-sell triggers, and minimum length-of-stay distribution controls.',
        category: 'distribution',
        icon: 'BadgeDollarSign',
        version: '2.0.0',
        featureKey: 'feature.rates_manager',
        dependencies: ['PMS'],
        sortOrder: 7,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },

      // Food & Beverage
      {
        id: 'mod-restaurant',
        code: 'RESTAURANT',
        name: 'Restaurant & Dining Outlets',
        description: 'Table floor plans, dining outlets management, digital menus, meal period pricing, and seat allocation.',
        category: 'food_beverage',
        icon: 'Utensils',
        version: '2.0.0',
        featureKey: 'feature.restaurant',
        dependencies: ['PMS'],
        sortOrder: 8,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
        addonAvailable: true,
        addonPriceMonthly: 49,
      },
      {
        id: 'mod-restaurant-pos',
        code: 'RESTAURANT_POS',
        name: 'Restaurant POS Terminal',
        description: 'Touch-optimized point of sale, quick ordering, modifier groups, split checks, and direct room folio charging.',
        category: 'food_beverage',
        icon: 'Receipt',
        version: '2.0.0',
        featureKey: 'feature.restaurant_pos',
        dependencies: ['RESTAURANT', 'GUEST_FOLIO'],
        sortOrder: 9,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-kitchen',
        code: 'KITCHEN',
        name: 'Kitchen Management & Stations',
        description: 'Food preparation station routing (Hot Line, Cold/Salad, Grill, Pastry), item lead times, and routing logic.',
        category: 'food_beverage',
        icon: 'Flame',
        version: '1.8.0',
        featureKey: 'feature.kitchen',
        dependencies: ['RESTAURANT'],
        sortOrder: 10,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-kitchen-kds',
        code: 'KITCHEN_KDS',
        name: 'Kitchen Display System (KDS)',
        description: 'Real-time chef order screen with elapsed cook timers, priority color badges, ticket bumping, and expediter mode.',
        category: 'food_beverage',
        icon: 'Tv2',
        version: '2.0.0',
        featureKey: 'feature.kitchen_kds',
        dependencies: ['KITCHEN', 'RESTAURANT_POS'],
        sortOrder: 11,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-bar',
        code: 'BAR',
        name: 'Bar & Lounge Outlets',
        description: 'Bar menu management, cocktail recipe catalog, happy hour rate rules, and lounge outlet configuration.',
        category: 'food_beverage',
        icon: 'Wine',
        version: '1.9.0',
        featureKey: 'feature.bar',
        dependencies: ['PMS'],
        sortOrder: 12,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-bar-pos',
        code: 'BAR_POS',
        name: 'Bar Quick POS & Tabs',
        description: 'Fast-paced bartender tap-to-order terminal, open tab manager by table/room, and direct guest room charging.',
        category: 'food_beverage',
        icon: 'Beer',
        version: '2.0.0',
        featureKey: 'feature.bar_pos',
        dependencies: ['BAR', 'GUEST_FOLIO'],
        sortOrder: 13,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },

      // Leisure & Wellness
      {
        id: 'mod-pool',
        code: 'SWIMMING_POOL',
        name: 'Swimming Pool & Leisure Hub',
        description: 'Pool facility capacity tracking, hotel guest complimentary passes vs external visitor day tickets, towel rental ledger, and water chemical test logs.',
        category: 'leisure_wellness',
        icon: 'Waves',
        version: '2.1.0',
        featureKey: 'feature.swimming_pool',
        dependencies: ['PMS', 'GUEST_FOLIO'],
        sortOrder: 14,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
        addonAvailable: true,
        addonPriceMonthly: 39,
      },
      {
        id: 'mod-spa',
        code: 'SPA',
        name: 'Spa & Wellness Sanctuary',
        description: 'Therapist appointment booking, treatment rooms scheduling, spa packages, and wellness folio billing.',
        category: 'leisure_wellness',
        icon: 'Flower2',
        version: '1.2.0',
        featureKey: 'feature.spa',
        dependencies: ['GUEST_MANAGEMENT', 'GUEST_FOLIO'],
        sortOrder: 15,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'enterprise',
        addonAvailable: true,
        addonPriceMonthly: 69,
      },
      {
        id: 'mod-gym',
        code: 'GYM',
        name: 'Fitness & Gym Center',
        description: 'Gym access card verification, trainer session scheduling, equipment maintenance logs, and visitor passes.',
        category: 'leisure_wellness',
        icon: 'Dumbbell',
        version: '1.1.0',
        featureKey: 'feature.gym',
        dependencies: ['PMS'],
        sortOrder: 16,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
        addonAvailable: true,
        addonPriceMonthly: 29,
      },

      // Operations & Logistics
      {
        id: 'mod-inventory',
        code: 'INVENTORY',
        name: 'Multi-Location Inventory',
        description: 'Warehouse, Kitchen, Bar, Housekeeping stock tracking, reorder alert thresholds, and automated depletion.',
        category: 'operations',
        icon: 'Boxes',
        version: '2.3.0',
        featureKey: 'feature.inventory',
        dependencies: ['PMS'],
        sortOrder: 17,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-purchasing',
        code: 'PURCHASING',
        name: 'Purchasing & Suppliers',
        description: 'Supplier directory, Purchase Orders (PO) lifecycle, receiving against PO, and supplier invoice matching.',
        category: 'operations',
        icon: 'Truck',
        version: '2.0.0',
        featureKey: 'feature.purchasing',
        dependencies: ['INVENTORY'],
        sortOrder: 18,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-recipes',
        code: 'RECIPES',
        name: 'Recipes & Bill of Materials',
        description: 'Menu dish and cocktail ingredient formulation, portion costing, and automated POS stock depletion.',
        category: 'operations',
        icon: 'ScrollText',
        version: '1.5.0',
        featureKey: 'feature.recipes',
        dependencies: ['INVENTORY', 'RESTAURANT'],
        sortOrder: 19,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'enterprise',
      },

      // Guest Services & Events
      {
        id: 'mod-room-service',
        code: 'ROOM_SERVICE',
        name: 'In-Room Dining / Room Service',
        description: 'Guest room order intake, tray delivery dispatch, scheduled breakfast ordering, and instant room folio post.',
        category: 'guest_services',
        icon: 'BellRing',
        version: '1.3.0',
        featureKey: 'feature.room_service',
        dependencies: ['RESTAURANT', 'GUEST_FOLIO'],
        sortOrder: 20,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
      },
      {
        id: 'mod-laundry',
        code: 'LAUNDRY',
        name: 'Guest Laundry & Dry Cleaning',
        description: 'Laundry bag intake, express dry cleaning status tracking, garment tags, and automated folio charge.',
        category: 'guest_services',
        icon: 'Shirt',
        version: '1.2.0',
        featureKey: 'feature.laundry',
        dependencies: ['GUEST_FOLIO'],
        sortOrder: 21,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
      },
      {
        id: 'mod-minibar',
        code: 'MINIBAR',
        name: 'In-Room Minibar Management',
        description: 'Minibar restocking checklist, consumption scanning, automated room posting, and warehouse replenishment.',
        category: 'guest_services',
        icon: 'Refrigerator',
        version: '1.1.0',
        featureKey: 'feature.minibar',
        dependencies: ['GUEST_FOLIO', 'INVENTORY'],
        sortOrder: 22,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
      },
      {
        id: 'mod-conference',
        code: 'CONFERENCE',
        name: 'Conference & Meeting Rooms',
        description: 'Meeting hall and boardroom hourly/daily booking calendar, AV equipment packages, and corporate catering billing.',
        category: 'events_sales',
        icon: 'Presentation',
        version: '1.4.0',
        featureKey: 'feature.conference',
        dependencies: ['PMS', 'GUEST_FOLIO'],
        sortOrder: 23,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'enterprise',
        addonAvailable: true,
        addonPriceMonthly: 79,
      },
      {
        id: 'mod-events',
        code: 'EVENTS',
        name: 'Weddings, Banquets & Events',
        description: 'Banquet event orders (BEO), function sheet designer, milestone deposits, and catering contract management.',
        category: 'events_sales',
        icon: 'PartyPopper',
        version: '1.2.0',
        featureKey: 'feature.events',
        dependencies: ['CONFERENCE'],
        sortOrder: 24,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'enterprise',
      },
      {
        id: 'mod-parking',
        code: 'PARKING',
        name: 'Valet & Parking Management',
        description: 'Parking space allocation, valet ticket generation, EV charging billing, and guest license plate registry.',
        category: 'guest_services',
        icon: 'Car',
        version: '1.0.0',
        featureKey: 'feature.parking',
        dependencies: ['PMS'],
        sortOrder: 25,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'pro',
      },
      {
        id: 'mod-tours',
        code: 'TOURS',
        name: 'Concierge Tours & Excursions',
        description: 'Local safari, boat charter, and cultural tour booking desk, third-party operator commission tracking, and voucher generation.',
        category: 'guest_services',
        icon: 'Compass',
        version: '1.0.0',
        featureKey: 'feature.tours',
        dependencies: ['GUEST_MANAGEMENT', 'GUEST_FOLIO'],
        sortOrder: 26,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
      },
      {
        id: 'mod-activities',
        code: 'ACTIVITIES',
        name: 'Resort Activities & Rentals',
        description: 'Kayak, bicycle, tennis court, and snorkel gear rental slots with return deposit tracking and damage billing.',
        category: 'leisure_wellness',
        icon: 'Bike',
        version: '1.0.0',
        featureKey: 'feature.activities',
        dependencies: ['PMS'],
        sortOrder: 27,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'professional',
      },

      // Financial Core
      {
        id: 'mod-guest-folio',
        code: 'GUEST_FOLIO',
        name: 'Central Guest Folio & Ledger',
        description: 'Universal guest financial ledger aggregating room rates, F&B, pool, spa, minibar charges, split payments, and tax invoices.',
        category: 'finance_reporting',
        icon: 'ReceiptText',
        version: '2.5.0',
        featureKey: 'feature.guest_folio',
        dependencies: ['PMS'],
        sortOrder: 28,
        isCore: true,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
      {
        id: 'mod-finance',
        code: 'FINANCE',
        name: 'Finance, Invoices & P&L',
        description: 'Departmental revenue breakdown, accounts receivable, VAT & tax declarations, vendor expenses, and financial audit logs.',
        category: 'finance_reporting',
        icon: 'LineChart',
        version: '2.3.0',
        featureKey: 'feature.finance',
        dependencies: ['GUEST_FOLIO'],
        sortOrder: 29,
        isCore: false,
        isAvailable: true,
        requiredPlanTier: 'starter',
      },
    ];

    // ==========================================
    // 18. SUBSCRIPTION ADD-ONS CATALOG
    // ==========================================
    this.addons = [
      {
        id: 'addon-pool',
        code: 'SWIMMING_POOL_ADDON',
        name: 'Swimming Pool & Leisure Hub Add-on',
        description: 'Unlock live pool capacity tracking, guest/visitor day ticketing, towel rental management, and water quality chemical logs.',
        category: 'leisure_wellness',
        moduleCodes: ['SWIMMING_POOL'],
        monthlyPrice: 39,
        featuresGranted: ['feature.swimming_pool'],
      },
      {
        id: 'addon-fnb',
        code: 'FNB_COMPLETE_SUITE',
        name: 'Food & Beverage Complete Suite',
        description: 'Full restaurant POS, multi-station Kitchen KDS, Rooftop Bar POS, and recipe ingredient auto-depletion.',
        category: 'food_beverage',
        moduleCodes: ['RESTAURANT', 'RESTAURANT_POS', 'KITCHEN', 'KITCHEN_KDS', 'BAR', 'BAR_POS', 'RECIPES'],
        monthlyPrice: 89,
        featuresGranted: ['feature.restaurant', 'feature.restaurant_pos', 'feature.kitchen', 'feature.kitchen_kds', 'feature.bar', 'feature.bar_pos', 'feature.recipes'],
      },
      {
        id: 'addon-spa',
        code: 'SPA_WELLNESS_ADDON',
        name: 'Spa & Wellness Sanctuary Add-on',
        description: 'Therapist scheduling, treatment rooms, packages, and direct room folio posting.',
        category: 'leisure_wellness',
        moduleCodes: ['SPA'],
        monthlyPrice: 69,
        featuresGranted: ['feature.spa'],
      },
      {
        id: 'addon-conference',
        code: 'CONFERENCE_EVENTS_ADDON',
        name: 'Conference & Events Suite Add-on',
        description: 'Meeting hall bookings, banquet event orders (BEO), and corporate function catering contracts.',
        category: 'events_sales',
        moduleCodes: ['CONFERENCE', 'EVENTS'],
        monthlyPrice: 79,
        featuresGranted: ['feature.conference', 'feature.events'],
      },
    ];

    // ==========================================
    // 19. TENANT MODULE ACTIVATIONS (DEFAULT STATE)
    // ==========================================
    // Azure Hospitality (Enterprise): Has PMS, Channel Manager, Restaurant, Kitchen, KDS, Bar, Pool, Inventory, Purchasing, Recipes, Guest Folio, Finance enabled.
    const azureModules: ModuleCode[] = [
      'PMS', 'RESERVATIONS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE',
      'CHANNEL_MANAGER', 'RATES_AVAILABILITY', 'GUEST_MANAGEMENT',
      'RESTAURANT', 'RESTAURANT_POS', 'KITCHEN', 'KITCHEN_KDS',
      'BAR', 'BAR_POS', 'SWIMMING_POOL', 'INVENTORY', 'PURCHASING', 'RECIPES',
      'GUEST_FOLIO', 'FINANCE'
    ];

    this.tenantActivations = azureModules.map((code, index) => ({
      id: `act-azure-${code.toLowerCase()}`,
      tenantId: 'tenant-azure',
      propertyId: undefined, // Enabled tenant-wide
      moduleCode: code,
      status: 'ENABLED',
      enabledAt: '2025-01-15T00:00:00Z',
      enabledBy: 'usr-admin-1',
      configuration: this.getDefaultModuleConfig(code),
      limits: {},
    }));

    // Highland Alpine (Professional Plan): Has Core PMS, Channel Manager, Rates, Restaurant & POS, Inventory, Finance, Folio
    const highlandModules: ModuleCode[] = [
      'PMS', 'RESERVATIONS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE',
      'CHANNEL_MANAGER', 'RATES_AVAILABILITY', 'GUEST_MANAGEMENT',
      'RESTAURANT', 'RESTAURANT_POS', 'INVENTORY', 'GUEST_FOLIO', 'FINANCE'
    ];

    highlandModules.forEach(code => {
      this.tenantActivations.push({
        id: `act-highland-${code.toLowerCase()}`,
        tenantId: 'tenant-highland',
        moduleCode: code,
        status: 'ENABLED',
        enabledAt: '2025-04-10T00:00:00Z',
        enabledBy: 'usr-admin-1',
        configuration: this.getDefaultModuleConfig(code),
      });
    });

    // Urban Loft (Starter Plan): Has Core PMS, Reservations, Front Desk, Housekeeping, Maintenance, Guest Folio, Finance
    const urbanModules: ModuleCode[] = [
      'PMS', 'RESERVATIONS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'GUEST_MANAGEMENT', 'GUEST_FOLIO', 'FINANCE'
    ];

    urbanModules.forEach(code => {
      this.tenantActivations.push({
        id: `act-urban-${code.toLowerCase()}`,
        tenantId: 'tenant-urban',
        moduleCode: code,
        status: 'ENABLED',
        enabledAt: '2025-08-01T00:00:00Z',
        enabledBy: 'usr-admin-1',
        configuration: this.getDefaultModuleConfig(code),
      });
    });

    // ==========================================
    // 20. DINING TABLES & OUTLETS
    // ==========================================
    this.diningTables = [
      { id: 'tbl-1', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'T-01', name: 'Oceanview 1', section: 'indoor', capacity: 2, status: 'available' },
      { id: 'tbl-2', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'T-02', name: 'Oceanview 2', section: 'indoor', capacity: 4, status: 'occupied', currentOrderId: 'ord-101', currentGuests: 2 },
      { id: 'tbl-3', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'T-03', name: 'Center Booth', section: 'indoor', capacity: 6, status: 'available' },
      { id: 'tbl-4', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'T-04', name: 'Patio Sunset 1', section: 'patio', capacity: 4, status: 'available' },
      { id: 'tbl-5', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'T-05', name: 'Patio Sunset 2', section: 'patio', capacity: 4, status: 'reserved' },
      { id: 'tbl-6', propertyId: 'prop-azure-bay', outletId: 'bar-rooftop', number: 'B-01', name: 'Bar Lounge 1', section: 'bar', capacity: 2, status: 'available' },
      { id: 'tbl-7', propertyId: 'prop-azure-bay', outletId: 'bar-rooftop', number: 'B-02', name: 'Bar Lounge 2', section: 'bar', capacity: 4, status: 'occupied', currentOrderId: 'ord-102', currentGuests: 3 },
      { id: 'tbl-8', propertyId: 'prop-azure-bay', outletId: 'restaurant-main', number: 'P-01', name: 'Poolside Cabana Table', section: 'poolside', capacity: 6, status: 'available' },
    ];

    // ==========================================
    // 21. MENU ITEMS (FOOD & BEVERAGE)
    // ==========================================
    this.menuItems = [
      // Mains & Grills
      {
        id: 'menu-1',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Mains',
        name: 'Pan-Seared Atlantic Seabass',
        description: 'Crispy skin Chilean seabass over saffron risotto, asparagus spears, and citrus beurre blanc.',
        price: 38.00,
        costPrice: 12.50,
        taxRate: 0.08,
        station: 'grill',
        isAvailable: true,
        dietaryTags: ['gluten_free', 'signature'],
      },
      {
        id: 'menu-2',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Mains',
        name: 'Prime Black Angus Tenderloin (8oz)',
        description: 'Truffle mashed potatoes, roasted heirloom carrots, rosemary red wine reduction.',
        price: 46.00,
        costPrice: 16.00,
        taxRate: 0.08,
        station: 'grill',
        isAvailable: true,
        dietaryTags: ['gluten_free', 'signature'],
        modifierGroups: [
          {
            id: 'modgrp-temp',
            name: 'Meat Temperature',
            required: true,
            minSelect: 1,
            maxSelect: 1,
            modifiers: [
              { id: 'm-rare', name: 'Rare', priceDelta: 0 },
              { id: 'm-medrare', name: 'Medium Rare', priceDelta: 0, isDefault: true },
              { id: 'm-med', name: 'Medium', priceDelta: 0 },
              { id: 'm-well', name: 'Well Done', priceDelta: 0 },
            ],
          },
        ],
      },
      {
        id: 'menu-3',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Appetizers',
        name: 'Yellowfin Tuna Tartare',
        description: 'Avocado mousse, ponzu sesame reduction, crispy wonton crisps.',
        price: 22.00,
        costPrice: 6.80,
        taxRate: 0.08,
        station: 'cold_kitchen',
        isAvailable: true,
        dietaryTags: ['signature'],
      },
      {
        id: 'menu-4',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Appetizers',
        name: 'Burrata Caprese Rustica',
        description: 'Pugliese burrata, heirloom cherry tomatoes, aged Modena balsamic, pesto drizzle.',
        price: 18.00,
        costPrice: 5.20,
        taxRate: 0.08,
        station: 'cold_kitchen',
        isAvailable: true,
        dietaryTags: ['vegetarian', 'gluten_free'],
      },
      {
        id: 'menu-5',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Desserts',
        name: 'Warm Valrhona Chocolate Fondant',
        description: 'Molten dark chocolate core with Madagascar vanilla bean gelato and raspberry coulis.',
        price: 14.00,
        costPrice: 3.90,
        taxRate: 0.08,
        station: 'pastry',
        isAvailable: true,
        dietaryTags: ['vegetarian'],
      },

      // Bar & Cocktails
      {
        id: 'menu-6',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'bar-rooftop',
        category: 'Cocktails',
        name: 'Azure Smoked Old Fashioned',
        description: 'Woodford Reserve bourbon, aromatic bitters, charred orange peel, smoked hickory cloche.',
        price: 19.00,
        costPrice: 4.20,
        taxRate: 0.08,
        station: 'bar',
        isAvailable: true,
        dietaryTags: ['signature'],
      },
      {
        id: 'menu-7',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'bar-rooftop',
        category: 'Cocktails',
        name: 'Passionfruit Coastal Paloma',
        description: 'Don Julio Blanco tequila, fresh pink grapefruit juice, passionfruit puree, smoked salt rim.',
        price: 17.00,
        costPrice: 3.80,
        taxRate: 0.08,
        station: 'bar',
        isAvailable: true,
        dietaryTags: ['signature'],
      },
      {
        id: 'menu-8',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'bar-rooftop',
        category: 'Wines',
        name: 'Veuve Clicquot Yellow Label Brut (Glass)',
        description: 'Reims, France. Crisp yellow fruits, toasted brioche and lively effervescence.',
        price: 26.00,
        costPrice: 9.00,
        taxRate: 0.08,
        station: 'bar',
        isAvailable: true,
        dietaryTags: [],
      },
      {
        id: 'menu-9',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        category: 'Snacks',
        name: 'Crispy Truffle Parmesan Fries',
        description: 'Hand-cut russet potatoes, white truffle oil, grated aged Reggiano, garlic aioli.',
        price: 12.00,
        costPrice: 2.10,
        taxRate: 0.08,
        station: 'hot_kitchen',
        isAvailable: true,
        dietaryTags: ['vegetarian'],
      },
    ];

    // ==========================================
    // 22. RESTAURANT & BAR ORDERS
    // ==========================================
    this.restaurantOrders = [
      {
        id: 'ord-101',
        orderNumber: 'ORD-20260901-01',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'restaurant-main',
        outletName: 'Azure Grand Dining',
        orderType: 'dine_in',
        tableId: 'tbl-2',
        tableNumber: 'T-02',
        guestId: 'gst-1',
        guestName: 'Dr. Arthur Pendelton',
        reservationId: 'res-001',
        roomId: 'rm-101',
        roomNumber: '101',
        items: [
          { id: 'oit-1', menuItemId: 'menu-1', name: 'Pan-Seared Atlantic Seabass', price: 38.00, quantity: 1, station: 'grill', status: 'preparing' },
          { id: 'oit-2', menuItemId: 'menu-3', name: 'Yellowfin Tuna Tartare', price: 22.00, quantity: 1, station: 'cold_kitchen', status: 'ready' },
          { id: 'oit-3', menuItemId: 'menu-6', name: 'Azure Smoked Old Fashioned', price: 19.00, quantity: 2, station: 'bar', status: 'served' },
        ],
        subtotal: 98.00,
        taxAmount: 7.84,
        serviceCharge: 9.80,
        discountAmount: 0,
        totalAmount: 115.64,
        paymentStatus: 'unpaid',
        status: 'in_progress',
        createdAt: '2026-09-01T14:15:00Z',
        serverName: 'Sarah Jenkins',
      },
      {
        id: 'ord-102',
        orderNumber: 'ORD-20260901-02',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        outletId: 'bar-rooftop',
        outletName: 'Rooftop Horizon Lounge',
        orderType: 'bar_tab',
        tableId: 'tbl-7',
        tableNumber: 'B-02',
        guestId: 'gst-2',
        guestName: 'Elena Vane',
        reservationId: 'res-002',
        roomId: 'rm-201',
        roomNumber: '201',
        items: [
          { id: 'oit-4', menuItemId: 'menu-7', name: 'Passionfruit Coastal Paloma', price: 17.00, quantity: 3, station: 'bar', status: 'served' },
          { id: 'oit-5', menuItemId: 'menu-9', name: 'Crispy Truffle Parmesan Fries', price: 12.00, quantity: 2, station: 'hot_kitchen', status: 'ready' },
        ],
        subtotal: 75.00,
        taxAmount: 6.00,
        serviceCharge: 7.50,
        discountAmount: 0,
        totalAmount: 88.50,
        paymentStatus: 'unpaid',
        status: 'in_progress',
        createdAt: '2026-09-01T14:40:00Z',
        serverName: 'Carlos Ray',
      },
    ];

    // ==========================================
    // 23. KITCHEN DISPLAY SYSTEM (KDS) TICKETS
    // ==========================================
    this.kdsTickets = [
      {
        id: 'kds-1',
        orderId: 'ord-101',
        orderNumber: 'ORD-20260901-01',
        propertyId: 'prop-azure-bay',
        outletName: 'Azure Grand Dining',
        destination: 'Table T-02 (Room 101)',
        station: 'all',
        items: [
          { id: 'oit-1', name: 'Pan-Seared Atlantic Seabass', quantity: 1, specialInstructions: 'Gluten allergy guest. Extra beurre blanc.', status: 'preparing' },
          { id: 'oit-2', name: 'Yellowfin Tuna Tartare', quantity: 1, status: 'ready' },
        ],
        status: 'in_progress',
        serverName: 'Sarah Jenkins',
        createdAt: '2026-09-01T14:15:00Z',
        timerMinutes: 12,
        priority: 'normal',
      },
      {
        id: 'kds-2',
        orderId: 'ord-102',
        orderNumber: 'ORD-20260901-02',
        propertyId: 'prop-azure-bay',
        outletName: 'Rooftop Horizon Lounge',
        destination: 'Bar Lounge B-02',
        station: 'hot_kitchen',
        items: [
          { id: 'oit-5', name: 'Crispy Truffle Parmesan Fries', quantity: 2, status: 'ready' },
        ],
        status: 'ready',
        serverName: 'Carlos Ray',
        createdAt: '2026-09-01T14:40:00Z',
        timerMinutes: 6,
        priority: 'normal',
      },
    ];

    // ==========================================
    // 24. SWIMMING POOL & LEISURE HUB
    // ==========================================
    this.poolFacilities = [
      {
        id: 'pool-main',
        propertyId: 'prop-azure-bay',
        name: 'Azure Horizon Infinity Pool & Sun Deck',
        maxCapacity: 45,
        currentOccupancy: 18,
        operatingHours: '07:00 - 21:00',
        status: 'open',
        adultVisitorPrice: 35.00,
        childVisitorPrice: 20.00,
        guestAccessPolicy: 'complimentary',
        towelRentalPrice: 5.00,
      },
    ];

    this.poolTickets = [
      {
        id: 'pt-1',
        ticketNumber: 'POOL-20260901-01',
        propertyId: 'prop-azure-bay',
        type: 'hotel_guest',
        holderName: 'Dr. Arthur Pendelton',
        partySize: 2,
        roomId: 'rm-101',
        roomNumber: '101',
        guestId: 'gst-1',
        reservationId: 'res-001',
        checkInTime: '2026-09-01T11:30:00Z',
        amountPaid: 0,
        paymentMethod: 'free_inhouse',
        towelsIssued: 2,
        towelsReturned: 0,
        status: 'active',
      },
      {
        id: 'pt-2',
        ticketNumber: 'POOL-20260901-02',
        propertyId: 'prop-azure-bay',
        type: 'external_visitor',
        holderName: 'Liam & Jessica Davies',
        partySize: 2,
        checkInTime: '2026-09-01T12:00:00Z',
        amountPaid: 70.00,
        paymentMethod: 'card',
        towelsIssued: 2,
        towelsReturned: 2,
        status: 'active',
      },
      {
        id: 'pt-3',
        ticketNumber: 'POOL-20260901-03',
        propertyId: 'prop-azure-bay',
        type: 'hotel_guest',
        holderName: 'Elena Vane',
        partySize: 1,
        roomId: 'rm-201',
        roomNumber: '201',
        guestId: 'gst-2',
        reservationId: 'res-002',
        checkInTime: '2026-09-01T13:45:00Z',
        amountPaid: 0,
        paymentMethod: 'free_inhouse',
        towelsIssued: 1,
        towelsReturned: 0,
        status: 'active',
      },
    ];

    this.poolWaterLogs = [
      {
        id: 'pwl-1',
        propertyId: 'prop-azure-bay',
        poolId: 'pool-main',
        testedAt: '2026-09-01T08:00:00Z',
        testedBy: 'Kenji Sato (Engineering)',
        phLevel: 7.4,
        freeChlorinePpm: 2.1,
        totalChlorinePpm: 2.3,
        waterTemperatureC: 28.5,
        clarity: 'crystal_clear',
        chemicalDosageAdded: '500ml Sodium Hypochlorite 12%',
        notes: 'Morning baseline test. Water chemistry optimal.',
        isCompliant: true,
      },
      {
        id: 'pwl-2',
        propertyId: 'prop-azure-bay',
        poolId: 'pool-main',
        testedAt: '2026-09-01T14:00:00Z',
        testedBy: 'Kenji Sato (Engineering)',
        phLevel: 7.5,
        freeChlorinePpm: 1.8,
        totalChlorinePpm: 2.0,
        waterTemperatureC: 29.2,
        clarity: 'crystal_clear',
        chemicalDosageAdded: 'None required',
        notes: 'Midday check. Clarity perfect, bather load moderate.',
        isCompliant: true,
      },
    ];

    // ==========================================
    // 25. INVENTORY & PURCHASING
    // ==========================================
    this.inventoryLocations = [
      { id: 'loc-wh', propertyId: 'prop-azure-bay', code: 'WH-MAIN', name: 'Main Central Warehouse', type: 'warehouse', manager: 'David Sterling' },
      { id: 'loc-kt', propertyId: 'prop-azure-bay', code: 'KT-MAIN', name: 'Main Kitchen Dry & Cold Stores', type: 'kitchen', manager: 'Executive Chef Mario' },
      { id: 'loc-bar', propertyId: 'prop-azure-bay', code: 'BAR-ROOF', name: 'Rooftop Bar Spirits Vault', type: 'bar', manager: 'Carlos Ray' },
      { id: 'loc-pool', propertyId: 'prop-azure-bay', code: 'POOL-STORE', name: 'Pool Deck Towel & Chemicals Shed', type: 'pool', manager: 'Kenji Sato' },
      { id: 'loc-hk', propertyId: 'prop-azure-bay', code: 'HK-LINEN', name: 'Housekeeping Linen & Toiletries Hub', type: 'housekeeping', manager: 'Maria Santos' },
    ];

    this.suppliers = [
      {
        id: 'sup-1',
        tenantId: 'tenant-azure',
        name: 'Atlantic Coast Seafoods Ltd.',
        contactPerson: 'Capt. Thomas Drake',
        email: 'orders@atlanticcoastseafood.com',
        phone: '+1 (305) 555-8910',
        categories: ['food_ingredients', 'seafood'],
        paymentTerms: 'Net 30',
        address: 'Pier 14, Biscayne Bay, Miami FL',
        leadTimeDays: 1,
        active: true,
      },
      {
        id: 'sup-2',
        tenantId: 'tenant-azure',
        name: 'Empire Beverage & Spirits Distribution',
        contactPerson: 'Victoria Belmont',
        email: 'sales@empirebeverages.com',
        phone: '+1 (305) 555-4421',
        categories: ['liquor', 'beverages'],
        paymentTerms: 'Net 15',
        address: '880 Industrial Pkwy, Doral FL',
        leadTimeDays: 2,
        active: true,
      },
      {
        id: 'sup-3',
        tenantId: 'tenant-azure',
        name: 'Luxe Hotel Amenities & Linens Inc.',
        contactPerson: 'Jonathan Hayes',
        email: 'j.hayes@luxeresortsupplies.com',
        phone: '+1 (800) 555-7733',
        categories: ['cleaning_linens', 'guest_amenities'],
        paymentTerms: 'Net 30',
        address: '420 Commercial Blvd, Fort Lauderdale FL',
        leadTimeDays: 3,
        active: true,
      },
      {
        id: 'sup-4',
        tenantId: 'tenant-azure',
        name: 'Apex Pool Chemicals & Filtration',
        contactPerson: 'Randy Miller',
        email: 'apexchemical@pooltech.com',
        phone: '+1 (305) 555-1299',
        categories: ['pool_chemicals'],
        paymentTerms: 'Net 30',
        address: '102 Industrial Way, Miami FL',
        leadTimeDays: 2,
        active: true,
      },
    ];

    this.inventoryProducts = [
      {
        id: 'prod-1',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'SEA-BASS-01',
        name: 'Chilean Seabass Fillet (Fresh)',
        category: 'food_ingredients',
        unit: 'kg',
        currentStock: 14.5,
        minStockLevel: 5.0,
        targetStockLevel: 25.0,
        costPerUnit: 28.00,
        supplierId: 'sup-1',
        supplierName: 'Atlantic Coast Seafoods Ltd.',
        locationId: 'loc-kt',
        locationName: 'Main Kitchen Dry & Cold Stores',
      },
      {
        id: 'prod-2',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'BEEF-TEND-01',
        name: 'Black Angus Beef Tenderloin (PSMO)',
        category: 'food_ingredients',
        unit: 'kg',
        currentStock: 18.0,
        minStockLevel: 8.0,
        targetStockLevel: 30.0,
        costPerUnit: 34.00,
        supplierId: 'sup-1',
        supplierName: 'Atlantic Coast Seafoods Ltd.',
        locationId: 'loc-kt',
        locationName: 'Main Kitchen Dry & Cold Stores',
      },
      {
        id: 'prod-3',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'LIQ-WOOD-01',
        name: 'Woodford Reserve Bourbon (750ml)',
        category: 'liquor',
        unit: 'bottles',
        currentStock: 8,
        minStockLevel: 4,
        targetStockLevel: 18,
        costPerUnit: 32.50,
        supplierId: 'sup-2',
        supplierName: 'Empire Beverage & Spirits Distribution',
        locationId: 'loc-bar',
        locationName: 'Rooftop Bar Spirits Vault',
      },
      {
        id: 'prod-4',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'LIQ-TEQ-01',
        name: 'Don Julio Blanco Tequila (750ml)',
        category: 'liquor',
        unit: 'bottles',
        currentStock: 3, // LOW STOCK ALERT
        minStockLevel: 5,
        targetStockLevel: 15,
        costPerUnit: 44.00,
        supplierId: 'sup-2',
        supplierName: 'Empire Beverage & Spirits Distribution',
        locationId: 'loc-bar',
        locationName: 'Rooftop Bar Spirits Vault',
      },
      {
        id: 'prod-5',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'WIN-VEUVE-01',
        name: 'Veuve Clicquot Yellow Label (750ml)',
        category: 'liquor',
        unit: 'bottles',
        currentStock: 16,
        minStockLevel: 6,
        targetStockLevel: 30,
        costPerUnit: 52.00,
        supplierId: 'sup-2',
        supplierName: 'Empire Beverage & Spirits Distribution',
        locationId: 'loc-bar',
        locationName: 'Rooftop Bar Spirits Vault',
      },
      {
        id: 'prod-6',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'POOL-CHLOR-01',
        name: 'Liquid Pool Chlorine (12.5% Sodium Hypochlorite)',
        category: 'pool_chemicals',
        unit: 'liters',
        currentStock: 80,
        minStockLevel: 40,
        targetStockLevel: 200,
        costPerUnit: 1.85,
        supplierId: 'sup-4',
        supplierName: 'Apex Pool Chemicals & Filtration',
        locationId: 'loc-pool',
        locationName: 'Pool Deck Towel & Chemicals Shed',
      },
      {
        id: 'prod-7',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'HK-TOWL-01',
        name: 'Luxury Egyptian Cotton Pool Towel (Navy)',
        category: 'cleaning_linens',
        unit: 'pieces',
        currentStock: 95,
        minStockLevel: 40,
        targetStockLevel: 150,
        costPerUnit: 14.50,
        supplierId: 'sup-3',
        supplierName: 'Luxe Hotel Amenities & Linens Inc.',
        locationId: 'loc-pool',
        locationName: 'Pool Deck Towel & Chemicals Shed',
      },
      {
        id: 'prod-8',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        sku: 'HK-SOAP-01',
        name: 'Artisanal Bergamot & Sandalwood Body Wash (50ml)',
        category: 'guest_amenities',
        unit: 'bottles',
        currentStock: 220,
        minStockLevel: 100,
        targetStockLevel: 500,
        costPerUnit: 1.20,
        supplierId: 'sup-3',
        supplierName: 'Luxe Hotel Amenities & Linens Inc.',
        locationId: 'loc-hk',
        locationName: 'Housekeeping Linen & Toiletries Hub',
      },
    ];

    this.stockMovements = [
      {
        id: 'sm-1',
        propertyId: 'prop-azure-bay',
        productId: 'prod-1',
        productName: 'Chilean Seabass Fillet (Fresh)',
        type: 'PURCHASE',
        quantityChange: 15.0,
        unit: 'kg',
        costValue: 420.00,
        reference: 'PO-2026-088',
        performedBy: 'Executive Chef Mario',
        timestamp: '2026-08-31T09:30:00Z',
        notes: 'Received fresh morning catch from Atlantic Coast Seafoods',
      },
      {
        id: 'sm-2',
        propertyId: 'prop-azure-bay',
        productId: 'prod-4',
        productName: 'Don Julio Blanco Tequila (750ml)',
        type: 'CONSUMPTION',
        quantityChange: -4,
        unit: 'bottles',
        costValue: 176.00,
        reference: 'BAR-DEP-20260831',
        performedBy: 'Carlos Ray',
        timestamp: '2026-08-31T23:30:00Z',
        notes: 'Sunday evening rooftop cocktail service depletion',
      },
      {
        id: 'sm-3',
        propertyId: 'prop-azure-bay',
        productId: 'prod-6',
        productName: 'Liquid Pool Chlorine',
        type: 'CONSUMPTION',
        quantityChange: -5.0,
        unit: 'liters',
        costValue: 9.25,
        reference: 'POOL-CHEM-0901',
        performedBy: 'Kenji Sato',
        timestamp: '2026-09-01T08:15:00Z',
        notes: 'Daily shock dose and balancing',
      },
    ];

    this.purchaseOrders = [
      {
        id: 'po-1',
        poNumber: 'PO-2026-091',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        supplierId: 'sup-2',
        supplierName: 'Empire Beverage & Spirits Distribution',
        destinationLocationId: 'loc-bar',
        destinationLocationName: 'Rooftop Bar Spirits Vault',
        status: 'submitted',
        items: [
          { productId: 'prod-4', productName: 'Don Julio Blanco Tequila (750ml)', orderedQty: 12, receivedQty: 0, unit: 'bottles', unitPrice: 44.00, totalPrice: 528.00 },
          { productId: 'prod-3', productName: 'Woodford Reserve Bourbon (750ml)', orderedQty: 10, receivedQty: 0, unit: 'bottles', unitPrice: 32.50, totalPrice: 325.00 },
        ],
        subtotal: 853.00,
        taxAmount: 68.24,
        shippingFee: 25.00,
        totalAmount: 946.24,
        expectedDeliveryDate: '2026-09-03',
        createdAt: '2026-09-01T10:00:00Z',
        createdBy: 'David Sterling',
        notes: 'Restock order for weekend holiday demand.',
      },
    ];

    // ==========================================
    // 26. AUDIT LOGS (Hotel Operational)
    // ==========================================
    this.auditLogs = [
      {
        id: 'aud-1',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        userId: 'usr-admin-1',
        userName: 'Alexander Cross',
        action: 'MODULE_ENABLED',
        details: 'Enabled module SWIMMING_POOL on Enterprise plan entitlement',
        timestamp: '2026-09-01T08:00:00Z',
      },
      {
        id: 'aud-2',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        userId: 'usr-mgr-1',
        userName: 'Marcus Vance',
        action: 'ORDER_CREATED',
        details: 'Created Restaurant Order #ORD-20260901-01 for Table T-02 (Dr. Arthur Pendelton)',
        timestamp: '2026-09-01T14:15:00Z',
      },
      {
        id: 'aud-3',
        tenantId: 'tenant-azure',
        propertyId: 'prop-azure-bay',
        userId: 'usr-fd-1',
        userName: 'Sarah Jenkins',
        action: 'FOLIO_CHARGE_CREATED',
        details: 'Posted Room Charge of $115.64 to Reservation res-001 (Room 101)',
        timestamp: '2026-09-01T14:20:00Z',
      },
    ];

    // ==========================================
    // 27. SAAS PLATFORM SUBSCRIPTION PLANS & BILLING
    // ==========================================
    this.platformSubscriptionPlans = [
      {
        id: 'plan-starter',
        code: 'starter',
        name: 'Starter PMS',
        tier: 'starter',
        monthlyPrice: 149,
        annualPrice: 1490,
        maxProperties: 1,
        maxRooms: 20,
        includedModules: ['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'RESERVATIONS'],
        features: ['1 Property', 'Up to 20 Rooms', 'Core Tape Chart & PMS', 'Housekeeping & Maintenance', 'Standard Email Support'],
        tenantCount: 1,
      },
      {
        id: 'plan-professional',
        code: 'professional',
        name: 'Professional Hotel OS',
        tier: 'professional',
        monthlyPrice: 349,
        annualPrice: 3490,
        maxProperties: 3,
        maxRooms: 100,
        includedModules: ['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'RESERVATIONS', 'CHANNEL_MANAGER', 'RESTAURANT', 'INVENTORY'],
        features: ['Up to 3 Properties', 'Up to 100 Rooms', '2-Way Channel Manager (Booking/Expedia/Airbnb)', 'Restaurant & Bar POS + KDS', 'Multi-warehouse Inventory', 'Priority 24/7 SLA Support'],
        tenantCount: 1,
        isPopular: true,
      },
      {
        id: 'plan-enterprise',
        code: 'enterprise',
        name: 'Enterprise Hospitality Suite',
        tier: 'enterprise',
        monthlyPrice: 799,
        annualPrice: 7990,
        maxProperties: 10,
        maxRooms: 500,
        includedModules: ['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'RESERVATIONS', 'CHANNEL_MANAGER', 'RESTAURANT', 'SWIMMING_POOL', 'INVENTORY', 'ANALYTICS_PRO'],
        features: ['Unlimited Properties & Outlets', 'Up to 500 Rooms', 'All Operational Modules + Pool & Wellness', 'Dedicated Technical Account Manager', 'Custom Webhooks & REST API Access', 'Custom RBAC Role Definitions'],
        tenantCount: 1,
      },
    ];

    // Platform Invoices
    this.platformInvoices = [
      {
        id: 'inv-2026-001',
        invoiceNumber: 'INV-2026-0801',
        tenantId: 'tenant-azure',
        tenantName: 'Grand Azure Hospitality Group',
        planName: 'Enterprise Hospitality Suite',
        amount: 799.00,
        status: 'paid',
        issuedDate: '2026-08-01',
        dueDate: '2026-08-15',
        paidDate: '2026-08-02',
        paymentMethod: 'Stripe (Visa •••• 4242)',
      },
      {
        id: 'inv-2026-002',
        invoiceNumber: 'INV-2026-0802',
        tenantId: 'tenant-highland',
        tenantName: 'Highland Alpine Resorts',
        planName: 'Professional Hotel OS',
        amount: 349.00,
        status: 'paid',
        issuedDate: '2026-08-01',
        dueDate: '2026-08-15',
        paidDate: '2026-08-03',
        paymentMethod: 'Stripe (Mastercard •••• 8812)',
      },
      {
        id: 'inv-2026-003',
        invoiceNumber: 'INV-2026-0803',
        tenantId: 'tenant-urban',
        tenantName: 'Urban Loft Collection',
        planName: 'Starter PMS',
        amount: 149.00,
        status: 'paid',
        issuedDate: '2026-08-01',
        dueDate: '2026-08-15',
        paidDate: '2026-08-01',
        paymentMethod: 'Stripe (Amex •••• 1009)',
      },
      {
        id: 'inv-2026-004',
        invoiceNumber: 'INV-2026-0901',
        tenantId: 'tenant-azure',
        tenantName: 'Grand Azure Hospitality Group',
        planName: 'Enterprise Hospitality Suite',
        amount: 799.00,
        status: 'pending',
        issuedDate: '2026-09-01',
        dueDate: '2026-09-15',
        paymentMethod: 'Stripe (Auto-debit)',
      },
    ];

    // Platform API Clients
    this.platformApiClients = [
      {
        id: 'api-client-01',
        name: 'Azure Mobile Concierge App',
        clientId: 'cli_az_mobile_88492019',
        clientSecretMasked: 'sk_live_••••••••••••94f2',
        tenantId: 'tenant-azure',
        tier: 'unlimited',
        rateLimitRps: 100,
        dailyQuota: 500000,
        requestsToday: 12480,
        webhookUrl: 'https://api.azurehospitality.com/webhooks/pms-events',
        status: 'active',
        createdAt: '2025-06-12T10:00:00Z',
        lastUsedAt: '2026-09-01T15:24:11Z',
      },
      {
        id: 'api-client-02',
        name: 'Global OTA Channel Aggregator',
        clientId: 'cli_ota_sync_10492837',
        clientSecretMasked: 'sk_live_••••••••••••881b',
        tier: 'unlimited',
        rateLimitRps: 200,
        dailyQuota: 1000000,
        requestsToday: 23140,
        webhookUrl: 'https://gateway.ota-hub.io/vanguard-sync',
        status: 'active',
        createdAt: '2025-01-10T08:00:00Z',
        lastUsedAt: '2026-09-01T15:29:40Z',
      },
      {
        id: 'api-client-03',
        name: 'Highland Ski-Pass & RFID Gateway',
        clientId: 'cli_highland_rfid_9921',
        clientSecretMasked: 'sk_live_••••••••••••33a1',
        tenantId: 'tenant-highland',
        tier: 'standard',
        rateLimitRps: 25,
        dailyQuota: 50000,
        requestsToday: 2830,
        status: 'active',
        createdAt: '2025-10-01T12:00:00Z',
        lastUsedAt: '2026-09-01T14:11:05Z',
      },
    ];

    // Platform Integration Services
    this.platformIntegrations = [
      {
        id: 'int-stripe',
        name: 'Stripe SaaS Billing & Merchant Gateway',
        category: 'payment',
        provider: 'Stripe Connect Custom',
        status: 'operational',
        latencyMs: 112,
        uptime24h: 100,
        errorRatePercentage: 0.01,
        lastHealthCheck: '2026-09-01T15:28:00Z',
        configSummary: 'Webhook endpoint verified, TLS 1.3 active',
      },
      {
        id: 'int-ota-booking',
        name: 'Booking.com Channel API Adapter',
        category: 'ota_gateway',
        provider: 'BookingSuite B.V.',
        status: 'operational',
        latencyMs: 185,
        uptime24h: 99.96,
        errorRatePercentage: 0.04,
        lastHealthCheck: '2026-09-01T15:25:00Z',
        configSummary: 'Real-time ARI push and reservation pulling enabled',
      },
      {
        id: 'int-ota-airbnb',
        name: 'Airbnb Partner API Gateway',
        category: 'ota_gateway',
        provider: 'Airbnb Inc.',
        status: 'operational',
        latencyMs: 142,
        uptime24h: 99.98,
        errorRatePercentage: 0.02,
        lastHealthCheck: '2026-09-01T15:26:00Z',
        configSummary: 'Official Host API v2 connection active',
      },
      {
        id: 'int-ota-expedia',
        name: 'Expedia Partner Central QuickConnect',
        category: 'ota_gateway',
        provider: 'Expedia Group',
        status: 'operational',
        latencyMs: 198,
        uptime24h: 99.91,
        errorRatePercentage: 0.08,
        lastHealthCheck: '2026-09-01T15:27:00Z',
        configSummary: 'Rate & Availability Push Active',
      },
      {
        id: 'int-comms-sendgrid',
        name: 'Transactional Email Gateway',
        category: 'email_sms',
        provider: 'Twilio SendGrid API',
        status: 'operational',
        latencyMs: 88,
        uptime24h: 100,
        errorRatePercentage: 0.0,
        lastHealthCheck: '2026-09-01T15:29:00Z',
        configSummary: 'SPF & DKIM authenticated for notifications@vanguardpms.com',
      },
    ];

    // Initial Platform Audit Logs
    this.platformAuditLogs = [
      {
        id: 'paud-init-1',
        actorUserId: 'usr-admin-1',
        actorName: 'Alexander Cross',
        actorRole: 'SUPER_ADMIN',
        action: 'PLATFORM_BOOTSTRAP',
        contextType: 'PLATFORM',
        details: 'SaaS Platform multi-tenant architecture initialized with strict tenant isolation and role verification.',
        ipAddress: '10.0.4.1 (Platform Cluster)',
        timestamp: '2026-09-01T06:00:00Z',
      },
      {
        id: 'paud-init-2',
        actorUserId: 'usr-admin-1',
        actorName: 'Alexander Cross',
        actorRole: 'SUPER_ADMIN',
        action: 'TENANT_PROVISIONED',
        contextType: 'PLATFORM',
        targetTenantId: 'tenant-azure',
        targetTenantName: 'Grand Azure Hospitality Group',
        details: 'Provisioned Enterprise SaaS tenant with 2 properties and full module bundle.',
        ipAddress: '10.0.4.1 (Platform Cluster)',
        timestamp: '2026-09-01T06:05:00Z',
      },
      {
        id: 'paud-init-3',
        actorUserId: 'usr-plat-support',
        actorName: 'Maya Lin',
        actorRole: 'SUPPORT_AGENT',
        action: 'ENTER_HOTEL_CONTEXT',
        contextType: 'HOTEL_ADMIN_ACCESS',
        targetTenantId: 'tenant-urban',
        targetTenantName: 'Urban Loft Collection',
        reason: 'Tenant Configuration & Module Onboarding',
        reasonCode: 'configuration',
        details: 'Assisted property owner with onboarding tape chart room types.',
        ipAddress: '198.51.100.22',
        timestamp: '2026-09-01T07:15:00Z',
      },
      {
        id: 'paud-init-4',
        actorUserId: 'usr-plat-support',
        actorName: 'Maya Lin',
        actorRole: 'SUPPORT_AGENT',
        action: 'EXIT_HOTEL_CONTEXT',
        contextType: 'PLATFORM',
        targetTenantId: 'tenant-urban',
        targetTenantName: 'Urban Loft Collection',
        reason: 'Tenant Configuration & Module Onboarding',
        reasonCode: 'configuration',
        durationSeconds: 1240,
        details: 'Completed configuration onboarding session with Urban Loft Collection (20m 40s duration).',
        ipAddress: '198.51.100.22',
        timestamp: '2026-09-01T07:35:40Z',
      },
    ];
  }

  // ==========================================
  // HELPER METHODS FOR MODULAR OS
  // ==========================================

  getDefaultModuleConfig(moduleCode: string): Record<string, any> {
    switch (moduleCode) {
      case 'RESTAURANT':
        return {
          taxRate: 0.08,
          serviceCharge: 0.10,
          operatingHours: '06:30 - 23:00',
          autoSendToKitchen: true,
          allowRoomCharge: true,
          currency: 'USD',
        };
      case 'SWIMMING_POOL':
        return {
          maxCapacity: 45,
          guestComplimentary: true,
          adultDayPassPrice: 35.0,
          childDayPassPrice: 20.0,
          towelRentalPrice: 5.0,
          operatingHours: '07:00 - 21:00',
          waterTestIntervalHours: 4,
        };
      case 'BAR':
        return {
          happyHourEnabled: true,
          happyHourDiscountPercent: 20,
          taxRate: 0.08,
          allowRoomCharge: true,
        };
      case 'INVENTORY':
        return {
          lowStockAlerts: true,
          defaultDepletionMethod: 'FIFO',
          autoGeneratePOOnReorder: false,
        };
      case 'SPA':
        return {
          treatmentRooms: 4,
          depositRequired: true,
          cancellationHours: 24,
        };
      default:
        return {};
    }
  }

  getTenantEntitlement(tenantId: string): TenantEntitlement {
    const tenant = this.tenants.find(t => t.id === tenantId) || this.tenants[0];
    const tier = tenant.subscriptionTier;

    // Base limits according to tier
    const limits = {
      maxProperties: tier === 'enterprise' ? 25 : tier === 'professional' || tier === 'pro' ? 5 : 1,
      maxRooms: tier === 'enterprise' ? 500 : tier === 'professional' || tier === 'pro' ? 80 : 20,
      maxUsers: tier === 'enterprise' ? 100 : tier === 'professional' || tier === 'pro' ? 20 : 5,
      maxOutlets: tier === 'enterprise' ? 15 : tier === 'professional' || tier === 'pro' ? 5 : 1,
      maxPosTerminals: tier === 'enterprise' ? 20 : tier === 'professional' || tier === 'pro' ? 6 : 1,
      maxPoolCapacity: tier === 'enterprise' ? 150 : 50,
      maxInventoryLocations: tier === 'enterprise' ? 20 : tier === 'professional' || tier === 'pro' ? 5 : 1,
    };

    const properties = this.properties.filter(p => p.tenantId === tenantId);
    const rooms = this.rooms.filter(r => r.tenantId === tenantId);
    const users = this.users.filter(u => u.tenantId === tenantId);
    const outlets = this.diningTables.filter(t => t.propertyId === (properties[0]?.id || '')).length;

    return {
      tenantId,
      planTier: tier,
      planStatus: tenant.subscriptionStatus,
      activeAddons: tier === 'enterprise' ? ['SWIMMING_POOL_ADDON', 'FNB_COMPLETE_SUITE', 'SPA_WELLNESS_ADDON'] : [],
      customOverrides: [],
      limits,
      currentUsage: {
        properties: properties.length,
        rooms: rooms.length,
        users: users.length,
        outlets: outlets > 0 ? 2 : 1,
        posTerminals: 3,
        inventoryLocations: this.inventoryLocations.length,
      },
    };
  }

  isModuleEntitled(tenantId: string, moduleCode: string): boolean {
    const mod = this.modules.find(m => m.code === moduleCode);
    if (!mod) return false;
    if (mod.isCore) return true;

    const entitlement = this.getTenantEntitlement(tenantId);
    const plan = entitlement.planTier;

    // Check custom overrides
    const override = entitlement.customOverrides.find(o => o.moduleCode === moduleCode);
    if (override) return override.allowed;

    // Check plan tier requirement
    const tierRanking: Record<string, number> = {
      starter: 1,
      pro: 2,
      professional: 2,
      enterprise: 3,
    };

    const currentRank = tierRanking[plan] || 1;
    const requiredRank = tierRanking[mod.requiredPlanTier] || 1;

    if (currentRank >= requiredRank) return true;

    // Check if covered by an active addon
    const addon = this.addons.find(a => entitlement.activeAddons.includes(a.code) && a.moduleCodes.includes(moduleCode));
    if (addon) return true;

    return false;
  }

  isModuleEnabled(tenantId: string, propertyId: string | undefined, moduleCode: string): boolean {
    const act = this.tenantActivations.find(a =>
      a.tenantId === tenantId &&
      a.moduleCode === moduleCode &&
      (!a.propertyId || !propertyId || a.propertyId === propertyId)
    );
    return act ? act.status === 'ENABLED' : false;
  }

  canEnableModule(tenantId: string, propertyId: string | undefined, moduleCode: string): { allowed: boolean; reason?: string } {
    const mod = this.modules.find(m => m.code === moduleCode);
    if (!mod) return { allowed: false, reason: 'Module does not exist' };

    // 1. Check entitlement
    if (!this.isModuleEntitled(tenantId, moduleCode)) {
      return {
        allowed: false,
        reason: `Module '${mod.name}' requires the ${mod.requiredPlanTier.toUpperCase()} plan or a dedicated Add-on.`,
      };
    }

    // 2. Check dependencies
    for (const depCode of mod.dependencies) {
      const isDepActive = this.isModuleEnabled(tenantId, propertyId, depCode);
      if (!isDepActive) {
        const depMod = this.modules.find(m => m.code === depCode);
        return {
          allowed: false,
          reason: `Required dependency '${depMod?.name || depCode}' must be enabled first.`,
        };
      }
    }

    return { allowed: true };
  }

  enableModule(tenantId: string, propertyId: string | undefined, moduleCode: string, userId: string): { success: boolean; message?: string } {
    const check = this.canEnableModule(tenantId, propertyId, moduleCode);
    if (!check.allowed) {
      return { success: false, message: check.reason };
    }

    const existingIdx = this.tenantActivations.findIndex(a =>
      a.tenantId === tenantId &&
      a.moduleCode === moduleCode &&
      a.propertyId === propertyId
    );

    if (existingIdx >= 0) {
      this.tenantActivations[existingIdx].status = 'ENABLED';
      this.tenantActivations[existingIdx].enabledAt = new Date().toISOString();
      this.tenantActivations[existingIdx].enabledBy = userId;
    } else {
      this.tenantActivations.push({
        id: `act-${tenantId}-${moduleCode.toLowerCase()}-${Date.now()}`,
        tenantId,
        propertyId,
        moduleCode,
        status: 'ENABLED',
        enabledAt: new Date().toISOString(),
        enabledBy: userId,
        configuration: this.getDefaultModuleConfig(moduleCode),
      });
    }

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      propertyId,
      userId,
      userName: 'Administrator',
      action: 'MODULE_ENABLED',
      details: `Enabled module '${moduleCode}'${propertyId ? ` for property ${propertyId}` : ' tenant-wide'}.`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  disableModule(tenantId: string, propertyId: string | undefined, moduleCode: string, userId: string): { success: boolean; message?: string } {
    const mod = this.modules.find(m => m.code === moduleCode);
    if (mod?.isCore) {
      return { success: false, message: 'Core PMS modules cannot be disabled.' };
    }

    // Check if other active modules depend on this one
    const dependentModules = this.modules.filter(m =>
      m.dependencies.includes(moduleCode) &&
      this.isModuleEnabled(tenantId, propertyId, m.code)
    );

    if (dependentModules.length > 0) {
      const names = dependentModules.map(m => m.name).join(', ');
      return {
        success: false,
        message: `Cannot disable '${mod?.name || moduleCode}' because active modules (${names}) depend on it. Please disable them first.`,
      };
    }

    const act = this.tenantActivations.find(a =>
      a.tenantId === tenantId &&
      a.moduleCode === moduleCode &&
      a.propertyId === propertyId
    );

    if (act) {
      act.status = 'DISABLED';
      act.disabledAt = new Date().toISOString();
      act.disabledBy = userId;
    }

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      propertyId,
      userId,
      userName: 'Administrator',
      action: 'MODULE_DISABLED',
      details: `Disabled module '${moduleCode}'. Historical data and folios remain fully intact.`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  updateModuleConfig(tenantId: string, propertyId: string | undefined, moduleCode: string, configuration: Record<string, any>, userId: string) {
    let act = this.tenantActivations.find(a =>
      a.tenantId === tenantId &&
      a.moduleCode === moduleCode &&
      a.propertyId === propertyId
    );

    if (!act) {
      act = {
        id: `act-${tenantId}-${moduleCode.toLowerCase()}-${Date.now()}`,
        tenantId,
        propertyId,
        moduleCode,
        status: 'ENABLED',
        enabledAt: new Date().toISOString(),
        configuration: {},
      };
      this.tenantActivations.push(act);
    }

    act.configuration = { ...act.configuration, ...configuration };

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      propertyId,
      userId,
      userName: 'Administrator',
      action: 'MODULE_CONFIG_UPDATED',
      details: `Updated operational configuration for '${moduleCode}'.`,
      timestamp: new Date().toISOString(),
    });

    return act;
  }

  chargeRoomFolio(
    tenantId: string,
    propertyId: string,
    reservationId: string,
    description: string,
    category: 'room' | 'tax' | 'fee' | 'minibar' | 'fnb' | 'laundry' | 'other',
    amount: number,
    quantity: number = 1
  ): Reservation {
    const reservation = this.reservations.find(r => r.id === reservationId && r.tenantId === tenantId);
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    const folioItem: any = {
      id: `fol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      description,
      category,
      amount,
      quantity,
    };

    reservation.folio.push(folioItem);
    reservation.subtotal += amount * quantity;
    reservation.totalAmount += amount * quantity;
    reservation.balanceDue = Math.max(0, reservation.totalAmount - reservation.paidAmount);
    reservation.updatedAt = new Date().toISOString();

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      propertyId,
      action: 'FOLIO_CHARGE_CREATED',
      details: `Charged $${(amount * quantity).toFixed(2)} (${description}) to Folio of Res #${reservation.reservationCode} (Room ${reservation.roomTypeId})`,
      timestamp: new Date().toISOString(),
    });

    return reservation;
  }

  recordStockMovement(
    propertyId: string,
    productId: string,
    type: 'PURCHASE' | 'SALE' | 'CONSUMPTION' | 'WASTE' | 'DAMAGE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN',
    quantityChange: number,
    costValue: number,
    performedBy: string,
    options: { reference?: string; fromLocationId?: string; toLocationId?: string; notes?: string } = {}
  ): StockMovement {
    const product = this.inventoryProducts.find(p => p.id === productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    product.currentStock += quantityChange;

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      propertyId,
      productId,
      productName: product.name,
      type,
      quantityChange,
      unit: product.unit,
      costValue,
      fromLocationId: options.fromLocationId,
      toLocationId: options.toLocationId,
      reference: options.reference,
      performedBy,
      timestamp: new Date().toISOString(),
      notes: options.notes,
    };

    this.stockMovements.unshift(movement);
    return movement;
  }

  addAuditLog(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
  }

  // --- IDENTITY, ROLES & PERMISSION MANAGEMENT METHODS ---
  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserPermissions(userId: string): PermissionCode[] {
    const user = this.getUser(userId);
    if (!user) return [];
    if (user.role === 'SUPER_ADMIN') {
      return this.permissions.map(p => p.code);
    }
    const role = this.roles.find(r => r.id === user.roleId || r.code === user.role);
    const rolePerms = role ? role.permissions : [];
    const directPerms = user.permissions || [];
    return Array.from(new Set([...rolePerms, ...directPerms]));
  }

  createRole(roleData: Omit<UserRoleDefinition, 'id'>): UserRoleDefinition {
    const newRole: UserRoleDefinition = {
      ...roleData,
      id: `role-custom-${Date.now()}`,
      category: 'custom',
      isSystem: false,
    };
    this.roles.push(newRole);
    return newRole;
  }

  updateRole(id: string, updates: Partial<UserRoleDefinition>): UserRoleDefinition {
    const index = this.roles.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Role ${id} not found`);
    if (this.roles[index].isSystem && updates.permissions === undefined) {
      // Allowed to adjust permissions or description, but keep system code
    }
    this.roles[index] = { ...this.roles[index], ...updates };
    return this.roles[index];
  }

  deleteRole(id: string): boolean {
    const role = this.roles.find(r => r.id === id);
    if (!role) throw new Error(`Role ${id} not found`);
    if (role.isSystem) throw new Error('Cannot delete core system roles');
    this.roles = this.roles.filter(r => r.id !== id);
    return true;
  }

  createUser(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      active: true,
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);
    this.users[index].active = false;
    return true;
  }

  // =========================================================================
  // --- SAAS PLATFORM ADMINISTRATION & AUDITED HOTEL ACCESS METHODS ---
  // =========================================================================

  getPlatformMetrics(): PlatformMetrics {
    const totalTenants = this.tenants.length;
    const activeTenants = this.tenants.filter(t => t.subscriptionStatus === 'active').length;
    const trialingTenants = this.tenants.filter(t => t.subscriptionStatus === 'trialing').length;
    const suspendedTenants = this.tenants.filter(t => t.subscriptionStatus === 'suspended' || t.subscriptionStatus === 'past_due').length;
    const totalProperties = this.properties.length;
    const totalRooms = this.rooms.length;
    const totalPlatformUsers = this.users.filter(u => u.tenantId === 'platform').length;

    // Calculate MRR from subscription plans
    const mrr = this.tenants.reduce((sum, tenant) => {
      if (tenant.subscriptionStatus !== 'active' && tenant.subscriptionStatus !== 'trialing') return sum;
      if (tenant.subscriptionTier === 'enterprise') return sum + 799;
      if (tenant.subscriptionTier === 'professional') return sum + 349;
      return sum + 149;
    }, 0);

    // Global module adoptions across tenants
    const globalModuleAdoptions: Record<string, number> = {};
    for (const act of this.tenantActivations) {
      if (act.status === 'ENABLED') {
        globalModuleAdoptions[act.moduleCode] = (globalModuleAdoptions[act.moduleCode] || 0) + 1;
      }
    }

    return {
      totalTenants,
      activeTenants,
      trialingTenants,
      suspendedTenants,
      totalProperties,
      totalRooms,
      totalPlatformUsers,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: mrr * 12,
      failedPaymentsCount: this.platformInvoices.filter(i => i.status === 'failed' || i.status === 'overdue').length,
      globalModuleAdoptions,
      activeOtaConnections: this.channelConnections.filter(c => c.isConnected).length,
      apiRequests24h: 38450,
      systemUptimePercentage: 99.98,
      averageResponseTimeMs: 42,
    };
  }

  getPlatformTenantsDetailed(): PlatformTenantDetail[] {
    return this.tenants.map(tenant => {
      const props = this.properties.filter(p => p.tenantId === tenant.id);
      const propIds = props.map(p => p.id);
      const rooms = this.rooms.filter(r => propIds.includes(r.propertyId));
      const users = this.users.filter(u => u.tenantId === tenant.id);
      const activeMods = this.tenantActivations
        .filter(a => a.tenantId === tenant.id && a.status === 'ENABLED')
        .map(a => a.moduleCode);

      const fee = tenant.subscriptionTier === 'enterprise' ? 799 : tenant.subscriptionTier === 'professional' ? 349 : 149;

      return {
        ...tenant,
        propertiesCount: props.length,
        roomsCount: rooms.length,
        usersCount: users.length,
        activeModules: activeMods,
        monthlyFee: fee,
        billingContactEmail: users[0]?.email || `admin@${tenant.slug}.com`,
        nextBillingDate: '2026-09-15',
        lastActiveAt: users[0]?.lastLoginAt || tenant.createdAt,
      };
    });
  }

  startHotelAccessSession(params: {
    actorUserId: string;
    targetTenantId: string;
    reason: HotelAccessReasonCode;
    notes?: string;
    ipAddress?: string;
  }): TemporaryHotelAccessSession {
    const actor = this.getUser(params.actorUserId);
    if (!actor) {
      throw new Error(`Platform user '${params.actorUserId}' not found`);
    }

    // Verify user has platform.hotel_access permission
    const permissions = this.getUserPermissions(actor.id);
    if (!permissions.includes('platform.hotel_access') && actor.role !== 'SUPER_ADMIN') {
      throw new Error(`User '${actor.name}' does not have the 'platform.hotel_access' permission required to enter hotel contexts`);
    }

    const tenant = this.tenants.find(t => t.id === params.targetTenantId);
    if (!tenant) {
      throw new Error(`Target hotel tenant '${params.targetTenantId}' not found`);
    }

    const reasonLabels: Record<HotelAccessReasonCode, string> = {
      customer_support: 'Customer Support Request / Troubleshooting',
      troubleshooting: 'Technical Diagnostic & Error Resolution',
      configuration: 'Tenant Configuration & Module Onboarding',
      security_investigation: 'Security Audit & Compliance Review',
      billing_tier: 'Subscription Upgrade / Provisioning Review',
      other: 'Authorized Administrative Operational Request',
    };

    const session: TemporaryHotelAccessSession = {
      sessionId: `has-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetTenantId: tenant.id,
      targetTenantName: tenant.name,
      targetTenantPlan: tenant.subscriptionTier,
      reason: params.reason,
      reasonLabel: reasonLabels[params.reason] || params.reason,
      notes: params.notes,
      startedAt: new Date().toISOString(),
      ipAddress: params.ipAddress || '127.0.0.1 (AI-Studio-Session)',
    };

    // Terminate any previous session for this actor
    this.activeHotelAccessSessions = this.activeHotelAccessSessions.filter(s => s.actorUserId !== actor.id);
    this.activeHotelAccessSessions.push(session);

    // Record in dedicated AuditService (IMPERSONATION_STARTED)
    auditService.logImpersonationStarted({
      actor: {
        userId: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
      },
      targetTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.subscriptionTier,
      },
      reason: session.reasonLabel,
      reasonCode: params.reason,
      notes: params.notes,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
    });

    // Write persistent Platform Audit Log
    this.addPlatformAuditLog({
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'IMPERSONATION_STARTED',
      contextType: 'HOTEL_ADMIN_ACCESS',
      targetTenantId: tenant.id,
      targetTenantName: tenant.name,
      reason: session.reasonLabel,
      reasonCode: params.reason,
      details: `[IMPERSONATION_STARTED] Super Admin entered hotel '${tenant.name}' with reason: "${session.reasonLabel}". Notes: "${params.notes || 'None'}"`,
      ipAddress: session.ipAddress || '127.0.0.1',
    });

    return session;
  }

  endHotelAccessSession(sessionId: string): PlatformAuditLog | null {
    const sessionIndex = this.activeHotelAccessSessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) {
      // If not found by sessionId, maybe by user
      return null;
    }

    const session = this.activeHotelAccessSessions[sessionIndex];
    const endedAt = new Date().toISOString();
    const durationSeconds = Math.round((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);

    this.activeHotelAccessSessions.splice(sessionIndex, 1);

    const actor = this.getUser(session.actorUserId);

    // Record in dedicated AuditService (IMPERSONATION_ENDED)
    auditService.logImpersonationEnded({
      actor: {
        userId: session.actorUserId,
        name: session.actorName,
        email: actor?.email,
        role: session.actorRole,
      },
      targetTenant: {
        id: session.targetTenantId,
        name: session.targetTenantName,
        plan: session.targetTenantPlan,
      },
      reason: session.reasonLabel,
      reasonCode: session.reason,
      notes: session.notes,
      sessionId: session.sessionId,
      durationSeconds,
      ipAddress: session.ipAddress,
    });

    // Record Exit Audit Log
    const auditLog = this.addPlatformAuditLog({
      actorUserId: session.actorUserId,
      actorName: session.actorName,
      actorRole: session.actorRole,
      action: 'IMPERSONATION_ENDED',
      contextType: 'PLATFORM',
      targetTenantId: session.targetTenantId,
      targetTenantName: session.targetTenantName,
      reason: session.reasonLabel,
      reasonCode: session.reason,
      durationSeconds,
      details: `[IMPERSONATION_ENDED] Super Admin exited hotel '${session.targetTenantName}'. Active session duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s.`,
      ipAddress: session.ipAddress || '127.0.0.1',
    });

    return auditLog;
  }

  getActiveHotelAccessSession(userId: string): TemporaryHotelAccessSession | null {
    return this.activeHotelAccessSessions.find(s => s.actorUserId === userId) || null;
  }

  addPlatformAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): PlatformAuditLog {
    const entry: PlatformAuditLog = {
      ...log,
      id: `paud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.platformAuditLogs.unshift(entry);
    return entry;
  }
}

export const db = new HotelDatabase();
