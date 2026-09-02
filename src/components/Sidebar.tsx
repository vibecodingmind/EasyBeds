import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PermissionCode } from '../types';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  ConciergeBell,
  BedDouble,
  BadgeDollarSign,
  Share2,
  Sparkles,
  Wrench,
  Receipt,
  Users,
  MessageSquare,
  Star,
  CheckSquare,
  BarChart3,
  Settings,
  Server,
  Boxes,
  Utensils,
  ChefHat,
  Waves,
  Shield,
  Package,
  Compass,
  AlertTriangle,
  LogOut,
  Building2,
  Key,
  Globe,
  DollarSign,
  Activity,
  Layers,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  Smartphone,
  Printer,
  Moon,
  Clock,
  ExternalLink,
  Flame,
  Radio,
  Sliders,
  X,
  Cpu,
  Workflow,
  FolderKanban
} from 'lucide-react';
import { DigitalKeycardModal } from './DigitalKeycardModal';
import { RunSheetsModal } from './RunSheetsModal';
import { MobileCheckInModal } from './MobileCheckInModal';
import { NightAuditModal } from './NightAuditModal';
import { ReservationModal } from './ReservationModal';

export interface NavSubItem {
  id: string;
  label: string;
  subTab?: string;
  icon?: React.ElementType;
  action?: 'new-booking' | 'keycard' | 'runsheets' | 'mobile-checkin' | 'night-audit';
  badge?: string;
  badgeColor?: string;
  requiredPermission?: PermissionCode;
  moduleCode?: string;
}

export interface NavParentItem {
  id: string;
  label: string;
  icon: React.ElementType;
  sectionId: string;
  badge?: string;
  badgeColor?: string;
  requiredPermission?: PermissionCode;
  moduleCode?: string;
  defaultSubTab?: string;
  children?: NavSubItem[];
}

export interface NavSectionGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
  badgeColor?: string;
  items: NavParentItem[];
}

