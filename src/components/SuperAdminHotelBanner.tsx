import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertTriangle, LogOut, Clock, Building2, ShieldCheck, Key, RefreshCw, ChevronRight } from 'lucide-react';
import { SessionExtensionModal } from './SessionExtensionModal';

export const SuperAdminHotelBanner: React.FC = () => {
  // Can consume from useAuth or fallback to useApp
  let authCtx: any = null;
  try {
    authCtx = useAuth();
  } catch {
    // Fallback if not inside AuthProvider
  }
  const appCtx = useApp();

  const isHotelAccessActive = authCtx?.isHotelAccessActive ?? appCtx.isHotelAccessActive;
  const hotelAccessSession = authCtx?.hotelAccessSession ?? appCtx.hotelAccessSession;
  const currentTenant = authCtx?.currentTenant ?? appCtx.currentTenant;
  const exitHotel = authCtx?.exitHotel ?? appCtx.exitHotelContext;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  useEffect(() => {
    if (!isHotelAccessActive || !hotelAccessSession?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(hotelAccessSession.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isHotelAccessActive, hotelAccessSession?.startedAt]);

  if (!isHotelAccessActive) {
    return null;
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <>
      <div
        id="super-admin-hotel-banner"
        className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-medium px-4 py-2 shadow-lg border-b border-amber-700 select-none animate-in fade-in slide-in-from-top-1 duration-200"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Warning Banner Label & Details */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-1 rounded-md bg-slate-950/20 text-slate-950 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span className="font-black tracking-wider uppercase text-slate-950 bg-slate-950/10 px-2 py-0.5 rounded border border-slate-950/20 shadow-xs">
                ⚠ SUPER ADMIN HOTEL ACCESS
              </span>

              <span className="flex items-center gap-1 font-bold text-slate-950 truncate">
                <Building2 className="w-3.5 h-3.5 opacity-80" />
                <span>{currentTenant?.name || hotelAccessSession?.targetTenantName || 'Customer Hotel'}</span>
              </span>

              {hotelAccessSession?.reasonLabel && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-amber-400/60 px-2 py-0.5 rounded-full border border-amber-600/30">
                  <ShieldCheck className="w-3 h-3 text-slate-900" />
                  <span>Reason: {hotelAccessSession.reasonLabel}</span>
                </span>
              )}

              <button
                onClick={() => setIsExtensionModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-950 font-mono bg-amber-400/70 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer border border-amber-600/40 transition"
                title="Click to manage session timeout and duration"
              >
                <Clock className="w-3 h-3 opacity-80" />
                <span>Session: {formatElapsed(elapsedSeconds)}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="hidden sm:flex items-center space-x-1 bg-amber-400/80 hover:bg-amber-300 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer border border-amber-600/40"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Extend</span>
            </button>

            <button
              id="exit-hotel-btn"
              onClick={exitHotel}
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer border border-amber-400/40"
              title="Terminate audited session and return to SaaS Platform context"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              <span>Exit Hotel</span>
            </button>
          </div>
        </div>
      </div>

      <SessionExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />
    </>
  );
};
