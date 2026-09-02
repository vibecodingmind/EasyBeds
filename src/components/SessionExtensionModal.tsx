import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  LogOut,
  X,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export const SessionExtensionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  let authCtx: any = null;
  try {
    authCtx = useAuth();
  } catch {}
  const appCtx = useApp();

  const isHotelAccessActive = authCtx?.isHotelAccessActive ?? appCtx.isHotelAccessActive;
  const hotelAccessSession = authCtx?.hotelAccessSession ?? appCtx.hotelAccessSession;
  const currentTenant = authCtx?.currentTenant ?? appCtx.currentTenant;
  const exitHotel = authCtx?.exitHotel ?? appCtx.exitHotelContext;
  const addToast = appCtx.addToast;

  const [extendMinutes, setExtendMinutes] = useState(30);
  const [isExtending, setIsExtending] = useState(false);

  if (!isOpen || !isHotelAccessActive) return null;

  const handleExtend = async () => {
    setIsExtending(true);
    await new Promise(r => setTimeout(r, 600));
    setIsExtending(false);
    addToast('success', `Super Admin audited session extended by +${extendMinutes} minutes`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-amber-950/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 leading-tight">Audited Session Management</h2>
              <p className="text-[11px] text-slate-400">Super Admin Hotel Operating Window</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Target Tenant:</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {currentTenant?.name || hotelAccessSession?.targetTenantName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Access Reason:</span>
              <span className="text-amber-300">{hotelAccessSession?.reasonLabel || 'Customer Support'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Session ID:</span>
              <span className="font-mono text-[10px] text-slate-400">{hotelAccessSession?.sessionId}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Extend Audited Session Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setExtendMinutes(mins)}
                  className={`py-2 px-1 rounded-xl border text-center font-semibold transition cursor-pointer ${
                    extendMinutes === mins
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  +{mins} Minutes
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                exitHotel();
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 font-bold text-xs transition border border-slate-700 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Hotel Now</span>
            </button>

            <button
              onClick={handleExtend}
              disabled={isExtending}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtending ? 'animate-spin' : ''}`} />
              <span>Extend (+{extendMinutes}m)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
