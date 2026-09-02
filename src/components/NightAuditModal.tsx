import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Moon, CheckCircle2, AlertTriangle, FileText, ArrowRight, 
  DollarSign, BedDouble, RefreshCw, X, ShieldCheck, Download, Calendar
} from 'lucide-react';

export const NightAuditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { currentProperty, addToast, refreshData } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  // Night audit pre-checks
  const [inHouseCount, setInHouseCount] = useState(14);
  const [unresolvedDepartures, setUnresolvedDepartures] = useState(0);
  const [unassignedArrivals, setUnassignedArrivals] = useState(0);
  const [openRestaurantChecks, setOpenRestaurantChecks] = useState(0);
  
  // Ledger summary
  const [roomRevenue, setRoomRevenue] = useState(3240.00);
  const [taxRevenue, setTaxRevenue] = useState(388.80);
  const [fnbRevenue, setFnbRevenue] = useState(1150.50);
  const [paymentsCollected, setPaymentsCollected] = useState(4779.30);

  if (!isOpen) return null;

  const handleExecuteAudit = async () => {
    setIsRunning(true);
    try {
      // Step 2: Posting room & tax
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Reconciling Trial Balance & Closing POS
      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 800));

      // Step 4: Rolling Business Date
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 700));

      setAuditComplete(true);
      addToast('success', 'Night Audit complete! Business day rolled from Sep 01 to Sep 02, 2026.');
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Night audit failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Automated Night Audit & Day Close</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                  SEP 01 → SEP 02
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentProperty?.name || 'Property'} • Financial trial balance, folio posting & business date rollover
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-800">
          {/* Audit Steps Progress Indicator */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, title: 'Pre-Audit Audit' },
              { num: 2, title: 'Room & Tax Post' },
              { num: 3, title: 'Trial Balance' },
              { num: 4, title: 'Day Rollover' },
            ].map((st) => (
              <div
                key={st.num}
                className={`p-2.5 rounded-xl border text-center transition ${
                  currentStep === st.num
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                    : currentStep > st.num || auditComplete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {currentStep > st.num || auditComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">
                      {st.num}
                    </span>
                  )}
                  <span className="truncate">{st.title}</span>
                </div>
              </div>
            ))}
          </div>

          {!auditComplete ? (
            <>
              {/* Pre-Audit System Health Check */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Pre-Audit Operational Integrity Checks</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">In-House Stays to Post:</span>
                    <span className="font-bold text-slate-900 font-mono">{inHouseCount} Rooms</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">Pending Check-Outs:</span>
                    <span className="font-bold text-emerald-600 font-mono">0 (All Settled)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">Unassigned Arrivals:</span>
                    <span className="font-bold text-emerald-600 font-mono">0 (Assigned)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">Open Bistro Checks:</span>
                    <span className="font-bold text-emerald-600 font-mono">0 (Closed/Billed)</span>
                  </div>
                </div>
              </div>

              {/* Day Close Financial Simulation */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Trial Balance Projection (Sep 01, 2026)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                    Balanced ($0.00 Variance)
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-600">Automated Room Rate Posting:</span>
                    <span className="font-mono font-bold text-slate-900">+${roomRevenue.toFixed(2)}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-600">Occupancy & Local City Taxes (12%):</span>
                    <span className="font-mono font-bold text-slate-900">+${taxRevenue.toFixed(2)}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-600">Food & Beverage / Incidentals Posted:</span>
                    <span className="font-mono font-bold text-slate-900">+${fnbRevenue.toFixed(2)}</span>
                  </div>
                  <div className="py-1.5 flex justify-between font-bold text-indigo-900 bg-indigo-50/50 px-2 rounded">
                    <span>Total Day Debits Posted to Folios:</span>
                    <span className="font-mono">${(roomRevenue + taxRevenue + fnbRevenue).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Night Audit Successfully Executed</h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Posted room and tax to all 14 active in-house guest folios. All cashier drawer batches closed, trial balance verified, and business date rolled to <strong>Sep 02, 2026</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Daily Manager's Packet (PDF)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Current Hotel Business Date: <strong className="text-slate-800 font-mono">2026-09-01 (Night Shift)</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              {auditComplete ? 'Close' : 'Cancel'}
            </button>
            {!auditComplete && (
              <button
                onClick={handleExecuteAudit}
                disabled={isRunning}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Audit...</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Run Night Audit & Close Day</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
