import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertTriangle,
  RefreshCw,
  Bell,
  UtensilsCrossed,
  Filter,
  CheckCheck
} from 'lucide-react';
import { KDSTicket } from '../types';

export const KDSView: React.FC = () => {
  const { currentProperty, apiFetch, addToast, dataVersion, activeSubTab } = useApp();

  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab && ['all', 'grill', 'hotline', 'salad', 'bar'].includes(activeSubTab)) {
      setSelectedStation(activeSubTab);
    }
  }, [activeSubTab]);

  const loadKDSTickets = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/kds/tickets?station=${selectedStation}`);
      setTickets(data);
    } catch (e) {
      console.error('Failed to load KDS tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKDSTickets();
    const interval = setInterval(loadKDSTickets, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [currentProperty?.id, selectedStation, dataVersion]);

  const handleBumpTicket = async (ticketId: string, currentStatus: string) => {
    let nextStatus: 'pending' | 'in_progress' | 'ready' | 'completed' = 'in_progress';
    if (currentStatus === 'pending') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'completed';

    try {
      await apiFetch(`/api/kds/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      addToast('success', `Ticket status updated to ${nextStatus.toUpperCase()}`);
      loadKDSTickets();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to bump ticket');
    }
  };

  const handleItemStatusToggle = async (ticketId: string, itemId: string, itemStatus: string) => {
    const nextItemStatus = itemStatus === 'ready' ? 'preparing' : 'ready';
    try {
      await apiFetch(`/api/kds/tickets/${ticketId}/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextItemStatus }),
      });
      loadKDSTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const stations = [
    { id: 'all', label: 'All Stations' },
    { id: 'hot_kitchen', label: 'Hot Kitchen & Saute' },
    { id: 'cold_kitchen', label: 'Cold Kitchen & Salads' },
    { id: 'grill', label: 'Charcoal Grill' },
    { id: 'bar', label: 'Bar & Drinks' },
    { id: 'pastry', label: 'Pastry & Desserts' },
  ];

  return (
    <div className="space-y-6 select-none" id="kds-view">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600/30 border border-rose-500/40 rounded-xl text-rose-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Kitchen Display System (KDS)</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">LIVE FEED</span>
            </div>
            <p className="text-slate-400 text-xs">Real-time station order queue, cook timers, modifier alerts & expediter bump bar</p>
          </div>
        </div>

        {/* Station Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {stations.map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedStation === st.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            onClick={loadKDSTickets}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition ml-2 cursor-pointer"
            title="Refresh KDS Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Queue Grid */}
      {tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-xs">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-slate-800">Kitchen Queue is Clear</h3>
          <p className="text-xs text-slate-500 mt-1">All tickets have been fulfilled and served.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map(ticket => {
            const isRush = ticket.priority === 'rush';
            const isReady = ticket.status === 'ready';
            const isInProgress = ticket.status === 'in_progress';

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-xl border flex flex-col justify-between shadow-sm transition overflow-hidden ${
                  isRush
                    ? 'border-rose-400 ring-2 ring-rose-500/30'
                    : isReady
                    ? 'border-emerald-400 ring-1 ring-emerald-500/20'
                    : isInProgress
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      isRush
                        ? 'bg-rose-500 text-white'
                        : isReady
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm">#{ticket.orderNumber}</span>
                        {isRush && (
                          <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                            <Flame className="w-3 h-3" /> RUSH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold opacity-90">{ticket.destination}</div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-mono font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ticket.timerMinutes}m</span>
                      </div>
                      <div className="text-[10px] opacity-80">{ticket.serverName}</div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5">
                    {ticket.items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleItemStatusToggle(ticket.id, item.id, item.status)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                          item.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 line-through opacity-70'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="text-indigo-600 font-black">{item.quantity}x</span>
                            <span>{item.name}</span>
                          </div>

                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-[11px] text-slate-500 italic pl-5">
                              + {item.modifiers.join(', ')}
                            </div>
                          )}

                          {item.specialInstructions && (
                            <div className="text-[11px] text-amber-700 bg-amber-50 p-1 rounded font-medium border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{item.specialInstructions}</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {item.status === 'ready' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-slate-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bump Bar / Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Status: <span className="text-slate-700">{ticket.status.replace('_', ' ')}</span>
                  </div>

                  <button
                    onClick={() => handleBumpTicket(ticket.id, ticket.status)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      ticket.status === 'pending'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : ticket.status === 'in_progress'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    {ticket.status === 'pending' && <span>Start Prep</span>}
                    {ticket.status === 'in_progress' && <span>Mark Ready</span>}
                    {ticket.status === 'ready' && (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Fulfill & Serve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
