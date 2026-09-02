import { PermissionDefinition, UserRoleDefinition, PermissionCode, User } from '../src/types';

// =========================================================================
// 1. MASTER PERMISSION CATALOG
// =========================================================================
export const PERMISSIONS_CATALOG: PermissionDefinition[] = [
  // PMS & Tape Chart
  { code: 'pms.tape_chart.view', name: 'View Tape Chart Calendar', category: 'PMS & Tape Chart', description: 'Access live multi-room tape chart and occupancy grid' },
  { code: 'pms.rooms.view', name: 'View Rooms Directory', category: 'PMS & Tape Chart', description: 'View physical rooms and room type inventory' },
  { code: 'pms.rooms.manage', name: 'Manage Room Inventory', category: 'PMS & Tape Chart', description: 'Create, update, and configure physical rooms and room types' },
  { code: 'pms.rooms.status_update', name: 'Update Room Status', category: 'PMS & Tape Chart', description: 'Change room state (clean, dirty, inspected, maintenance)' },

  // Reservations & Front Desk
  { code: 'reservations.view', name: 'View Reservations', category: 'Reservations & Front Desk', description: 'View reservations list and guest booking records' },
  { code: 'reservations.create', name: 'Create Reservations', category: 'Reservations & Front Desk', description: 'Book new direct, phone, and walk-in reservations' },
  { code: 'reservations.edit', name: 'Edit Reservations', category: 'Reservations & Front Desk', description: 'Modify dates, rates, guest counts, and special requests' },
  { code: 'reservations.cancel', name: 'Cancel Reservations', category: 'Reservations & Front Desk', description: 'Cancel existing bookings with reason tracking' },
  { code: 'reservations.check_in', name: 'Check In Guests', category: 'Reservations & Front Desk', description: 'Perform check-in workflows, key assignments, and room lock' },
  { code: 'reservations.check_out', name: 'Check Out Guests', category: 'Reservations & Front Desk', description: 'Perform check-out workflows and trigger housekeeping turnover' },
  { code: 'reservations.assign_room', name: 'Assign Physical Rooms', category: 'Reservations & Front Desk', description: 'Assign or reassign physical rooms to reservations' },

  // Guest CRM
  { code: 'guests.view', name: 'View Guest Profiles', category: 'Guest CRM', description: 'Browse guest CRM database, stay histories, and notes' },
  { code: 'guests.manage', name: 'Manage Guest Profiles', category: 'Guest CRM', description: 'Edit guest contact info, identification, and documents' },
  { code: 'guests.vip_tag', name: 'Manage VIP Status', category: 'Guest CRM', description: 'Assign or revoke guest VIP tags and customized amenities' },

  // Folio & Billing
  { code: 'folio.view', name: 'View Guest Folios', category: 'Folio & Billing', description: 'Inspect room bills, line-item charges, and balances' },
  { code: 'folio.charge', name: 'Post Folio Charges', category: 'Folio & Billing', description: 'Add room charges, restaurant tabs, and incidental fees' },
  { code: 'folio.adjust', name: 'Adjust & Void Charges', category: 'Folio & Billing', description: 'Modify existing folio lines, discounts, or fee waivers' },
  { code: 'folio.payment_record', name: 'Record Payments', category: 'Folio & Billing', description: 'Process credit card, cash, bank transfer, and OTA payments' },
  { code: 'folio.refund', name: 'Issue Refunds', category: 'Folio & Billing', description: 'Authorize and disburse payment refunds' },

  // Housekeeping
  { code: 'housekeeping.view', name: 'View Housekeeping Queue', category: 'Housekeeping', description: 'Inspect room clean statuses and housekeeping assignments' },
  { code: 'housekeeping.task_assign', name: 'Assign Cleaning Tasks', category: 'Housekeeping', description: 'Dispatch turnover and deep-clean tasks to staff' },
  { code: 'housekeeping.status_update', name: 'Mark Rooms Cleaned / Inspected', category: 'Housekeeping', description: 'Update room clean state and inspect VIP suites' },

  // Maintenance
  { code: 'maintenance.view', name: 'View Work Orders', category: 'Maintenance', description: 'View facilities maintenance work orders and status' },
  { code: 'maintenance.ticket_create', name: 'Create Work Orders', category: 'Maintenance', description: 'Submit maintenance repair requests' },
  { code: 'maintenance.ticket_resolve', name: 'Resolve Work Orders', category: 'Maintenance', description: 'Close work orders and return rooms to turnover' },
  { code: 'maintenance.room_block', name: 'Block Rooms (Out of Order)', category: 'Maintenance', description: 'Set rooms to Out of Order (OOO) and deduct from channel inventory' },

  // Channel Manager & Rates
  { code: 'channels.view', name: 'View Channel Connections', category: 'Channel Manager & Rates', description: 'Inspect OTA connections (Booking.com, Airbnb, Expedia)' },
  { code: 'channels.configure', name: 'Configure OTA Credentials', category: 'Channel Manager & Rates', description: 'Manage channel API keys, credentials, and settings' },
  { code: 'channels.sync_trigger', name: 'Trigger Manual Channel Sync', category: 'Channel Manager & Rates', description: 'Push rates and availability to OTAs on demand' },
  { code: 'channels.mapping_manage', name: 'Manage Room & Rate Mappings', category: 'Channel Manager & Rates', description: 'Map internal room types to external OTA listing IDs' },
  { code: 'rates.view', name: 'View Rates Matrix', category: 'Channel Manager & Rates', description: 'Inspect dynamic rates, daily pricing, and restrictions' },
  { code: 'rates.manage', name: 'Manage Rates & Overrides', category: 'Channel Manager & Rates', description: 'Set daily rate overrides and seasonal pricing rules' },
  { code: 'rates.restrictions_manage', name: 'Manage Stop-Sell & Min Stay', category: 'Channel Manager & Rates', description: 'Toggle stop-sell, CTA, CTD, and minimum stay limits' },

  // Food & Beverage / POS
  { code: 'fnb.tables.view', name: 'View Dining Tables', category: 'Food & Beverage / POS', description: 'View floor plans, table statuses, and seating capacity' },
  { code: 'fnb.menu.manage', name: 'Manage Menus & Modifiers', category: 'Food & Beverage / POS', description: 'Create and update menu items, prices, and stations' },
  { code: 'fnb.order.create', name: 'Create POS Orders', category: 'Food & Beverage / POS', description: 'Take table, bar, and takeaway dining orders' },
  { code: 'fnb.order.settle', name: 'Settle POS Orders', category: 'Food & Beverage / POS', description: 'Accept direct cash/card payment on restaurant orders' },
  { code: 'fnb.order.charge_room', name: 'Post Order to Room Folio', category: 'Food & Beverage / POS', description: 'Route dining bill directly to in-house guest room folio' },

  // Kitchen Display (KDS)
  { code: 'kds.view', name: 'View KDS Ticket Board', category: 'Kitchen Display (KDS)', description: 'View active chef order tickets with live preparation timers' },
  { code: 'kds.bump_ticket', name: 'Bump / Complete KDS Tickets', category: 'Kitchen Display (KDS)', description: 'Mark dish preparation stations as ready and served' },

  // Swimming Pool & Leisure
  { code: 'pool.view', name: 'View Pool Occupancy & Facilities', category: 'Swimming Pool & Leisure', description: 'Monitor pool capacity, current occupancy, and guest count' },
  { code: 'pool.pass_issue', name: 'Issue Pool Day Passes & Towels', category: 'Swimming Pool & Leisure', description: 'Check in hotel guests and external visitors, log towels' },
  { code: 'pool.charge_room', name: 'Charge Pool Passes to Room', category: 'Swimming Pool & Leisure', description: 'Post pool day pass or towel fees to guest room folio' },
  { code: 'pool.water_log', name: 'Log Water Chemistry & Quality', category: 'Swimming Pool & Leisure', description: 'Record pH, chlorine, water temp, and clarity inspections' },

  // Inventory & Purchasing
  { code: 'inventory.view', name: 'View Inventory & Stock', category: 'Inventory & Purchasing', description: 'Inspect stock levels across central warehouse and outlets' },
  { code: 'inventory.adjust', name: 'Adjust Stock & Log Waste', category: 'Inventory & Purchasing', description: 'Record stock adjustments, spoilage, and transfers' },
  { code: 'inventory.product_manage', name: 'Manage Product Catalog', category: 'Inventory & Purchasing', description: 'Create and configure stock SKUs, reorder levels, and prices' },
  { code: 'purchasing.po_create', name: 'Create Purchase Orders', category: 'Inventory & Purchasing', description: 'Issue POs to approved vendors and suppliers' },
  { code: 'purchasing.po_receive', name: 'Receive PO Shipments', category: 'Inventory & Purchasing', description: 'Accept incoming deliveries and automatically replenish stock' },

  // Finance & Reports
  { code: 'finance.ledger_view', name: 'View Financial Ledger & Expenses', category: 'Finance & Reports', description: 'Inspect revenue ledger, operational expenses, and invoices' },
  { code: 'finance.expense_manage', name: 'Record & Approve Expenses', category: 'Finance & Reports', description: 'Post vendor bills, utility expenses, and payroll items' },
  { code: 'reports.analytics_view', name: 'View Analytics & KPI Reports', category: 'Finance & Reports', description: 'Inspect ADR, RevPAR, Occupancy, and channel distributions' },
  { code: 'reports.financial_export', name: 'Export Financial Reports', category: 'Finance & Reports', description: 'Download CSV and accounting reconciliation reports' },

  // Settings & Security
  { code: 'settings.property_manage', name: 'Manage Property Settings', category: 'Settings & Security', description: 'Configure hotel profile, address, taxes, and fees' },
  { code: 'settings.policies_manage', name: 'Manage Operating Policies', category: 'Settings & Security', description: 'Configure check-in/out times, cancellation rules, and terms' },
  { code: 'users.view', name: 'View Staff & Team Directory', category: 'Settings & Security', description: 'Inspect hotel staff members, assigned roles, and scopes' },
  { code: 'users.manage', name: 'Manage Users & Scopes', category: 'Settings & Security', description: 'Invite staff, assign property/outlet scopes, activate accounts' },
  { code: 'roles.view', name: 'View Roles & Permissions', category: 'Settings & Security', description: 'Inspect permission assignments across all user roles' },
  { code: 'roles.manage', name: 'Create & Edit Custom Roles', category: 'Settings & Security', description: 'Define custom hotel roles and tailor granular permission sets' },
  { code: 'modules.view', name: 'View Module Manager', category: 'Settings & Security', description: 'View available hotel operating system modules and status' },
  { code: 'modules.toggle', name: 'Enable & Configure Modules', category: 'Settings & Security', description: 'Activate, deactivate, and configure operational add-ons' },
  { code: 'audit.view', name: 'View Security Audit Trail', category: 'Settings & Security', description: 'Inspect system audit logs, user actions, and security events' },

  // Platform Administration (SaaS Platform Context Only)
  { code: 'platform.dashboard.view', name: 'View Platform Overview Dashboard', category: 'Platform Administration', description: 'View global SaaS MRR, active hotels, aggregate health, and adoption metrics' },
  { code: 'platform.tenants.view', name: 'View Tenants Directory', category: 'Platform Administration', description: 'Browse all hotel tenant accounts, plans, usage, and statuses' },
  { code: 'platform.tenants.manage', name: 'Manage Tenants & Subscriptions', category: 'Platform Administration', description: 'Provision, configure, suspend, or update hotel tenants' },
  { code: 'platform.subscriptions.view', name: 'View SaaS Plans & Add-ons', category: 'Platform Administration', description: 'Inspect SaaS subscription tiers, pricing, and limits' },
  { code: 'platform.subscriptions.manage', name: 'Manage Plans & Pricing', category: 'Platform Administration', description: 'Create and update subscription tiers, pricing packages, and add-ons' },
  { code: 'platform.billing.view', name: 'View SaaS Billing & Invoices', category: 'Platform Administration', description: 'Inspect platform customer billing, payments, and invoices' },
  { code: 'platform.billing.manage', name: 'Manage SaaS Invoicing & Gateways', category: 'Platform Administration', description: 'Issue manual invoices, retry failed payments, and manage Stripe gateway' },
  { code: 'platform.modules.view', name: 'View Platform Module Registry', category: 'Platform Administration', description: 'Inspect global module registry, versions, and feature flags' },
  { code: 'platform.modules.manage', name: 'Manage Global Modules & Flags', category: 'Platform Administration', description: 'Deploy new modules, toggle feature flags, and update global configuration' },
  { code: 'platform.users.view', name: 'View Platform Administrators', category: 'Platform Administration', description: 'Inspect platform staff, support agents, and technical team' },
  { code: 'platform.users.manage', name: 'Manage Platform Users & Roles', category: 'Platform Administration', description: 'Invite platform staff and configure platform RBAC permissions' },
  { code: 'platform.roles.view', name: 'View Platform Roles', category: 'Platform Administration', description: 'View platform role definitions and access matrices' },
  { code: 'platform.roles.manage', name: 'Manage Platform Roles', category: 'Platform Administration', description: 'Configure system platform role permissions' },
  { code: 'platform.permissions.manage', name: 'Manage Platform Permissions', category: 'Platform Administration', description: 'Update system permission rules and enforcement policies' },
  { code: 'platform.apis.view', name: 'View Platform APIs & Webhooks', category: 'Platform Administration', description: 'Inspect API client registry, quotas, usage stats, and webhooks' },
  { code: 'platform.apis.manage', name: 'Manage API Clients & Keys', category: 'Platform Administration', description: 'Issue API client credentials, adjust rate limits, and configure webhooks' },
  { code: 'platform.integrations.view', name: 'View SaaS Integrations', category: 'Platform Administration', description: 'Monitor OTA gateways, payment gateways, and communication services' },
  { code: 'platform.integrations.manage', name: 'Manage SaaS Integrations', category: 'Platform Administration', description: 'Configure global integration credentials, webhooks, and endpoints' },
  { code: 'platform.system.view', name: 'View System Health & Queues', category: 'Platform Administration', description: 'Monitor database health, background queues, and latency' },
  { code: 'platform.system.manage', name: 'Manage System Telemetry & Jobs', category: 'Platform Administration', description: 'Trigger maintenance, purge cache, retry failed jobs, and manage backups' },
  { code: 'platform.audit.view', name: 'View Platform Audit Trail', category: 'Platform Administration', description: 'Inspect platform security logs and hotel access session history' },
  { code: 'platform.settings.view', name: 'View Platform Settings', category: 'Platform Administration', description: 'View global SaaS branding, security, and email settings' },
  { code: 'platform.settings.manage', name: 'Manage Platform Settings', category: 'Platform Administration', description: 'Configure SaaS branding, domain routing, and platform policies' },
  { code: 'platform.hotel_access', name: 'Authorized Hotel Context Access', category: 'Platform Administration', description: 'Explicitly enter audited hotel operational context with mandatory reason' },
];