export const Sidebar: React.FC<{
  onOpenNewBooking?: () => void;
}> = ({ onOpenNewBooking }) => {
  // Gracefully consume from useAuth or fallback to useApp
  let authCtx: any = null;
  try {
    authCtx = useAuth();
  } catch {
    // Fallback if not inside AuthProvider
  }
  const appCtx = useApp();

  const activeView = appCtx.activeView;
  const setActiveView = appCtx.setActiveView;
  const activeSubTab = appCtx.activeSubTab;
  const navigateWithSubTab = appCtx.navigateWithSubTab;
  const currentUser = authCtx?.currentUser ?? appCtx.currentUser;
  const currentRole = authCtx?.currentRole ?? appCtx.currentRole;
  const userPermissions = authCtx?.userPermissions ?? appCtx.userPermissions;
  const userScope = authCtx?.userScope ?? appCtx.userScope;
  const currentProperty = authCtx?.currentProperty ?? appCtx.currentProperty;
  const currentTenant = authCtx?.currentTenant ?? appCtx.currentTenant;
  const isHotelAccessActive = authCtx?.isHotelAccessActive ?? appCtx.isHotelAccessActive;
  const exitHotel = authCtx?.exitHotel ?? appCtx.exitHotelContext;
  const hasPermission = authCtx?.hasPermission ?? appCtx.hasPermission;
  const isModuleEnabled = appCtx.isModuleEnabled;
  const refreshData = appCtx.refreshData;
  const tenants = appCtx.tenants || [];

  // Active Context resolution: 'PLATFORM' or 'HOTEL'
  const activeContext: 'PLATFORM' | 'HOTEL' = authCtx?.activeContext || (appCtx.authContextType === 'PLATFORM' ? 'PLATFORM' : 'HOTEL');

  // State to track expanded Primary Category Sections (Collapsible Section Groups: Operational, Financial, Platform, Integrations)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'operational-group': true,
    'financial-group': true,
    'platform-admin-group': true,
    'integration-api-group': true,
  });

  // State to track expanded Parent Menu Items (Collapsible Sub-Menus)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'platform-admin': true,
    'platform-tenants': true,
    'platform-subscriptions': false,
    'platform-modules': false,
    'platform-apis': true,
    'platform-integrations': false,
    'frontdesk': true,
    'dashboard': false,
    'channel-manager': true,
    'finance': true,
    'restaurant': false,
    'settings': false,
  });

  // Keep track of previous active view to avoid overriding manual user collapse
  const prevActiveViewRef = useRef<string>(activeView);

  // Search filter state for quick menu discovery
  const [searchFilter, setSearchFilter] = useState('');

  // Internal Modals State
  const [isKeycardModalOpen, setIsKeycardModalOpen] = useState(false);
  const [isRunSheetsModalOpen, setIsRunSheetsModalOpen] = useState(false);
  const [isMobileCheckInOpen, setIsMobileCheckInOpen] = useState(false);
  const [isNightAuditOpen, setIsNightAuditOpen] = useState(false);
  const [isLocalNewBookingOpen, setIsLocalNewBookingOpen] = useState(false);

  // Auto-expand the parent section & item ONLY when activeView genuinely transitions to a new view
  useEffect(() => {
    if (activeView && prevActiveViewRef.current !== activeView) {
      prevActiveViewRef.current = activeView;
      setExpandedMenus(prev => ({
        ...prev,
        [activeView]: true,
      }));

      // Determine which section group contains this activeView
      if (
        activeView === 'platform-admin' ||
        activeView === 'platform-tenants' ||
        activeView === 'platform-subscriptions' ||
        activeView === 'platform-modules' ||
        activeView === 'platform-users' ||
        activeView === 'platform-audit' ||
        activeView === 'platform-settings'
      ) {
        setExpandedSections(prev => ({ ...prev, 'platform-admin-group': true }));
      } else if (
        activeView === 'platform-apis' ||
        activeView === 'platform-integrations' ||
        activeView === 'channel-manager'
      ) {
        setExpandedSections(prev => ({ ...prev, 'integration-api-group': true }));
      } else if (
        activeView === 'finance' ||
        activeView === 'reports' ||
        activeView === 'rates-availability' ||
        activeView === 'rooms' ||
        activeView === 'group-blocks' ||
        activeView === 'audit-logs' ||
        activeView === 'settings'
      ) {
        setExpandedSections(prev => ({ ...prev, 'financial-group': true }));
      } else {
        setExpandedSections(prev => ({ ...prev, 'operational-group': true }));
      }
    }
  }, [activeView]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleExpandMenu = (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSelectParent = (item: NavParentItem) => {
    if (item.children && item.children.length > 0) {
      // Ensure submenu is expanded when parent is selected
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: true,
      }));
    }
    navigateWithSubTab(item.id, item.defaultSubTab || null);
  };

  const handleSelectSubItem = (parent: NavParentItem, subItem: NavSubItem) => {
    if (subItem.action) {
      if (subItem.action === 'new-booking') {
        if (onOpenNewBooking) onOpenNewBooking();
        else setIsLocalNewBookingOpen(true);
      } else if (subItem.action === 'keycard') {
        setIsKeycardModalOpen(true);
      } else if (subItem.action === 'runsheets') {
        setIsRunSheetsModalOpen(true);
      } else if (subItem.action === 'mobile-checkin') {
        setIsMobileCheckInOpen(true);
      } else if (subItem.action === 'night-audit') {
        setIsNightAuditOpen(true);
      }
      return;
    }

    navigateWithSubTab(parent.id, subItem.subTab || null);
  };

  // =========================================================================
  // TIERED NAVIGATION DEFINITIONS: Operational, Financial, Platform, Integrations
  // =========================================================================

  // Group 1: Operational Section
  const operationalSection: NavSectionGroup = {
    id: 'operational-group',
    title: 'Operational',
    icon: LayoutDashboard,
    description: 'Front Desk, Rooms, Outlets & Daily Shift',
    badge: 'Live',
    badgeColor: 'emerald',
    items: [
      {
        id: 'dashboard',
        label: 'Operations Dashboard',
        icon: LayoutDashboard,
        sectionId: 'operational-group',
        defaultSubTab: 'overview',
        children: [
          { id: 'dash-kpi', label: 'Live Operations KPI', subTab: 'overview' },
          { id: 'dash-rooms-summary', label: 'Occupancy & Rooms Status', subTab: 'overview' },
        ]
      },
      {
        id: 'frontdesk',
        label: 'Front Desk Hub',
        icon: ConciergeBell,
        sectionId: 'operational-group',
        requiredPermission: 'reservations.check_in',
        badge: 'Today',
        defaultSubTab: 'arrivals',
        children: [
          { id: 'fd-arrivals', label: 'Due Arrivals (Today)', subTab: 'arrivals', icon: Clock },
          { id: 'fd-inhouse', label: 'In-House Guests', subTab: 'inhouse', icon: BedDouble },
          { id: 'fd-departures', label: 'Due Departures', subTab: 'departures', icon: LogOut },
          { id: 'fd-runsheets', label: 'Run Sheets Manifest', action: 'runsheets', icon: Printer, badge: 'Tool' },
          { id: 'fd-keycard', label: 'RFID Keycard Encoder', action: 'keycard', icon: Key, badge: 'Tool' },
          { id: 'fd-mobile-checkin', label: 'Mobile Guest Check-In', action: 'mobile-checkin', icon: Smartphone, badge: 'Web' },
        ]
      },
      {
        id: 'calendar',
        label: 'Tape Chart Calendar',
        icon: CalendarDays,
        sectionId: 'operational-group',
        requiredPermission: 'pms.tape_chart.view',
        badge: 'Live',
        defaultSubTab: 'tape-chart',
        children: [
          { id: 'cal-tape-chart', label: 'Tape Chart Timeline', subTab: 'tape-chart' },
          { id: 'cal-new-booking', label: 'Walk-In / New Booking', action: 'new-booking', icon: Plus, badge: 'Action' },
        ]
      },
      {
        id: 'reservations',
        label: 'Reservations Hub',
        icon: BookOpenCheck,
        sectionId: 'operational-group',
        requiredPermission: 'reservations.view',
        defaultSubTab: 'all',
        children: [
          { id: 'res-all', label: 'All Active Bookings', subTab: 'all' },
          { id: 'res-new', label: 'New Reservation', action: 'new-booking', icon: Plus },
        ]
      },
      {
        id: 'housekeeping',
        label: 'Housekeeping & Cleanliness',
        icon: Sparkles,
        sectionId: 'operational-group',
        requiredPermission: 'housekeeping.view',
        defaultSubTab: 'grid',
        children: [
          { id: 'hk-grid', label: 'Room Cleanliness Grid', subTab: 'grid' },
          { id: 'hk-queue', label: 'Dirty / Turnover Queue', subTab: 'queue' },
        ]
      },
      {
        id: 'maintenance',
        label: 'Maintenance & Work Orders',
        icon: Wrench,
        sectionId: 'operational-group',
        requiredPermission: 'maintenance.view',
        defaultSubTab: 'tickets',
        children: [
          { id: 'maint-tickets', label: 'Active Work Orders', subTab: 'tickets' },
          { id: 'maint-assets', label: 'Asset Repair Logs', subTab: 'assets' },
        ]
      },
      {
        id: 'restaurant',
        label: 'Restaurant & Bistro POS',
        icon: Utensils,
        sectionId: 'operational-group',
        requiredPermission: 'fnb.tables.view',
        badge: 'F&B',
        moduleCode: 'RESTAURANT',
        defaultSubTab: 'pos',
        children: [
          { id: 'rest-pos', label: 'Point of Sale Register', subTab: 'pos' },
          { id: 'rest-tables', label: 'Tables Floor Plan', subTab: 'tables' },
          { id: 'rest-orders', label: 'Dining Checks & Orders', subTab: 'orders' },
        ]
      },
      {
        id: 'kds',
        label: 'Kitchen Display (KDS)',
        icon: ChefHat,
        sectionId: 'operational-group',
        requiredPermission: 'kds.view',
        badge: 'Kitchen',
        moduleCode: 'KDS',
        defaultSubTab: 'all',
        children: [
          { id: 'kds-all', label: 'All Live Tickets', subTab: 'all' },
          { id: 'kds-grill', label: 'Grill Station', subTab: 'grill', icon: Flame },
          { id: 'kds-hotline', label: 'Hot Line Station', subTab: 'hotline' },
          { id: 'kds-salad', label: 'Salad Station', subTab: 'salad' },
          { id: 'kds-bar', label: 'Bar & Beverage Station', subTab: 'bar' },
        ]
      },
      {
        id: 'pool',
        label: 'Swimming Pool Hub',
        icon: Waves,
        sectionId: 'operational-group',
        requiredPermission: 'pool.view',
        badge: 'Pool',
        moduleCode: 'SWIMMING_POOL',
        defaultSubTab: 'bathers',
        children: [
          { id: 'pool-bathers', label: 'Pool Bathers & Day Passes', subTab: 'bathers' },
          { id: 'pool-cabanas', label: 'VIP Cabanas & Daybeds', subTab: 'cabanas' },
          { id: 'pool-water', label: 'Water Chemical Logs', subTab: 'water_quality' },
        ]
      },
      {
        id: 'inventory',
        label: 'Stock & Purchasing',
        icon: Package,
        sectionId: 'operational-group',
        requiredPermission: 'inventory.view',
        badge: 'Stock',
        moduleCode: 'INVENTORY',
        defaultSubTab: 'stock',
        children: [
          { id: 'inv-stock', label: 'Stock Catalog & On-Hand', subTab: 'stock' },
          { id: 'inv-movs', label: 'Stock Movements & Transfers', subTab: 'movements' },
          { id: 'inv-pos', label: 'Purchase Orders (PO)', subTab: 'purchase_orders' },
          { id: 'inv-sups', label: 'Suppliers Directory', subTab: 'suppliers' },
        ]
      },
      {
        id: 'guests',
        label: 'Guests CRM',
        icon: Users,
        sectionId: 'operational-group',
        requiredPermission: 'guests.view',
        defaultSubTab: 'list',
        children: [
          { id: 'crm-profiles', label: 'Guest Directory & Profiles', subTab: 'list' },
          { id: 'crm-vip', label: 'VIP Tiers & Stay History', subTab: 'vip' },
        ]
      },
      {
        id: 'messages',
        label: 'Guest Messaging',
        icon: MessageSquare,
        sectionId: 'operational-group',
        requiredPermission: 'guests.view',
        defaultSubTab: 'inbox',
        children: [
          { id: 'msg-inbox', label: 'Unified Guest Inbox', subTab: 'inbox' },
          { id: 'msg-auto', label: 'Automated WhatsApp & SMS', subTab: 'automated' },
        ]
      },
      {
        id: 'reviews',
        label: 'Reviews & Reputation',
        icon: Star,
        sectionId: 'operational-group',
        requiredPermission: 'reports.analytics_view',
        defaultSubTab: 'reviews',
      },
      {
        id: 'tasks',
        label: 'Operations Tasks',
        icon: CheckSquare,
        sectionId: 'operational-group',
        defaultSubTab: 'daily',
        children: [
          { id: 'task-daily', label: 'Daily Shift Checklist', subTab: 'daily' },
        ]
      },
    ]
  };

  // Group 2: Financial Section
  const financialSection: NavSectionGroup = {
    id: 'financial-group',
    title: 'Financial',
    icon: Receipt,
    description: 'Folios, Ledger, Rates & Revenue Reports',
    badge: 'Ledger',
    badgeColor: 'indigo',
    items: [
      {
        id: 'finance',
        label: 'Finance & Ledger',
        icon: Receipt,
        sectionId: 'financial-group',
        requiredPermission: 'finance.ledger_view',
        defaultSubTab: 'invoices',
        children: [
          { id: 'fin-invoices', label: 'Guest Folios & Invoices', subTab: 'invoices' },
          { id: 'fin-expenses', label: 'Operating Expenses', subTab: 'expenses' },
          { id: 'fin-taxes', label: 'Tax Engine & Remittance', subTab: 'taxes' },
          { id: 'fin-currencies', label: 'Multi-Currency Exchange', subTab: 'currencies' },
          { id: 'fin-night-audit', label: 'Execute Night Audit Wizard', action: 'night-audit', icon: Moon, badge: 'Wizard' },
        ]
      },
      {
        id: 'reports',
        label: 'Reports & Analytics',
        icon: BarChart3,
        sectionId: 'financial-group',
        requiredPermission: 'reports.analytics_view',
        defaultSubTab: 'kpi',
        children: [
          { id: 'rep-adr-revpar', label: 'ADR & RevPAR Analytics', subTab: 'kpi' },
          { id: 'rep-occupancy', label: 'Occupancy & Revenue Forecast', subTab: 'occupancy' },
        ]
      },
      {
        id: 'rates-availability',
        label: 'Rates & Availability',
        icon: BadgeDollarSign,
        sectionId: 'financial-group',
        requiredPermission: 'rates.view',
        defaultSubTab: 'plans',
        children: [
          { id: 'ra-plans', label: 'Rate Plans & Tiers', subTab: 'plans' },
          { id: 'ra-restrictions', label: 'Min Stay & Closed to Arrival', subTab: 'restrictions' },
        ]
      },
      {
        id: 'rooms',
        label: 'Rooms & Physical Units',
        icon: BedDouble,
        sectionId: 'financial-group',
        requiredPermission: 'pms.rooms.view',
        defaultSubTab: 'types',
        children: [
          { id: 'rm-categories', label: 'Room Types & Categories', subTab: 'types' },
          { id: 'rm-units', label: 'Physical Room Numbers', subTab: 'units' },
        ]
      },
      {
        id: 'group-blocks',
        label: 'Group Blocks & Corporate',
        icon: Building2,
        sectionId: 'financial-group',
        requiredPermission: 'reservations.view',
        badge: 'Groups',
        defaultSubTab: 'blocks',
        children: [
          { id: 'gb-blocks', label: 'Group Room Allotments', subTab: 'blocks' },
          { id: 'gb-folios', label: 'Master Billing Folios', subTab: 'folios' },
        ]
      },
      {
        id: 'audit-logs',
        label: 'Hotel Audit Trail',
        icon: ShieldAlert,
        sectionId: 'financial-group',
        requiredPermission: 'settings.property_manage',
        badge: 'Audit',
        defaultSubTab: 'all',
        children: [
          { id: 'audit-all', label: 'All Hotel Audit Logs', subTab: 'all' },
          { id: 'audit-reservations', label: 'Reservation Audit Changes', subTab: 'reservations' },
          { id: 'audit-security', label: 'Staff Security & Auth Events', subTab: 'security' },
        ]
      },
      {
        id: 'settings',
        label: 'Hotel Settings & Roles',
        icon: Settings,
        sectionId: 'financial-group',
        requiredPermission: 'settings.property_manage',
        defaultSubTab: 'property',
        children: [
          { id: 'set-property', label: 'Property Profile & Policies', subTab: 'property' },
          { id: 'set-users', label: 'Staff User Directory', subTab: 'users' },
          { id: 'set-roles', label: 'Roles & RBAC Permissions Studio', subTab: 'roles' },
          { id: 'set-billing', label: 'Subscription Plan & Billing', subTab: 'billing' },
        ]
      },
    ]
  };

  // Group 3: Platform Admin Section (Centralized SaaS Kernel, Telemetry & Multi-Tenancy)
  const platformAdminSection: NavSectionGroup = {
    id: 'platform-admin-group',
    title: 'Platform Admin',
    icon: Server,
    description: 'SaaS Kernel, Telemetry & Multi-Tenancy',
    badge: 'Admin',
    badgeColor: 'amber',
    items: [
      {
        id: 'platform-admin',
        label: 'Telemetry & MRR',
        icon: Activity,
        sectionId: 'platform-admin-group',
        defaultSubTab: 'overview',
        children: [
          { id: 'plat-telemetry-overview', label: 'Global KPI Metrics', subTab: 'overview' },
          { id: 'plat-telemetry-health', label: 'System Health & Services', subTab: 'system-health' },
        ]
      },
      {
        id: 'platform-tenants',
        label: 'Tenants & Hotel Access',
        icon: Building2,
        sectionId: 'platform-admin-group',
        badge: tenants.length ? `${tenants.length}` : '3',
        defaultSubTab: 'tenants',
        children: [
          { id: 'plat-tenants-list', label: 'Tenant Directory', subTab: 'tenants' },
          { id: 'plat-tenants-impersonate', label: 'Enter Hotel with Audit', subTab: 'tenants' },
        ]
      },
      {
        id: 'platform-subscriptions',
        label: 'Plans & Invoices',
        icon: DollarSign,
        sectionId: 'platform-admin-group',
        defaultSubTab: 'subscriptions',
        children: [
          { id: 'plat-subs-plans', label: 'Pricing Tiers & Limits', subTab: 'subscriptions' },
          { id: 'plat-subs-invoices', label: 'Tenant Invoices & Billing', subTab: 'invoices' },
        ]
      },
      {
        id: 'platform-modules',
        label: 'Global Modules',
        icon: Layers,
        sectionId: 'platform-admin-group',
        badge: 'OS',
        defaultSubTab: 'modules',
        children: [
          { id: 'plat-mods-all', label: 'Global Module Switches', subTab: 'modules' },
          { id: 'plat-mods-addons', label: 'Add-On Store Registry', subTab: 'modules' },
        ]
      },
      {
        id: 'platform-users',
        label: 'Platform Team',
        icon: Users,
        sectionId: 'platform-admin-group',
        badge: '4',
        defaultSubTab: 'team',
        children: [
          { id: 'plat-team-members', label: 'Platform Admins & Staff', subTab: 'team' },
        ]
      },
      {
        id: 'platform-audit',
        label: 'Platform Audit Logs',
        icon: ShieldAlert,
        sectionId: 'platform-admin-group',
        badge: 'Audit',
        defaultSubTab: 'audit',
        children: [
          { id: 'plat-audit-trail', label: 'Security & Access Logs', subTab: 'audit' },
        ]
      },
      {
        id: 'platform-settings',
        label: 'Platform Settings',
        icon: Settings,
        sectionId: 'platform-admin-group',
        defaultSubTab: 'settings',
      },
    ]
  };

  // Group 4: Integration & API Section (Centralized External Gateways, Webhooks & APIs)
  const integrationApiSection: NavSectionGroup = {
    id: 'integration-api-group',
    title: 'Integration & API',
    icon: Globe,
    description: 'Centralized Gateways, Webhooks & APIs',
    badge: 'Connect',
    badgeColor: 'sky',
    items: [
      {
        id: 'platform-apis',
        label: 'API Keys & Webhooks',
        icon: Key,
        sectionId: 'integration-api-group',
        defaultSubTab: 'apis',
        children: [
          { id: 'plat-apis-keys', label: 'OAuth & API Key Clients', subTab: 'apis' },
          { id: 'plat-apis-webhooks', label: 'Webhook Simulator', subTab: 'apis' },
        ]
      },
      {
        id: 'platform-integrations',
        label: 'Global Connectors',
        icon: Globe,
        sectionId: 'integration-api-group',
        defaultSubTab: 'integrations',
        children: [
          { id: 'plat-integ-gateways', label: 'Payment & OTA Gateways', subTab: 'integrations' },
        ]
      },
      {
        id: 'channel-manager',
        label: 'Channel Manager (OTAs)',
        icon: Share2,
        sectionId: 'integration-api-group',
        requiredPermission: 'channels.view',
        badge: 'OTAs',
        defaultSubTab: 'channels',
        children: [
          { id: 'cm-channels', label: 'Active OTA Channels', subTab: 'channels' },
          { id: 'cm-mappings', label: 'Room & Rate Mappings', subTab: 'mappings' },
          { id: 'cm-logs', label: '2-Way Sync Activity Logs', subTab: 'logs' },
          { id: 'cm-ical', label: 'Live RFC 5545 iCal Feeds', subTab: 'ical', icon: Radio, badge: 'iCal' },
        ]
      },
    ]
  };

  // Assemble the 4 primary sections: Operational, Financial, Platform, Integrations
  const allSectionGroups: NavSectionGroup[] = useMemo(() => {
    if (activeContext === 'PLATFORM') {
      return [
        platformAdminSection,
        integrationApiSection,
      ];
    }

    return [
      operationalSection,
      financialSection,
      platformAdminSection,
      integrationApiSection,
    ];
  }, [activeContext, tenants.length]);

  // Authorization and module check filter
  const isItemVisible = (item: NavParentItem) => {
    if (isHotelAccessActive) return true;
    if (activeContext === 'PLATFORM') return true;
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }
    return true;
  };

  // Filter sections and items by search filter
  const filteredSections = allSectionGroups.map(section => {
    const visibleGroupItems = section.items.filter(isItemVisible);
    if (!searchFilter.trim()) {
      return {
        ...section,
        items: visibleGroupItems,
      };
    }
    const q = searchFilter.toLowerCase();
    const matchesSection = section.title.toLowerCase().includes(q) || (section.description && section.description.toLowerCase().includes(q));
    const matchingItems = visibleGroupItems.filter(item => {
      if (matchesSection) return true;
      const parentMatch = item.label.toLowerCase().includes(q);
      const childMatch = item.children?.some(c => c.label.toLowerCase().includes(q));
      return parentMatch || childMatch;
    });

    return {
      ...section,
      items: matchingItems,
    };
  }).filter(section => section.items.length > 0);

  return (
    <>
      <aside
        id="sidebar-tiered-navigation"
        className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] overflow-y-auto select-none"
      >
        <div className="p-3 space-y-3.5">
          {/* Audited Hotel Session Notice for Super Admins */}
          {isHotelAccessActive && (
            <div className="bg-amber-950/70 border border-amber-500/50 rounded-xl p-3 space-y-2 text-amber-200 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>Audited Hotel Session</span>
              </div>
              <div className="text-[11px] text-amber-100/90 leading-tight">
                Operating in: <strong className="text-white">{currentTenant?.name}</strong>
              </div>
              <button
                type="button"
                onClick={exitHotel}
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Hotel
              </button>
            </div>
          )}

          {/* Active Staff / Platform Persona Card */}
          <div className={`rounded-xl p-3 flex items-center space-x-3 shadow-inner border ${
            activeContext === 'PLATFORM'
              ? 'bg-slate-950/80 border-amber-500/30'
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={currentUser?.name || 'User'}
              className={`w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ${
                activeContext === 'PLATFORM' ? 'ring-amber-500/50' : 'ring-indigo-500/50'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-100 truncate">{currentUser?.name || 'Active User'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold truncate ${
                  activeContext === 'PLATFORM' ? 'text-amber-300' : 'text-indigo-300'
                }`}>
                  {activeContext === 'PLATFORM'
                    ? 'SUPER_ADMIN (PLATFORM)'
                    : isHotelAccessActive
                    ? `${currentUser?.name} (Audited Super Admin)`
                    : currentUser?.customRoleName || currentRole.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                <Shield className={`w-2.5 h-2.5 ${activeContext === 'PLATFORM' ? 'text-amber-400' : 'text-indigo-400'}`} />
                <span>
                  {activeContext === 'PLATFORM'
                    ? 'Global SaaS Kernel Scope'
                    : isHotelAccessActive
                    ? 'Full Hotel Operational Scope'
                    : `${userPermissions.length} permissions`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Search & Filter Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search menus, tools & APIs..."
              className={`w-full pl-8 pr-7 py-1.5 bg-slate-950/60 border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition ${
                activeContext === 'PLATFORM'
                  ? 'border-slate-800 focus:border-amber-500/60'
                  : 'border-slate-800 focus:border-indigo-500/60'
              }`}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tiered Collapsible Navigation Section Groups */}
          <div className="space-y-3 pt-1">
            {filteredSections.map(section => {
              const SectionIcon = section.icon;
              const isSectionExpanded = expandedSections[section.id] ?? true;
              const isSearching = !!searchFilter.trim();

              return (
                <div
                  key={section.id}
                  id={`section-group-${section.id}`}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/30 overflow-hidden"
                >
                  {/* Primary Category Section Header (Clickable Collapsible Group) */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-3 py-2 bg-slate-950/70 hover:bg-slate-800/60 transition flex items-center justify-between cursor-pointer border-b border-slate-800/40 select-none group text-left"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <SectionIcon className={`w-3.5 h-3.5 shrink-0 ${
                        section.badgeColor === 'amber'
                          ? 'text-amber-400'
                          : section.badgeColor === 'sky'
                          ? 'text-sky-400'
                          : section.badgeColor === 'emerald'
                          ? 'text-emerald-400'
                          : 'text-indigo-400'
                      }`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 group-hover:text-white truncate">
                        {section.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {section.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          section.badgeColor === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : section.badgeColor === 'sky'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : section.badgeColor === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {section.badge}
                        </span>
                      )}
                      <span className="p-0.5 text-slate-500 group-hover:text-slate-300 transition">
                        {(isSectionExpanded || isSearching) ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Section Content: Nested Parent Items & Sub-Menus */}
                  {(isSectionExpanded || isSearching) && (
                    <div className="p-1.5 space-y-1">
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const isParentActive = activeView === item.id;
                        const isModuleLocked = item.moduleCode ? !isModuleEnabled(item.moduleCode) : false;
                        const isMenuExpanded = expandedMenus[item.id] || isSearching;
                        const hasChildren = item.children && item.children.length > 0;

                        return (
                          <div key={item.id} className="space-y-0.5">
                            {/* Parent Menu Item Container: Entire row is clickable for navigation */}
                            <div
                              onClick={() => handleSelectParent(item)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectParent(item);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none group ${
                                isParentActive
                                  ? activeContext === 'PLATFORM'
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                    : 'bg-indigo-600 text-white font-semibold shadow-sm'
                                  : isModuleLocked
                                  ? 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {/* Left: Icon and Label */}
                              <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pointer-events-none">
                                <Icon className={`w-4 h-4 shrink-0 ${
                                  isParentActive
                                    ? activeContext === 'PLATFORM' ? 'text-slate-950' : 'text-white'
                                    : isModuleLocked
                                    ? 'text-slate-600'
                                    : section.badgeColor === 'amber'
                                    ? 'text-amber-400'
                                    : section.badgeColor === 'sky'
                                    ? 'text-sky-400'
                                    : 'text-indigo-400'
                                }`} />
                                <span className="truncate">{item.label}</span>
                              </div>

                              {/* Right: Badges & Chevron Toggle */}
                              <div
                                className="flex items-center space-x-1.5 shrink-0 ml-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isModuleLocked ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    OFF
                                  </span>
                                ) : item.badge ? (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                      isParentActive
                                        ? 'bg-black/20 text-current'
                                        : item.badge === 'OS'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                ) : null}

                                {hasChildren && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandMenu(item.id, e);
                                    }}
                                    aria-label={`Toggle ${item.label} sub-menu`}
                                    className={`p-1 rounded hover:bg-black/20 transition cursor-pointer ${
                                      isParentActive ? 'text-current' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {isMenuExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Nested Sub-Menu Links */}
                            {hasChildren && isMenuExpanded && (
                              <div className="ml-3.5 pl-2.5 border-l border-slate-800 space-y-0.5 py-1">
                                {item.children!.map((child) => {
                                  const isChildActive =
                                    isParentActive && (activeSubTab === child.subTab || (!activeSubTab && child.subTab === item.defaultSubTab));
                                  const ChildIcon = child.icon;

                                  return (
                                    <button
                                      key={child.id}
                                      type="button"
                                      onClick={() => handleSelectSubItem(item, child)}
                                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition cursor-pointer text-left ${
                                        isChildActive
                                          ? activeContext === 'PLATFORM'
                                            ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/40'
                                            : 'bg-indigo-600/30 text-indigo-200 font-semibold border border-indigo-500/40'
                                          : child.action
                                          ? 'text-indigo-300 hover:text-white hover:bg-indigo-950/40'
                                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        {ChildIcon ? (
                                          <ChildIcon className={`w-3 h-3 ${
                                            isChildActive
                                              ? 'text-amber-400'
                                              : child.action
                                              ? 'text-indigo-400'
                                              : 'text-slate-500'
                                          }`} />
                                        ) : (
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            isChildActive
                                              ? activeContext === 'PLATFORM' ? 'bg-amber-400' : 'bg-indigo-400'
                                              : 'bg-slate-600'
                                          }`} />
                                        )}
                                        <span className="truncate">{child.label}</span>
                                      </div>

                                      {child.badge && (
                                        <span
                                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ml-1.5 shrink-0 ${
                                            child.badge === 'Tool' || child.badge === 'Action' || child.badge === 'Wizard'
                                              ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                                              : 'bg-slate-800 text-slate-300'
                                          }`}
                                        >
                                          {child.badge}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scope Footer Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              {activeContext === 'PLATFORM' ? (
                <Server className="w-3 h-3 text-amber-400" />
              ) : (
                <Compass className="w-3 h-3 text-indigo-400" />
              )}
              <span>Scope:</span>
            </span>
            <span className="font-semibold text-slate-200 truncate max-w-[140px]" title={currentProperty?.name}>
              {activeContext === 'PLATFORM'
                ? 'Global SaaS Kernel'
                : userScope?.propertyIds.includes('*')
                ? 'All Properties (*)'
                : currentProperty?.name || 'Assigned Property'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeContext === 'PLATFORM' ? 'Platform SaaS Kernel' : 'Hotel PMS Scope'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">v3.5-Enterprise</span>
          </div>
        </div>
      </aside>

      {/* Internal Modals Triggerable directly from Side Menu */}
      <DigitalKeycardModal
        isOpen={isKeycardModalOpen}
        onClose={() => setIsKeycardModalOpen(false)}
      />

      <RunSheetsModal
        isOpen={isRunSheetsModalOpen}
        onClose={() => setIsRunSheetsModalOpen(false)}
      />

      <MobileCheckInModal
        isOpen={isMobileCheckInOpen}
        onClose={() => setIsMobileCheckInOpen(false)}
      />

      <NightAuditModal
        isOpen={isNightAuditOpen}
        onClose={() => setIsNightAuditOpen(false)}
        onComplete={() => {
          setIsNightAuditOpen(false);
          refreshData();
        }}
      />

      <ReservationModal
        isOpen={isLocalNewBookingOpen}
        onClose={() => setIsLocalNewBookingOpen(false)}
        onCreated={refreshData}
      />
    </>
  );
};
