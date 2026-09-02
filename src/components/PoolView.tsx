import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Waves,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Thermometer,
  Droplet,
  Sparkles,
  Ticket,
  LogOut,
  BedDouble,
  DollarSign,
  X,
  AlertCircle,
  FileCheck,
  Sun,
  Umbrella,
  GlassWater
} from 'lucide-react';
import { PoolFacility, PoolTicket, PoolWaterQualityLog, Reservation } from '../types';

interface CabanaBooking {
  id: string;
  cabanaNumber: string;
  name: string;
  type: 'luxury_cabana' | 'daybed';
  guestName: string;
  roomNumber?: string;
  status: 'available' | 'occupied' | 'reserved';
  rentalPrice: number;
  minSpendFnb: number;
  timeSlot: string;
}

export const PoolView: React.FC = () => {
  const { currentProperty, apiFetch, addToast, refreshData, dataVersion, activeSubTab } = useApp();

  const [pool, setPool] = useState<PoolFacility | null>(null);
  const [tickets, setTickets] = useState<PoolTicket[]>([]);
  const [waterLogs, setWaterLogs] = useState<PoolWaterQualityLog[]>([]);
  const [inHouseGuests, setInHouseGuests] = useState<Reservation[]>([]);

  const [activeTab, setActiveTab] = useState<'bathers' | 'cabanas' | 'water_quality'>('bathers');

  useEffect(() => {
    if (activeSubTab === 'bathers' || activeSubTab === 'cabanas' || activeSubTab === 'water_quality') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Cabanas list
  const [cabanas, setCabanas] = useState<CabanaBooking[]>([
    { id: 'cab-1', cabanaNumber: 'C1', name: 'Lagoon VIP Cabana', type: 'luxury_cabana', guestName: 'Elena Rostova', roomNumber: '101', status: 'occupied', rentalPrice: 150, minSpendFnb: 200, timeSlot: 'Full Day (10 AM - 6 PM)' },
    { id: 'cab-2', cabanaNumber: 'C2', name: 'Sunset Palm Cabana', type: 'luxury_cabana', guestName: '', roomNumber: '', status: 'available', rentalPrice: 150, minSpendFnb: 200, timeSlot: 'Full Day (10 AM - 6 PM)' },
    { id: 'cab-3', cabanaNumber: 'C3', name: 'Royal Horizon Suite Cabana', type: 'luxury_cabana', guestName: 'Marcus Aurelius', roomNumber: '202', status: 'occupied', rentalPrice: 220, minSpendFnb: 300, timeSlot: 'Afternoon (1 PM - 7 PM)' },
    { id: 'day-1', cabanaNumber: 'D1', name: 'Infinity Daybed Alpha', type: 'daybed', guestName: 'Sarah Jenkins', roomNumber: '104', status: 'occupied', rentalPrice: 65, minSpendFnb: 80, timeSlot: 'Full Day' },
    { id: 'day-2', cabanaNumber: 'D2', name: 'Infinity Daybed Beta', type: 'daybed', guestName: '', roomNumber: '', status: 'available', rentalPrice: 65, minSpendFnb: 80, timeSlot: 'Full Day' },
    { id: 'day-3', cabanaNumber: 'D3', name: 'Infinity Daybed Gamma', type: 'daybed', guestName: '', roomNumber: '', status: 'available', rentalPrice: 65, minSpendFnb: 80, timeSlot: 'Full Day' },
  ]);

  // New Pass Modal
  const [isNewPassOpen, setIsNewPassOpen] = useState(false);
  const [passType, setPassType] = useState<'hotel_guest' | 'external_visitor'>('hotel_guest');
  const [selectedResvId, setSelectedResvId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [towelsIssued, setTowelsIssued] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'room_folio' | 'cash' | 'card' | 'free_inhouse'>('free_inhouse');

  // Water Test Log Modal
  const [isWaterLogOpen, setIsWaterLogOpen] = useState(false);
  const [phLevel, setPhLevel] = useState(7.4);
  const [chlorinePpm, setChlorinePpm] = useState(2.0);
  const [tempC, setTempC] = useState(28);
  const [clarity, setClarity] = useState<'crystal_clear' | 'slightly_cloudy' | 'cloudy'>('crystal_clear');
  const [chemicalDosage, setChemicalDosage] = useState('');
  const [testerName, setTesterName] = useState('Chief Pool Operator');

  const loadPoolData = async () => {
    try {
      const [pData, tData, wData, resv] = await Promise.all([
        apiFetch('/api/pool/facility').catch(() => null),
        apiFetch('/api/pool/tickets').catch(() => []),
        apiFetch('/api/pool/water-logs').catch(() => []),
        apiFetch('/api/reservations').catch(() => []),
      ]);
      setPool(pData);
      setTickets(tData);
      setWaterLogs(wData);

      const inHouse = (resv || []).filter((r: Reservation) => r.status === 'checked_in' || r.status === 'confirmed');
      setInHouseGuests(inHouse);
      if (inHouse.length > 0 && !selectedResvId) {
        setSelectedResvId(inHouse[0].id);
      }
    } catch (e) {
      console.error('Failed to load pool data', e);
    }
  };

  useEffect(() => {
    loadPoolData();
  }, [currentProperty?.id, dataVersion]);

  const handleIssuePass = async () => {
    try {
      const selectedGuest = inHouseGuests.find(r => r.id === selectedResvId);
      const isExternal = passType === 'external_visitor';
      const holderName = isExternal ? visitorName : selectedGuest?.guest.name || 'In-House Guest';
      const amountPaid = isExternal ? partySize * (pool?.adultVisitorPrice || 35) : 0;

      const payload = {
        type: passType,
        holderName,
        partySize,
        roomId: selectedGuest?.roomId,
        roomNumber: selectedGuest?.roomId?.replace('room-', '').toUpperCase() || selectedGuest?.roomTypeId,
        guestId: selectedGuest?.guestId,
        reservationId: isExternal && paymentMethod !== 'room_folio' ? undefined : selectedResvId,
        amountPaid,
        paymentMethod: isExternal ? (paymentMethod === 'room_folio' ? 'room_folio' : paymentMethod) : 'free_inhouse',
        towelsIssued,
      };

      const res = await apiFetch('/api/pool/check-in', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      addToast('success', res.message || 'Pool access pass issued!');
      setIsNewPassOpen(false);
      loadPoolData();
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to issue pool pass');
    }
  };

  const handleCheckoutTicket = async (ticketId: string, towelsReturned: number) => {
    try {
      await apiFetch(`/api/pool/tickets/${ticketId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ towelsReturned }),
      });
      addToast('info', 'Guest checked out from pool hub. Towels returned.');
      loadPoolData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to checkout pool pass');
    }
  };

  const handleLogWaterQuality = async () => {
    try {
      await apiFetch('/api/pool/water-logs', {
        method: 'POST',
        body: JSON.stringify({
          testedBy: testerName,
          phLevel,
          freeChlorinePpm: chlorinePpm,
          totalChlorinePpm: chlorinePpm + 0.2,
          waterTemperatureC: tempC,
          clarity,
          chemicalDosageAdded: chemicalDosage || undefined,
        }),
      });
      addToast('success', 'Water chemistry log recorded and certified compliant.');
      setIsWaterLogOpen(false);
      loadPoolData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to record water test');
    }
  };

  const handleBookCabana = (cabanaId: string) => {
    setCabanas(prev =>
      prev.map(c =>
        c.id === cabanaId
          ? { ...c, status: c.status === 'occupied' ? 'available' : 'occupied', guestName: c.status === 'occupied' ? '' : 'In-House Guest (Room 102)' }
          : c
      )
    );
    addToast('success', 'Cabana reservation status updated & room folio billed');
  };

  const activeTickets = tickets.filter(t => t.status === 'active');
  const capacityPercent = pool ? Math.round((pool.currentOccupancy / pool.maxCapacity) * 100) : 0;

  return (
    <div className="space-y-6 select-none" id="swimming-pool-view">
      {/* Pool Header & Live Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{pool?.name || 'Infinity Pool & Leisure Deck'}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OPEN
                </span>
              </div>
              <p className="text-slate-400 text-xs">Capacity management, hotel guest passes, luxury cabana rentals & certified water chemistry</p>
            </div>
          </div>

          {/* Occupancy Gauge */}
          <div className="flex items-center gap-6 bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl shrink-0">
            <div>
              <div className="text-xs text-slate-400 font-medium">Bathers Active</div>
              <div className="text-2xl font-black text-cyan-300">
                {pool?.currentOccupancy || 0} <span className="text-sm font-normal text-slate-400">/ {pool?.maxCapacity || 45}</span>
              </div>
            </div>

            <div className="w-24">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                <span>Load</span>
                <span>{capacityPercent}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    capacityPercent > 85 ? 'bg-rose-500' : capacityPercent > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, capacityPercent)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsNewPassOpen(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Issue Pool Pass
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('bathers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bathers' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Active Bathers & Towels ({activeTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('cabanas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cabanas' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Umbrella className="w-4 h-4" /> Cabanas & Daybed Reservations
          </button>
          <button
            onClick={() => setActiveTab('water_quality')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'water_quality' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplet className="w-4 h-4" /> Water Quality Logs ({waterLogs.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Active Bathers & Towels */}
      {activeTab === 'bathers' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Pool Passes & Towel Ledger</h2>
            <span className="text-xs text-slate-500 font-mono">{activeTickets.length} active sessions</span>
          </div>

          {activeTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Waves className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
              No active guests currently checked in to the pool deck.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">Pass #</th>
                    <th className="p-3">Guest / Visitor</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Party Size</th>
                    <th className="p-3">Towels Issued</th>
                    <th className="p-3">Check-In Time</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.holderName}</div>
                        {t.roomNumber && <div className="text-slate-500 text-[11px]">Room {t.roomNumber}</div>}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                            t.type === 'hotel_guest'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{t.partySize} Guests</td>
                      <td className="p-3">
                        <span className="font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                          {t.towelsIssued} Towels
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {new Date(t.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-medium text-slate-700 capitalize">
                        {t.amountPaid > 0 ? `$${t.amountPaid} (${t.paymentMethod})` : 'Complimentary'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCheckoutTicket(t.id, t.towelsIssued)}
                          className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded font-semibold text-[11px] transition cursor-pointer border border-slate-200"
                        >
                          Return Towels & Check Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cabanas & Daybeds */}
      {activeTab === 'cabanas' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Umbrella className="w-5 h-5 text-cyan-600" /> Private Poolside Cabanas & Daybeds
              </h2>
              <p className="text-xs text-slate-500">Manage VIP bookings, day packages, min spend requirements and direct room billing</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabanas.map(c => (
              <div
                key={c.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition ${
                  c.status === 'occupied'
                    ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-300'
                    : 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-black text-base px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                      {c.cabanaNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      c.status === 'occupied' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-1">{c.timeSlot}</div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Rental Fee:</span>
                      <span className="font-bold text-slate-900 font-mono">${c.rentalPrice}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Min F&B Spend:</span>
                      <span className="font-bold text-indigo-700 font-mono">${c.minSpendFnb}</span>
                    </div>
                    {c.guestName && (
                      <div className="pt-2 text-indigo-900 font-semibold bg-indigo-50 p-2 rounded-lg text-[11px]">
                        Reserved by: {c.guestName} {c.roomNumber ? `(Room ${c.roomNumber})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleBookCabana(c.id)}
                  className={`mt-4 w-full py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    c.status === 'occupied'
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                  }`}
                >
                  {c.status === 'occupied' ? 'Release & Settle Folio' : 'Book Cabana for Guest'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Water Quality Logs */}
      {activeTab === 'water_quality' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Certified Water Chemistry & Health Audit Logs</h2>
              <p className="text-xs text-slate-500">OSHA & Health Department mandatory chlorine, pH and clarity testing record</p>
            </div>
            <button
              onClick={() => setIsWaterLogOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Record New Water Test
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">Logged Date/Time</th>
                  <th className="p-3">pH (Ideal 7.2 - 7.6)</th>
                  <th className="p-3">Free Chlorine (PPM)</th>
                  <th className="p-3">Water Temp (°C)</th>
                  <th className="p-3">Clarity</th>
                  <th className="p-3">Chemical Action</th>
                  <th className="p-3">Inspector</th>
                  <th className="p-3">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waterLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-medium text-slate-900">
                      {new Date(l.testedAt).toLocaleDateString()} {new Date(l.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold font-mono">
                      <span className={`px-2 py-0.5 rounded ${l.phLevel >= 7.2 && l.phLevel <= 7.8 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {l.phLevel.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">{l.freeChlorinePpm.toFixed(1)} ppm</td>
                    <td className="p-3 font-mono">{l.waterTemperatureC}°C</td>
                    <td className="p-3 capitalize">{l.clarity.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{l.chemicalDosageAdded || 'None (Balanced)'}</td>
                    <td className="p-3 font-medium text-slate-800">{l.testedBy}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold uppercase text-[10px] flex items-center gap-1 w-max">
                        <FileCheck className="w-3 h-3" /> Certified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Pass Modal */}
      {isNewPassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Issue Swimming Pool Access Pass</h3>
              <button
                onClick={() => setIsNewPassOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Guest Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPassType('hotel_guest')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      passType === 'hotel_guest'
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <BedDouble className="w-4 h-4" /> Hotel Guest (Free)
                  </button>
                  <button
                    onClick={() => setPassType('external_visitor')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      passType === 'external_visitor'
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Ticket className="w-4 h-4" /> Day Pass (${pool?.adultVisitorPrice || 35})
                  </button>
                </div>
              </div>

              {passType === 'hotel_guest' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select In-House Reservation</label>
                  <select
                    value={selectedResvId}
                    onChange={e => setSelectedResvId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-medium"
                  >
                    {inHouseGuests.map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomId?.replace('room-', '').toUpperCase() || r.roomTypeId} — {r.guest.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visitor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amanda Cole"
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={partySize}
                    onChange={e => setPartySize(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Towels Checked Out</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={towelsIssued}
                    onChange={e => setTowelsIssued(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsNewPassOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleIssuePass}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Issue Wristband & Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Water Test Modal */}
      {isWaterLogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Record Water Chemistry Audit</h3>
              <button
                onClick={() => setIsWaterLogOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">pH Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={phLevel}
                    onChange={e => setPhLevel(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Free Chlorine (PPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={chlorinePpm}
                    onChange={e => setChlorinePpm(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Water Temp (°C)</label>
                  <input
                    type="number"
                    value={tempC}
                    onChange={e => setTempC(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clarity</label>
                  <select
                    value={clarity}
                    onChange={e => setClarity(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="crystal_clear">Crystal Clear</option>
                    <option value="slightly_cloudy">Slightly Cloudy</option>
                    <option value="cloudy">Cloudy / Needs Filtration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chemical Dosage Added</label>
                <input
                  type="text"
                  placeholder="e.g. 200g Sodium Bisulfate added to skimmer"
                  value={chemicalDosage}
                  onChange={e => setChemicalDosage(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certified Inspector Name</label>
                <input
                  type="text"
                  value={testerName}
                  onChange={e => setTesterName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsWaterLogOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogWaterQuality}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Certify & Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