// Helper: Get all permission codes
export const ALL_PERMISSION_CODES: PermissionCode[] = PERMISSIONS_CATALOG.map(p => p.code);

// =========================================================================
// 2. PREDEFINED SYSTEM ROLES & PERMISSION SETS
// =========================================================================
export const DEFAULT_ROLES: UserRoleDefinition[] = [
  // PLATFORM ROLES (SaaS Platform Context)
  {
    id: 'role-super-admin',
    code: 'SUPER_ADMIN',
    name: 'SaaS Platform Super Admin',
    description: 'Full global platform administration across all tenants, subscriptions, modules, APIs, and audited hotel access.',
    category: 'platform',
    isSystem: true,
    defaultLandingView: 'platform-dashboard',
    allowedOutlets: ['*'],
    permissions: ALL_PERMISSION_CODES,
  },
  {
    id: 'role-platform-admin',
    code: 'PLATFORM_ADMIN',
    name: 'Platform Operations Administrator',
    description: 'Manages SaaS tenants, subscriptions, platform modules, and system infrastructure. (Does not enter hotels unless granted hotel_access).',
    category: 'platform',
    isSystem: true,
    defaultLandingView: 'platform-dashboard',
    allowedOutlets: ['*'],
    permissions: [
      'platform.dashboard.view',
      'platform.tenants.view',
      'platform.tenants.manage',
      'platform.subscriptions.view',
      'platform.subscriptions.manage',
      'platform.billing.view',
      'platform.modules.view',
      'platform.modules.manage',
      'platform.users.view',
      'platform.system.view',
      'platform.audit.view',
      'platform.settings.view',
    ],
  },
  {
    id: 'role-support-agent',
    code: 'SUPPORT_AGENT',
    name: 'Platform Customer Support Specialist',
    description: 'Assists customer hotels with troubleshooting, configuration, and inquiries via audited temporary hotel access sessions.',
    category: 'platform',
    isSystem: true,
    defaultLandingView: 'platform-dashboard',
    allowedOutlets: ['*'],
    permissions: [
      'platform.dashboard.view',
      'platform.tenants.view',
      'platform.modules.view',
      'platform.audit.view',
      'platform.hotel_access', // Explicit permission to enter hotel with audit
    ],
  },
  {
    id: 'role-finance-admin',
    code: 'FINANCE_ADMIN',
    name: 'Platform Billing & Finance Director',
    description: 'Manages SaaS subscription revenues, plans, MRR reporting, and payment gateway collections.',
    category: 'platform',
    isSystem: true,
    defaultLandingView: 'platform-dashboard',
    allowedOutlets: ['*'],
    permissions: [
      'platform.dashboard.view',
      'platform.tenants.view',
      'platform.subscriptions.view',
      'platform.subscriptions.manage',
      'platform.billing.view',
      'platform.billing.manage',
      'platform.audit.view',
    ],
  },
  {
    id: 'role-technical-admin',
    code: 'TECHNICAL_ADMIN',
    name: 'Platform Infrastructure & API Engineer',
    description: 'Maintains API clients, webhooks, OTA adapters, database performance, background queues, and system telemetry.',
    category: 'platform',
    isSystem: true,
    defaultLandingView: 'platform-dashboard',
    allowedOutlets: ['*'],
    permissions: [
      'platform.dashboard.view',
      'platform.modules.view',
      'platform.apis.view',
      'platform.apis.manage',
      'platform.integrations.view',
      'platform.integrations.manage',
      'platform.system.view',
      'platform.system.manage',
      'platform.audit.view',
    ],
  },

  // HOTEL ROLES (Tenant Context)
  {
    id: 'role-property-owner',
    code: 'PROPERTY_OWNER',
    name: 'Hotel Owner / Executive',
    description: 'Executive authority across all tenant properties, financial reporting, module activations, team roles, and settings.',
    category: 'hotel_executive',
    isSystem: true,
    defaultLandingView: 'dashboard',
    allowedOutlets: ['*'],
    permissions: ALL_PERMISSION_CODES.filter(p => !p.startsWith('platform.')),
  },
  {
    id: 'role-property-manager',
    code: 'PROPERTY_MANAGER',
    name: 'General / Property Manager',
    description: 'Operational leadership across assigned properties, reservations, rates, channels, staff tasks, and folios.',
    category: 'hotel_executive',
    isSystem: true,
    defaultLandingView: 'dashboard',
    allowedOutlets: ['*'],
    permissions: [
      'pms.tape_chart.view', 'pms.rooms.view', 'pms.rooms.manage', 'pms.rooms.status_update',
      'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel', 'reservations.check_in', 'reservations.check_out', 'reservations.assign_room',
      'guests.view', 'guests.manage', 'guests.vip_tag',
      'folio.view', 'folio.charge', 'folio.adjust', 'folio.payment_record',
      'housekeeping.view', 'housekeeping.task_assign', 'housekeeping.status_update',
      'maintenance.view', 'maintenance.ticket_create', 'maintenance.ticket_resolve', 'maintenance.room_block',
      'channels.view', 'channels.configure', 'channels.sync_trigger', 'channels.mapping_manage',
      'rates.view', 'rates.manage', 'rates.restrictions_manage',
      'fnb.tables.view', 'fnb.menu.manage', 'fnb.order.create', 'fnb.order.settle', 'fnb.order.charge_room',
      'kds.view', 'kds.bump_ticket',
      'pool.view', 'pool.pass_issue', 'pool.charge_room', 'pool.water_log',
      'inventory.view', 'inventory.adjust', 'inventory.product_manage', 'purchasing.po_create', 'purchasing.po_receive',
      'finance.ledger_view', 'finance.expense_manage', 'reports.analytics_view', 'reports.financial_export',
      'settings.property_manage', 'settings.policies_manage', 'users.view', 'users.manage', 'roles.view', 'modules.view', 'audit.view'
    ],
  },
  {
    id: 'role-front-desk',
    code: 'FRONT_DESK',
    name: 'Front Desk Officer / Receptionist',
    description: 'Front desk operations, guest check-in/out, tape chart, reservations, room key assignment, and incidental folio charges.',
    category: 'hotel_operations',
    isSystem: true,
    defaultLandingView: 'frontdesk',
    allowedOutlets: ['*'],
    permissions: [
      'pms.tape_chart.view', 'pms.rooms.view', 'pms.rooms.status_update',
      'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.check_in', 'reservations.check_out', 'reservations.assign_room',
      'guests.view', 'guests.manage',
      'folio.view', 'folio.charge', 'folio.payment_record',
      'housekeeping.view',
      'maintenance.view', 'maintenance.ticket_create',
      'fnb.order.charge_room',
      'pool.pass_issue', 'pool.charge_room',
      'reports.analytics_view'
    ],
  },
  {
    id: 'role-housekeeping',
    code: 'HOUSEKEEPING',
    name: 'Housekeeping Lead / Supervisor',
    description: 'Room turnover management, staff cleaning queue assignment, and inspecting clean suites.',
    category: 'hotel_operations',
    isSystem: true,
    defaultLandingView: 'housekeeping',
    allowedOutlets: ['loc-hk'],
    permissions: [
      'pms.rooms.view', 'pms.rooms.status_update',
      'housekeeping.view', 'housekeeping.task_assign', 'housekeeping.status_update',
      'maintenance.view', 'maintenance.ticket_create',
      'inventory.view'
    ],
  },
  {
    id: 'role-maintenance',
    code: 'MAINTENANCE',
    name: 'Facilities Maintenance Engineer',
    description: 'Work order dispatch, equipment repairs, room Out of Order (OOO) status blocking, and facility upkeep.',
    category: 'hotel_operations',
    isSystem: true,
    defaultLandingView: 'maintenance',
    allowedOutlets: ['loc-maint'],
    permissions: [
      'pms.rooms.view', 'pms.rooms.status_update',
      'maintenance.view', 'maintenance.ticket_create', 'maintenance.ticket_resolve', 'maintenance.room_block',
      'pool.water_log',
      'inventory.view'
    ],
  },
  {
    id: 'role-finance',
    code: 'FINANCE',
    name: 'Finance Controller / Accountant',
    description: 'Guest folios, payment reconciliation, night audit, ledger, operating expenses, and financial export.',
    category: 'hotel_executive',
    isSystem: true,
    defaultLandingView: 'finance',
    allowedOutlets: ['*'],
    permissions: [
      'folio.view', 'folio.charge', 'folio.adjust', 'folio.payment_record', 'folio.refund',
      'finance.ledger_view', 'finance.expense_manage',
      'reports.analytics_view', 'reports.financial_export',
      'reservations.view', 'guests.view', 'audit.view'
    ],
  },
  {
    id: 'role-channel-manager',
    code: 'CHANNEL_MANAGER',
    name: 'Distribution & Channel Manager',
    description: 'OTA channel mapping, 2-way live sync engine, dynamic rates matrix, and booking engine distribution.',
    category: 'hotel_executive',
    isSystem: true,
    defaultLandingView: 'channel-manager',
    allowedOutlets: ['*'],
    permissions: [
      'channels.view', 'channels.configure', 'channels.sync_trigger', 'channels.mapping_manage',
      'rates.view', 'rates.manage', 'rates.restrictions_manage',
      'pms.tape_chart.view', 'pms.rooms.view', 'reservations.view', 'reports.analytics_view'
    ],
  },
  {
    id: 'role-fnb-manager',
    code: 'FNB_MANAGER',
    name: 'Food & Beverage / Restaurant Manager',
    description: 'Restaurant and bar floor management, menu configuration, POS orders, and room folio billing.',
    category: 'food_leisure',
    isSystem: true,
    defaultLandingView: 'restaurant',
    allowedOutlets: ['restaurant-main', 'bar-rooftop'],
    permissions: [
      'fnb.tables.view', 'fnb.menu.manage', 'fnb.order.create', 'fnb.order.settle', 'fnb.order.charge_room',
      'kds.view', 'kds.bump_ticket',
      'inventory.view', 'inventory.adjust',
      'folio.view', 'folio.charge'
    ],
  },
  {
    id: 'role-restaurant-server',
    code: 'RESTAURANT_SERVER',
    name: 'Restaurant Server / Waiter',
    description: 'Table dining ordering, POS check creation, kitchen routing, and charging guest room folios.',
    category: 'food_leisure',
    isSystem: true,
    defaultLandingView: 'restaurant',
    allowedOutlets: ['restaurant-main'],
    permissions: [
      'fnb.tables.view', 'fnb.order.create', 'fnb.order.charge_room',
      'kds.view'
    ],
  },
  {
    id: 'role-kitchen-chef',
    code: 'KITCHEN_CHEF',
    name: 'Executive Chef / Kitchen Staff',
    description: 'Kitchen display system station management, food prep timers, recipe inventory depletion, and dish completion.',
    category: 'food_leisure',
    isSystem: true,
    defaultLandingView: 'kds',
    allowedOutlets: ['loc-kitchen'],
    permissions: [
      'kds.view', 'kds.bump_ticket',
      'fnb.menu.manage',
      'inventory.view', 'inventory.adjust'
    ],
  },
  {
    id: 'role-pool-attendant',
    code: 'POOL_ATTENDANT',
    name: 'Swimming Pool & Leisure Attendant',
    description: 'Pool capacity monitoring, guest day pass issuing, towel loans, room charge posting, and water quality testing.',
    category: 'food_leisure',
    isSystem: true,
    defaultLandingView: 'pool',
    allowedOutlets: ['pool-main'],
    permissions: [
      'pool.view', 'pool.pass_issue', 'pool.charge_room', 'pool.water_log',
      'inventory.view'
    ],
  },
  {
    id: 'role-inventory-manager',
    code: 'INVENTORY_MANAGER',
    name: 'Inventory & Purchasing Officer',
    description: 'Multi-location warehouse stock, consumption logs, supplier management, purchase orders, and shipment receiving.',
    category: 'hotel_operations',
    isSystem: true,
    defaultLandingView: 'inventory',
    allowedOutlets: ['loc-wh', 'loc-kitchen', 'loc-hk'],
    permissions: [
      'inventory.view', 'inventory.adjust', 'inventory.product_manage',
      'purchasing.po_create', 'purchasing.po_receive',
      'finance.expense_manage'
    ],
  },
];

