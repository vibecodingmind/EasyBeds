import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
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
  Building2,
  Key,
  CreditCard,
  FileText,
  Printer,
  Smartphone,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  FolderKanban
} from 'lucide-react';
import { Reservation, Room, Tenant } from '../types';

export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenNewBooking?: () => void;
  onOpenKeycard?: (res?: Reservation) => void;
  onOpenRunSheets?: () => void;
  onOpenMobileCheckIn?: (res?: Reservation) => void;
  onSelectReservation?: (res: Reservation) => void;
}> = ({
  isOpen,
  onClose,
  onOpenNewBooking,
  onOpenKeycard,
  onOpenRunSheets,
  onOpenMobileCheckIn,
  onSelectReservation,
}) => {
  let authCtx: any = null;
  try {
    authCtx = useAuth();
  } catch {}
  const appCtx = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const activeContext = authCtx?.activeContext || (appCtx.authContextType === 'PLATFORM' ? 'PLATFORM' : 'HOTEL');
  const setActiveView = appCtx.setActiveView;
  const isHotelAccessActive = authCtx?.isHotelAccessActive ?? appCtx.isHotelAccessActive;
  const exitHotel = authCtx?.exitHotel ?? appCtx.exitHotelContext;
  const enterHotel = authCtx?.enterHotel ?? appCtx.enterHotelContext;
  const addToast = appCtx.addToast;
  const refreshData = appCtx.refreshData;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch quick search data
      Promise.all([
        appCtx.apiFetch('/api/reservations').catch(() => []),
        appCtx.apiFetch('/api/rooms').catch(() => []),
        appCtx.apiFetch('/api/tenants').catch(() => []),
      ]).then(([resv, rms, tnts]) => {
        setReservations(resv || []);
        setRooms(rms || []);
        setTenants(tnts || []);
      });
    }
  }, [isOpen]);

  // Navigation commands list
  const navCommands = [
    // Hotel Operations
    { id: 'nav-dash', title: 'Go to Operations Dashboard', category: 'Navigation', icon: LayoutDashboard, action: () => { setActiveView('dashboard'); onClose(); } },
    { id: 'nav-cal', title: 'Go to Tape Chart Calendar', category: 'Navigation', icon: CalendarDays, action: () => { setActiveView('calendar'); onClose(); } },
    { id: 'nav-res', title: 'Go to Reservations List', category: 'Navigation', icon: BookOpenCheck, action: () => { setActiveView('reservations'); onClose(); } },
    { id: 'nav-front', title: 'Go to Front Desk Hub (Arrivals/Departures)', category: 'Navigation', icon: ConciergeBell, action: () => { setActiveView('frontdesk'); onClose(); } },
    { id: 'nav-fnb', title: 'Go to Restaurant & Bistro POS', category: 'Navigation', icon: Utensils, action: () => { setActiveView('restaurant'); onClose(); } },
    { id: 'nav-kds', title: 'Go to Kitchen Display System (KDS)', category: 'Navigation', icon: ChefHat, action: () => { setActiveView('kds'); onClose(); } },
    { id: 'nav-pool', title: 'Go to Swimming Pool & Cabanas Hub', category: 'Navigation', icon: Waves, action: () => { setActiveView('pool'); onClose(); } },
    { id: 'nav-inv', title: 'Go to Stock & Purchasing Inventory', category: 'Navigation', icon: Package, action: () => { setActiveView('inventory'); onClose(); } },
    { id: 'nav-chn', title: 'Go to Channel Manager & OTA Feeds', category: 'Navigation', icon: Share2, action: () => { setActiveView('channel-manager'); onClose(); } },
    { id: 'nav-rates', title: 'Go to Dynamic Rates & Restrictions', category: 'Navigation', icon: BadgeDollarSign, action: () => { setActiveView('rates-availability'); onClose(); } },
    { id: 'nav-rooms', title: 'Go to Rooms & Room Types', category: 'Navigation', icon: BedDouble, action: () => { setActiveView('rooms'); onClose(); } },
    { id: 'nav-hk', title: 'Go to Housekeeping Schedule', category: 'Navigation', icon: Sparkles, action: () => { setActiveView('housekeeping'); onClose(); } },
    { id: 'nav-mnt', title: 'Go to Maintenance Work Orders', category: 'Navigation', icon: Wrench, action: () => { setActiveView('maintenance'); onClose(); } },
    { id: 'nav-fin', title: 'Go to Finance & Night Audit Ledger', category: 'Navigation', icon: Receipt, action: () => { setActiveView('finance'); onClose(); } },
    { id: 'nav-rep', title: 'Go to Analytics & Revenue Reports', category: 'Navigation', icon: BarChart3, action: () => { setActiveView('reports'); onClose(); } },
    { id: 'nav-mod', title: 'Go to Modular OS & Addons Manager', category: 'Navigation', icon: Boxes, action: () => { setActiveView('module-manager'); onClose(); } },
    { id: 'nav-grp', title: 'Go to Group Blocks & Corporate Events', category: 'Navigation', icon: FolderKanban, action: () => { setActiveView('group-blocks'); onClose(); } },
    { id: 'nav-audit', title: 'Go to Hotel Security Audit Logs', category: 'Navigation', icon: Shield, action: () => { setActiveView('audit-logs'); onClose(); } },
    { id: 'nav-set', title: 'Go to Hotel Settings & Staff Roles', category: 'Navigation', icon: Settings, action: () => { setActiveView('settings'); onClose(); } },
    { id: 'nav-plt', title: 'Go to SaaS Platform Admin Kernel', category: 'Navigation', icon: Server, action: () => { setActiveView('platform-admin'); onClose(); } },
  ];

  // Quick Action commands
  const quickActions = [
    {
      id: 'act-new-res',
      title: 'Create New Reservation',
      category: 'Quick Actions',
      icon: BookOpenCheck,
      action: () => {
        onClose();
        onOpenNewBooking?.();
      },
    },
    {
      id: 'act-run-sheets',
      title: 'Open Printable Run Sheets (Arrivals, Departures, Housekeeping)',
      category: 'Quick Actions',
      icon: Printer,
      action: () => {
        onClose();
        onOpenRunSheets?.();
      },
    },
    {
      id: 'act-keycard',
      title: 'Digital Keycard & RFID Lock Encoder',
      category: 'Quick Actions',
      icon: Key,
      action: () => {
        onClose();
        onOpenKeycard?.();
      },
    },
    {
      id: 'act-mobile-checkin',
      title: 'Express Mobile Web Check-In Simulator',
      category: 'Quick Actions',
      icon: Smartphone,
      action: () => {
        onClose();
        onOpenMobileCheckIn?.();
      },
    },
    {
      id: 'act-sync-ota',
      title: 'Synchronize All OTA Channels (Booking.com, Airbnb, Expedia)',
      category: 'Quick Actions',
      icon: Share2,
      action: () => {
        refreshData();
        addToast('success', 'Full channel inventory & rate synchronization complete');
        onClose();
      },
    },
  ];

  if (isHotelAccessActive) {
    quickActions.unshift({
      id: 'act-exit-hotel',
      title: 'Exit Hotel Context & Return to SaaS Platform',
      category: 'Super Admin Access',
      icon: LogOut,
      action: () => {
        exitHotel();
        onClose();
      },
    });
  }

  // Reservation items matching query
  const matchingReservations = query.trim().length > 1
    ? reservations
        .filter(r => 
          r.guest.name.toLowerCase().includes(query.toLowerCase()) ||
          r.confirmationCode.toLowerCase().includes(query.toLowerCase()) ||
          r.guest.email.toLowerCase().includes(query.toLowerCase()) ||
          (r.roomId && r.roomId.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
        .map(r => ({
          id: `res-${r.id}`,
          title: `${r.guest.name} — ${r.confirmationCode} (${r.status.toUpperCase()})`,
          subtitle: `Room: ${r.roomId ? r.roomId.replace('room-', '').toUpperCase() : 'Unassigned'} | Stay: ${r.checkInDate} to ${r.checkOutDate} | $${r.totalAmount}`,
          category: 'Reservations & Guests',
          icon: Users,
          action: () => {
            onClose();
            onSelectReservation?.(r);
          }
        }))
    : [];

  // Hotel Tenants for Super Admin switching
  const matchingTenants = query.trim().length > 1 && (activeContext === 'PLATFORM' || isHotelAccessActive)
    ? tenants
        .filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
        .map(t => ({
          id: `tenant-${t.id}`,
          title: `Enter Hotel Context: ${t.name}`,
          subtitle: `Slug: ${t.slug || t.id} | Tier: ${t.subscriptionTier?.toUpperCase()} | Status: ${t.subscriptionStatus}`,
          category: 'Customer Hotel Tenants',
          icon: Building2,
          action: () => {
            enterHotel(t.id, 'customer_support', 'Accessed via Global Command Palette');
            onClose();
          }
        }))
    : [];

  // Combine and filter
  const allItems = [
    ...matchingReservations,
    ...matchingTenants,
    ...quickActions.filter(a => a.title.toLowerCase().includes(query.toLowerCase())),
    ...navCommands.filter(n => n.title.toLowerCase().includes(query.toLowerCase())),
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, guest name, reservation code, room, or hotel..."
            className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching commands, guests, or routes found for "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">{item.title}</div>
                      {item.subtitle && (
                        <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">↵</kbd> Select
            </span>
          </div>
          <span className="font-mono text-slate-400">
            {isHotelAccessActive ? '⚠ Super Admin Audited Access Active' : 'Vanguard Unified PMS Command Hub'}
          </span>
        </div>
      </div>
    </div>
  );
};
