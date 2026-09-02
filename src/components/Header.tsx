import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SuperAdminHotelBanner } from './SuperAdminHotelBanner';
import { 
  Building2, ShieldCheck, ChevronDown, Plus, 
  RefreshCw, Hotel, Sparkles, UserCheck, Shield,
  AlertTriangle, LogOut, Server, ExternalLink,
  Search, Key, Printer, Smartphone, Command
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { DigitalKeycardModal } from './DigitalKeycardModal';
import { RunSheetsModal } from './RunSheetsModal';
import { MobileCheckInModal } from './MobileCheckInModal';
import { Reservation } from '../types';

export const Header: React.FC<{ 
  onOpenNewReservation: () => void;
  onSelectReservation?: (res: Reservation) => void;
}> = ({ onOpenNewReservation, onSelectReservation }) => {
  const {
    tenants,
    currentTenant,
    setCurrentTenant,
    properties,
    currentProperty,
    setCurrentProperty,
    currentUser,
    refreshData,
    addToast,
    authContextType,
    hotelAccessSession,
    isHotelAccessActive,
    exitHotelContext,
    setActiveView,
    logout,
  } = useApp();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeycardModalOpen, setIsKeycardModalOpen] = useState(false);
  const [isRunSheetsModalOpen, setIsRunSheetsModalOpen] = useState(false);
  const [isMobileCheckInOpen, setIsMobileCheckInOpen] = useState(false);
  const [modalTargetReservation, setModalTargetReservation] = useState<Reservation | null>(null);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncAll = () => {
    refreshData();
    addToast('info', 'Triggered full PMS & OTA inventory sync');
  };

  return (
    <div className="sticky top-0 z-30 flex flex-col">
      {/* Persistent Super Admin Hotel Access Banner */}
      <SuperAdminHotelBanner />

      {/* Main Header Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between text-white shadow-md">
        {/* Left: Brand & Tenant / Property Switcher */}
        <div className="flex items-center space-x-3 md:space-x-5">
          <div
            onClick={() => {
              if (authContextType === 'PLATFORM') {
                setActiveView('platform-admin');
              } else {
                setActiveView('dashboard');
              }
            }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-inner font-bold text-lg tracking-wider text-white">
              V
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight leading-none text-slate-100 flex items-center gap-1.5">
                VANGUARD <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-400/30">PMS OS</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Hotel PMS & Channel Manager SaaS</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Context Identifier or Tenant Switcher */}
          {authContextType === 'PLATFORM' ? (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">SaaS Platform Management</span>
              <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">| Global SaaS Kernel</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Active Hotel Tenant Badge / Selector */}
              <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-slate-400 font-medium">Hotel:</span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                  {currentTenant?.name || 'Hotel'}
                </span>
                {currentTenant?.subscriptionTier && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 uppercase">
                    {currentTenant.subscriptionTier}
                  </span>
                )}
              </div>

              {/* Property Selector within Hotel */}
              {properties.length > 0 && (
                <div className="hidden xl:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                  <Hotel className="w-3.5 h-3.5 text-sky-400" />
                  <select
                    value={currentProperty?.id || ''}
                    onChange={(e) => {
                      const p = properties.find((item) => item.id === e.target.value);
                      if (p) setCurrentProperty(p);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-2 max-w-[140px] truncate"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Global Command Palette Quick Trigger Search */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Global Command Palette (Cmd+K or Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Search commands, guests, rooms...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right: Sync & Staff Switcher */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Refresh / Sync Button */}
          <button
            onClick={handleSyncAll}
            title="Refresh & Synchronize"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Signed-in staff identity */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-slate-800/90 pl-2.5 pr-1 py-1 rounded-lg border border-slate-700/80">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <div className="hidden sm:block pr-1">
                <div className="text-xs font-bold text-amber-300 leading-tight truncate max-w-[160px]">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {(currentUser?.customRoleName || currentUser?.role || '').replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewBooking={onOpenNewReservation}
        onOpenKeycard={(r) => {
          setModalTargetReservation(r || null);
          setIsKeycardModalOpen(true);
        }}
        onOpenRunSheets={() => setIsRunSheetsModalOpen(true)}
        onOpenMobileCheckIn={(r) => {
          setModalTargetReservation(r || null);
          setIsMobileCheckInOpen(true);
        }}
        onSelectReservation={onSelectReservation}
      />

      {/* Digital Keycard Encoder Modal */}
      <DigitalKeycardModal
        isOpen={isKeycardModalOpen}
        onClose={() => setIsKeycardModalOpen(false)}
        reservation={modalTargetReservation}
      />

      {/* Printable Run Sheets Modal */}
      <RunSheetsModal
        isOpen={isRunSheetsModalOpen}
        onClose={() => setIsRunSheetsModalOpen(false)}
      />

      {/* Mobile Web Check-In Simulator Modal */}
      <MobileCheckInModal
        isOpen={isMobileCheckInOpen}
        onClose={() => setIsMobileCheckInOpen(false)}
        reservation={modalTargetReservation}
      />
    </div>
  );
};