// =========================================================================
// 3. AUTHORIZATION HELPER & VALIDATION SERVICE
// =========================================================================
export class AuthorizationService {
  /**
   * Validate if a SUPER_ADMIN has an active, valid hotel-access session for the given tenant.
   */
  static validateHotelAccessSession(
    user: User,
    sessionId: string | undefined,
    targetTenantId: string,
    activeSessions: Map<string, any>
  ): { authorized: boolean; reason?: string; session?: any } {
    if (!user || !user.active) {
      return { authorized: false, reason: 'User is inactive or not found' };
    }

    // If user belongs to this tenant (hotel staff), standard access is allowed
    if (user.tenantId === targetTenantId) {
      return { authorized: true };
    }

    // If user is a platform user (SUPER_ADMIN or platform staff), access to tenant data requires an active audited session
    if (user.tenantId === 'platform' || user.role === 'SUPER_ADMIN') {
      if (!sessionId) {
        return {
          authorized: false,
          reason: 'Audited hotel-access session required. SUPER_ADMIN must explicitly enter hotel context through the platform tenant workflow.',
        };
      }

      const session = activeSessions.get(sessionId);
      if (!session || session.status !== 'ACTIVE') {
        return { authorized: false, reason: 'Hotel-access session is invalid or has expired.' };
      }

      if (session.targetTenantId !== targetTenantId) {
        return { authorized: false, reason: 'Session does not match the requested tenant.' };
      }

      if (session.actorUserId !== user.id) {
        return { authorized: false, reason: 'Session belongs to a different platform administrator.' };
      }

      return { authorized: true, session };
    }

    // Cross-tenant access is strictly denied
    return { authorized: false, reason: 'Strict multi-tenant boundary violation.' };
  }

  /**
   * Check if a user has a specific permission code.
   */
  static hasPermission(user: User, rolesList: UserRoleDefinition[], permission: PermissionCode): boolean {
    if (!user || !user.active) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    // Check custom permissions explicitly attached to user
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // Resolve user's role definition
    const roleDef = rolesList.find(r => r.id === user.roleId || r.code === user.role);
    if (!roleDef) return false;

    return roleDef.permissions.includes(permission);
  }

  /**
   * Check if a user is authorized for a specific property scope.
   */
  static hasPropertyScope(user: User, propertyId: string): boolean {
    if (!user || !user.active) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (!user.scope) return true; // Default fallback

    const propIds = user.scope.propertyIds;
    return propIds.includes('*') || propIds.includes(propertyId);
  }

  /**
   * Check if a user is authorized for a specific outlet scope.
   */
  static hasOutletScope(user: User, outletId: string): boolean {
    if (!user || !user.active) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'PROPERTY_OWNER') return true;
    if (!user.scope || !user.scope.outletIds) return true;

    const outletIds = user.scope.outletIds;
    return outletIds.includes('*') || outletIds.includes(outletId);
  }
}
