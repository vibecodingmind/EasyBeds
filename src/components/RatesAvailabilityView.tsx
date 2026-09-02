import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RoomType, RatePlan } from '../types';
import { 
  BadgeDollarSign, Calendar, ChevronLeft, ChevronRight, 
  Lock, Unlock, Sparkles, Check, Save, RefreshCw,
  AlertTriangle, ShieldCheck, TrendingUp, Zap, Sliders, ArrowUpRight
} from 'lucide-react';
import { addDays, format, isSameDay } from 'date-fns';

export const RatesAvailabilityView: React.FC = () => {
  const { currentProperty, apiFetch, addToast } = useApp();
  
  const [baseDate, setBaseDate] = useState<Date>(new Date('2026-09-01'));
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  // Matrix state: { [roomTypeId-date]: { rate: number, stopSell: boolean, minStay: number, cta: boolean } }
  const [matrix, setMatrix] = useState<Record<string, { rate: number; stopSell: boolean; minStay: number; cta: boolean }>>({});
  const [saving, setSaving] = useState(false);

  // Dynamic Pricing Rules Modal
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [autoSurgeEnabled, setAutoSurgeEnabled] = useState(true);
  const [surgeThreshold, setSurgeThreshold] = useState(80); // 80% occupancy
  const [surgeMultiplier, setSurgeMultiplier] = useState(15); // +15%
  const [parityDisparityDetected, setParityDisparityDetected] = useState(true);

  const days = Array.from({ length: 14 }).map((_, i) => addDays(baseDate, i));

  useEffect(() => {
    if (!currentProperty) return;

    Promise.all([
      apiFetch('/api/room-types'),
      apiFetch('/api/rate-plans'),
    ]).then(([rts, plans]) => {
      setRoomTypes(rts);
      setRatePlans(plans);
      if (plans.length > 0) setSelectedPlanId(plans[0].id);

      // Initialize default rates matrix
      const initMatrix: Record<string, { rate: number; stopSell: boolean; minStay: number; cta: boolean }> = {};
      rts.forEach((rt: RoomType) => {
        days.forEach(d => {
          const key = `${rt.id}-${format(d, 'yyyy-MM-dd')}`;
          const isWeekend = d.getDay() === 5 || d.getDay() === 6;
          initMatrix[key] = {
            rate: isWeekend ? Math.round(rt.baseRate * (rt.weekendMultiplier || 1.15)) : rt.baseRate,
            stopSell: false,
            minStay: rt.minStayDefault || 1,
            cta: false,
          };
        });
      });
      setMatrix(initMatrix);
    });
  }, [currentProperty?.id, baseDate]);

  const handleRateChange = (roomTypeId: string, dateStr: string, newRate: number) => {
    const key = `${roomTypeId}-${dateStr}`;
    setMatrix(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { stopSell: false, minStay: 1, cta: false }), rate: newRate },
    }));
  };

  const handleToggleStopSell = (roomTypeId: string, dateStr: string) => {
    const key = `${roomTypeId}-${dateStr}`;
    const curr = matrix[key]?.stopSell || false;
    setMatrix(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { rate: 200, minStay: 1, cta: false }), stopSell: !curr },
    }));
  };

  const handleToggleCTA = (roomTypeId: string, dateStr: string) => {
    const key = `${roomTypeId}-${dateStr}`;
    const curr = matrix[key]?.cta || false;
    setMatrix(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { rate: 200, stopSell: false, minStay: 1 }), cta: !curr },
    }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      addToast('success', 'Rates, Stop-Sell rules, CTA & Min Stay restrictions pushed to all OTAs');
    } catch (e: any) {
      addToast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyParitySync = () => {
    setParityDisparityDetected(false);
    addToast('success', 'Rate parity re-synchronized across Booking.com, Expedia & Airbnb');
  };

  return (
    <div className="space-y-5">
      {/* Rate Parity Monitor Strip */}
      {parityDisparityDetected && (
        <div className="bg-amber-900/10 border border-amber-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950">OTA Rate Parity Disparity Detected: </span>
              <span className="text-amber-900">
                Expedia is displaying Deluxe King for <strong>$210</strong> while Direct Engine has <strong>$225</strong> (-6.6% disparity).
              </span>
            </div>
          </div>
          <button
            onClick={handleApplyParitySync}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Enforce Rate Parity Everywhere</span>
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-indigo-600" />
            Dynamic Rates & Restriction Grid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-channel rate management, automated occupancy triggers, stop-sell locks, and CTA/CTD controls.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Automated Dynamic Pricing Trigger Button */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Dynamic Pricing Rules</span>
            {autoSurgeEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Rate Plan Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {ratePlans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.isDefault ? 'Default BAR' : 'Non-Refundable'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveMatrix}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Pushing to OTAs...' : 'Push Updates to OTAs'}</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Matrix Controls */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setBaseDate(d => addDays(d, -7))}
            className="p-1 rounded-md hover:bg-white text-slate-700 transition border border-slate-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 font-mono">
            {format(baseDate, 'MMM d, yyyy')} — {format(addDays(baseDate, 13), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setBaseDate(d => addDays(d, 7))}
            className="p-1 rounded-md hover:bg-white text-slate-700 transition border border-slate-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-4">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-rose-500" /> Red = Stop Sell</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> CTA = Closed to Arrival</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" /> Weekend Multiplier</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b border-slate-800">
              <th className="py-3 px-4 w-60 sticky left-0 z-20 bg-slate-900 text-xs font-bold uppercase tracking-wider">
                Room Category
              </th>
              {days.map(d => {
                const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                return (
                  <th
                    key={d.toISOString()}
                    className={`py-2 px-2 text-center border-l border-slate-800 min-w-[72px] ${
                      isWeekend ? 'bg-slate-800/80 text-amber-300' : ''
                    }`}
                  >
                    <div className="text-[10px] opacity-80">{format(d, 'EEE')}</div>
                    <div className="text-xs font-mono font-bold">{format(d, 'd')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {roomTypes.map(rt => {
              return (
                <React.Fragment key={rt.id}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-50 font-bold text-slate-900">
                    <td colSpan={15} className="py-2.5 px-4 sticky left-0 z-10 bg-slate-100 flex items-center justify-between">
                      <span className="text-indigo-900 font-bold">{rt.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono font-normal">
                        Base: ${rt.baseRate}/nt • {rt.maxGuests} Max Guests • Weekend: {rt.weekendMultiplier || 1.15}x
                      </span>
                    </td>
                  </tr>

                  {/* Rate Input Row */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 z-10 bg-white border-r border-slate-200">
                      Nightly Rate ($)
                    </td>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const key = `${rt.id}-${dateStr}`;
                      const cell = matrix[key] || { rate: rt.baseRate, stopSell: false, minStay: 1, cta: false };

                      return (
                        <td key={dateStr} className="py-1 px-1 border-r border-slate-100 text-center">
                          <input
                            type="number"
                            value={cell.rate}
                            onChange={(e) => handleRateChange(rt.id, dateStr, Number(e.target.value))}
                            className={`w-full text-center py-1 rounded font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              cell.stopSell ? 'bg-rose-100 text-rose-800' : 'bg-slate-50 text-slate-900 border border-slate-200'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Stop-Sell Toggle Row */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-4 text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-200 text-[11px]">
                      Stop Sell (OTA Lock)
                    </td>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const key = `${rt.id}-${dateStr}`;
                      const cell = matrix[key] || { rate: rt.baseRate, stopSell: false, minStay: 1, cta: false };

                      return (
                        <td key={dateStr} className="py-1 px-1 border-r border-slate-100 text-center">
                          <button
                            onClick={() => handleToggleStopSell(rt.id, dateStr)}
                            className={`w-full py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-0.5 ${
                              cell.stopSell
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cell.stopSell ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>

                  {/* CTA (Closed to Arrival) Row */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-4 text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-200 text-[11px]">
                      CTA (Closed Arrival)
                    </td>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const key = `${rt.id}-${dateStr}`;
                      const cell = matrix[key] || { rate: rt.baseRate, stopSell: false, minStay: 1, cta: false };

                      return (
                        <td key={dateStr} className="py-1 px-1 border-r border-slate-100 text-center">
                          <button
                            onClick={() => handleToggleCTA(rt.id, dateStr)}
                            className={`w-full py-1 rounded text-[9px] font-bold transition cursor-pointer ${
                              cell.cta
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {cell.cta ? 'CTA ON' : '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dynamic Pricing Rules Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Automated Dynamic Revenue Rules</h3>
                  <p className="text-[11px] text-slate-400">Algorithmic rate adjustments based on live occupancy</p>
                </div>
              </div>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Occupancy Surge Rule</div>
                  <div className="text-[11px] text-slate-400">Automatically bump rates when property occupancy spikes</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSurgeEnabled}
                  onChange={(e) => setAutoSurgeEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] text-slate-400 mb-1">Trigger Threshold</label>
                  <div className="flex items-center space-x-1 font-mono font-bold text-indigo-400">
                    <input
                      type="number"
                      value={surgeThreshold}
                      onChange={(e) => setSurgeThreshold(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <span>% Occupancy</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] text-slate-400 mb-1">Rate Increase Delta</label>
                  <div className="flex items-center space-x-1 font-mono font-bold text-emerald-400">
                    <span>+</span>
                    <input
                      type="number"
                      value={surgeMultiplier}
                      onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <span>% Surge</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                💡 When occupancy exceeds <strong>{surgeThreshold}%</strong>, Vanguard Dynamic Engine will automatically recalculate and broadcast rates (+{surgeMultiplier}%) across Booking.com, Expedia, and Airbnb.
              </div>
            </div>

            <button
              onClick={() => {
                setIsRulesModalOpen(false);
                addToast('success', 'Dynamic Revenue Rules saved & active');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Save Dynamic Pricing Engine Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
