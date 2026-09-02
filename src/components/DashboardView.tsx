import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  AnalyticsMetrics, Reservation, SyncLog, Room,
  HousekeepingTask, MaintenanceWorkOrder, KDSTicket,
  PoolFacility, InventoryProduct, PurchaseOrder
} from '../types';
import {
  TrendingUp, Users, DoorOpen, DollarSign, ArrowUpRight,
  Sparkles, Calendar, Share2, CheckCircle2, AlertTriangle,
  Clock, Utensils, ChefHat, Waves, Package, Wrench, Shield,
  Receipt, BedDouble, AlertCircle, ArrowRight, UserCheck
} from 'lucide-react';

export const DashboardView: React.FC<{ onOpenNewBooking: () => void; onSelectReservation: (res: Reservation) => void }> = ({
  onOpenNewBooking,
  onSelectReservation,
}) => {
  const {
    currentProperty,
    currentUser,
    currentRole,
    hasPermission,
    isModuleEnabled,
    apiFetch,
    dataVersion,
    addToast,
    setActiveView
  } = useApp();

  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [todayArrivals, setTodayArrivals] = useState<Reservation[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<Reservation[]>([]);
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hkTasks, setHkTasks] = useState<HousekeepingTask[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [kdsTickets, setKdsTickets] = useState<KDSTicket[]>([]);
  const [poolFacility, setPoolFacility] = useState<PoolFacility | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryProduct[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty) return;
    setLoading(true);

    Promise.all([
      apiFetch('/api/reports/analytics').catch(() => null),
      apiFetch('/api/reservations?status=confirmed').catch(() => []),
      apiFetch('/api/reservations?status=checked_in').catch(() => []),
      apiFetch('/api/channels/logs').catch(() => []),
      apiFetch('/api/rooms').catch(() => []),
      apiFetch('/api/housekeeping/tasks').catch(() => []),
      apiFetch('/api/maintenance/orders').catch(() => []),
      apiFetch('/api/kds/tickets').catch(() => []),
      apiFetch('/api/pool/facilities').catch(() => []),
      apiFetch('/api/inventory/products').catch(() => []),
      apiFetch('/api/purchasing/orders').catch(() => []),
    ])
      .then(([
        analyticsData, confirmedRes, checkedInRes, logs, roomList,
        tasks, orders, kds, pool, products, pos
      ]) => {
        if (analyticsData) setMetrics(analyticsData);
        
        const today = '2026-09-01';
        setTodayArrivals((confirmedRes as Reservation[]).filter(r => r.checkIn === today));
        setTodayDepartures((checkedInRes as Reservation[]).filter(r => r.checkOut === today));
        setRecentLogs((logs as SyncLog[]).slice(0, 5));
        setRooms(roomList || []);
        setHkTasks(tasks || []);
        setWorkOrders(orders || []);
        setKdsTickets(kds || []);
        if (Array.isArray(pool) && pool.length > 0) setPoolFacility(pool[0]);
        if (Array.isArray(products)) {
          setLowStockItems(products.filter(p => p.currentStock <= p.minStockLevel));
        }
        if (Array.isArray(pos)) {
          setPendingPOs(pos.filter(p => p.status === 'ORDERED' || p.status === 'PARTIAL'));
        }
      })
      .catch((err) => console.error('Dashboard load error', err))
      .finally(() => setLoading(false));
  }, [currentProperty?.id, dataVersion]);

  const handleQuickCheckIn = async (res: Reservation) => {
    try {
      await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_in', roomId: res.roomId || 'rm-101' }),
      });
      addToast('success', `Checked in ${res.guest.firstName} ${res.guest.lastName} (${res.reservationCode})`);
    } catch (e: any) {
      addToast('error', e.message || 'Check-in failed');
    }
  };

  const handleQuickCheckOut = async (res: Reservation) => {
    try {
      await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_out' }),
      });
      addToast('success', `Checked out ${res.guest.firstName} ${res.guest.lastName}. Room marked Dirty.`);
    } catch (e: any) {
      addToast('error', e.message || 'Check-out failed');
    }
  };

  const cleanRooms = rooms.filter(r => r.status === 'clean' || r.status === 'inspected').length;
  const dirtyRooms = rooms.filter(r => r.status === 'dirty').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance' || r.status === 'out_of_order').length;

  return (
    <div className="space-y-6">
      {/* Property & Staff Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight">{currentProperty?.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              Active PMS
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              {currentUser?.customRoleName || currentRole.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{currentUser?.name}</strong> • {currentUser?.department || 'Operations'} • {currentProperty?.currency} Currency
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasPermission('pms.tape_chart.view') && (
            <button
              onClick={() => setActiveView('calendar')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Tape Chart
            </button>
          )}

          {hasPermission('reservations.create') && (
            <button
              onClick={onOpenNewBooking}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
            >
              + Create Reservation
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Role-Specific Focus Widgets */}
      {/* 1. Front Desk Focus */}
      {currentRole === 'FRONT_DESK' && (
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              FD
            </div>
            <div>
              <div className="text-sm font-bold text-indigo-950">Front Desk Shift Priority</div>
              <div className="text-xs text-indigo-800">
                {todayArrivals.length} arrivals to check in • {todayDepartures.length} departures due today • {dirtyRooms} rooms waiting on housekeeping
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('frontdesk')}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition cursor-pointer"
          >
            Open Front Desk Hub →
          </button>
        </div>
      )}

      {/* 2. Housekeeping Focus */}
      {currentRole === 'HOUSEKEEPING' && (
        <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              HK
            </div>
            <div>
              <div className="text-sm font-bold text-teal-950">Housekeeping Turnover Queue</div>
              <div className="text-xs text-teal-800">
                {dirtyRooms} dirty rooms requiring turnover • {hkTasks.filter(t => t.status === 'in_progress').length} active cleaning tasks in progress
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('housekeeping')}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-500 transition cursor-pointer"
          >
            Open Housekeeping Board →
          </button>
        </div>
      )}

      {/* 3. Maintenance Focus */}
      {currentRole === 'MAINTENANCE' && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              ENG
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950">Facilities & Maintenance Dispatch</div>
              <div className="text-xs text-amber-800">
                {workOrders.filter(w => w.status !== 'completed').length} open maintenance work orders • {maintenanceRooms} rooms blocked Out of Order
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('maintenance')}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-500 transition cursor-pointer"
          >
            Open Work Orders Hub →
          </button>
        </div>
      )}

      {/* 4. Kitchen Chef Focus */}
      {currentRole === 'KITCHEN_CHEF' && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              KDS
            </div>
            <div>
              <div className="text-sm font-bold text-rose-950">Kitchen Order Preparation Board</div>
              <div className="text-xs text-rose-800">
                {kdsTickets.filter(k => k.status === 'PREPARING' || k.status === 'NEW').length} active kitchen tickets • Station prep live timers active
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('kds')}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition cursor-pointer"
          >
            Open KDS Screen →
          </button>
        </div>
      )}

      {/* 5. Swimming Pool Focus */}
      {currentRole === 'POOL_ATTENDANT' && (
        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
              POOL
            </div>
            <div>
              <div className="text-sm font-bold text-sky-950">Swimming Pool Facility Management</div>
              <div className="text-xs text-sky-800">
                Current Occupancy: {poolFacility?.currentOccupancy || 14} / {poolFacility?.maxCapacity || 80} swimmers • Water Quality: Compliant
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('pool')}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-500 transition cursor-pointer"
          >
            Open Pool Hub →
          </button>
        </div>
      )}

      {/* 6. Inventory Officer Focus */}
      {currentRole === 'INVENTORY_MANAGER' && (
        <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
              STK
            </div>
            <div>
              <div className="text-sm font-bold text-orange-950">Procurement & Stock Replenishment</div>
              <div className="text-xs text-orange-800">
                {lowStockItems.length} items below minimum safety threshold • {pendingPOs.length} pending Purchase Orders to receive
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveView('inventory')}
            className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-500 transition cursor-pointer"
          >
            Open Inventory Hub →
          </button>
        </div>
      )}

      {/* Core PMS Financial & Occupancy KPI Cards (visible to management & finance) */}
      {(['SUPER_ADMIN', 'PROPERTY_OWNER', 'PROPERTY_MANAGER', 'FINANCE', 'CHANNEL_MANAGER'].includes(currentRole) || hasPermission('reports.analytics_view')) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Occupancy Rate */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Occupancy Rate</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <DoorOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{metrics?.occupancyRate || 85.0}%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +4.2%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics?.occupiedRooms || 10} of {metrics?.totalRooms || 14} rooms occupied
            </div>
          </div>

          {/* ADR (Average Daily Rate) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Average Daily Rate (ADR)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">${metrics?.adr || 342.50}</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +$18.00
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Calculated across all booked room nights</div>
          </div>

          {/* RevPAR */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">RevPAR (Revenue / Room)</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">${metrics?.revPar || 291.13}</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +6.8%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Key hospitality revenue yield metric</div>
          </div>

          {/* Month Revenue */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Month-to-Date Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ${(metrics?.monthRevenue || 16227).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-purple-600">Gross</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Proj: ${(metrics?.projectedMonthRevenue || 29200).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: Today's Arrivals, Departures & Housekeeping status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Arrivals (Front Desk Quick Action) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900">Today's Arrivals</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {todayArrivals.length}
              </span>
            </div>
            {hasPermission('reservations.view') && (
              <button
                onClick={() => setActiveView('frontdesk')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View Hub →
              </button>
            )}
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {todayArrivals.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No pending arrivals remaining for today.
              </div>
            ) : (
              todayArrivals.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between transition"
                >
                  <div className="cursor-pointer" onClick={() => onSelectReservation(res)}>
                    <div className="text-xs font-bold text-slate-900">
                      {res.guest.firstName} {res.guest.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-indigo-600 font-semibold">{res.reservationCode}</span>
                      <span>•</span>
                      <span className="capitalize">{res.source.replace('_', '.')}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-medium">Room: {res.roomId?.replace('rm-', '') || 'Unassigned'}</span>
                    </div>
                  </div>

                  {hasPermission('reservations.check_in') && (
                    <button
                      onClick={() => handleQuickCheckIn(res)}
                      className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Check In
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Departures */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Today's Departures</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {todayDepartures.length}
              </span>
            </div>
            {hasPermission('reservations.view') && (
              <button
                onClick={() => setActiveView('frontdesk')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View Hub →
              </button>
            )}
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {todayDepartures.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No departures due today.
              </div>
            ) : (
              todayDepartures.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between transition"
                >
                  <div className="cursor-pointer" onClick={() => onSelectReservation(res)}>
                    <div className="text-xs font-bold text-slate-900">
                      {res.guest.firstName} {res.guest.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-slate-700 font-semibold">{res.reservationCode}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-medium">Room {res.roomId?.replace('rm-', '')}</span>
                      <span>•</span>
                      <span className={res.balanceDue > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                        {res.balanceDue > 0 ? `Due: $${res.balanceDue}` : 'Settled'}
                      </span>
                    </div>
                  </div>

                  {hasPermission('reservations.check_out') && (
                    <button
                      onClick={() => handleQuickCheckOut(res)}
                      className="px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Room Turnover & Housekeeping Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Room Turnover Health</h2>
            </div>
            {hasPermission('housekeeping.view') && (
              <button
                onClick={() => setActiveView('housekeeping')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Turnover Board →
              </button>
            )}
          </div>

          <div className="p-4 space-y-4 flex-1">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-lg font-bold text-emerald-700">{cleanRooms}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Clean / Insp.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-lg font-bold text-rose-700">{dirtyRooms}</div>
                <div className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Dirty</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-lg font-bold text-amber-700">{maintenanceRooms}</div>
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Out of Order</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>In-House Guests</span>
                <span className="font-bold text-slate-900">{metrics?.inHouseGuests || 3} Parties</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Direct vs OTA Booking Mix</span>
                <span className="font-bold text-slate-900">35% Direct / 65% OTAs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Channel Manager Sync Activity Stream & 7-Day Revenue Trend (if authorized) */}
      {hasPermission('channels.view') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Channel Sync Stream */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">Live OTA Channel Synchronization Activity</h2>
              </div>
              <button
                onClick={() => setActiveView('channel-manager')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Channel Hub →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-start justify-between hover:bg-slate-50 transition">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 p-1 rounded-md ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                        <span className="uppercase font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {log.channelId.replace('_', '.')}
                        </span>
                        <span>{log.payloadSummary}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="capitalize">{log.direction}</span>
                        <span>•</span>
                        <span>{log.action.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{log.recordsAffected} records processed</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Distribution Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Channel Revenue Mix</h2>
            <div className="space-y-3">
              {metrics?.channelBreakdown && metrics.channelBreakdown.map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 capitalize">
                      {item.source.replace('_', '.')}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      ${item.revenue.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, item.percentage * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
