import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Reservation, Room, RoomType } from '../types';
import { 
  ConciergeBell, ArrowDownRight, ArrowUpRight, BedDouble, 
  Key, User, CheckCircle2, AlertCircle, Plus, Search, DollarSign 
} from 'lucide-react';

export const FrontDeskView: React.FC<{
  onOpenNewBooking: () => void;
  onSelectReservation: (res: Reservation) => void;
}> = ({ onOpenNewBooking, onSelectReservation }) => {
  const { currentProperty, apiFetch, dataVersion, addToast, activeSubTab } = useApp();
  
  const [tab, setTab] = useState<'arrivals' | 'departures' | 'inhouse'>('arrivals');

  useEffect(() => {
    if (activeSubTab === 'arrivals' || activeSubTab === 'departures' || activeSubTab === 'inhouse') {
      setTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [search, setSearch] = useState('');
  
  // Quick keycard simulated assign
  const [keycardModalRes, setKeycardModalRes] = useState<Reservation | null>(null);
  const [keycardNumber, setKeycardNumber] = useState('KC-8921');

  const today = '2026-09-01';

  useEffect(() => {
    if (!currentProperty) return;

    Promise.all([
      apiFetch('/api/reservations'),
      apiFetch('/api/rooms'),
      apiFetch('/api/room-types'),
    ]).then(([resList, rmList, rtList]) => {
      setReservations(resList);
      setRooms(rmList);
      setRoomTypes(rtList);
    });
  }, [currentProperty?.id, dataVersion]);

  const handleCheckIn = async (res: Reservation, assignedRoomId?: string) => {
    try {
      await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'checked_in',
          roomId: assignedRoomId || res.roomId || 'rm-101',
        }),
      });
      addToast('success', `Checked in ${res.guest.firstName} ${res.guest.lastName}! Keycard programmed.`);
      setKeycardModalRes(null);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleCheckOut = async (res: Reservation) => {
    if (res.balanceDue > 0) {
      if (!confirm(`Warning: Guest has an outstanding balance of $${res.balanceDue}. Proceed with checkout?`)) {
        return;
      }
    }

    try {
      await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_out' }),
      });
      addToast('success', `Checked out ${res.guest.firstName} ${res.guest.lastName}. Room marked Dirty for Housekeeping.`);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  // Filter listings
  const filtered = reservations.filter(r => {
    const matchSearch = `${r.guest.firstName} ${r.guest.lastName} ${r.reservationCode}`.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (tab === 'arrivals') {
      return r.status === 'confirmed' && (r.checkIn === today || r.checkIn <= today);
    } else if (tab === 'departures') {
      return r.status === 'checked_in' && (r.checkOut === today || r.checkOut <= today);
    } else if (tab === 'inhouse') {
      return r.status === 'checked_in';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Front Desk Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
            <ConciergeBell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold">Front Desk Operations Command</h1>
            <p className="text-xs text-slate-400">
              Live guest reception, rapid walk-ins, digital keycard issuance, and departure folio settlements.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Direct Walk-In Registration
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTab('arrivals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'arrivals' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Due Arrivals (Today)
          </button>
          <button
            onClick={() => setTab('inhouse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'inhouse' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" /> In-House Guests
          </button>
          <button
            onClick={() => setTab('departures')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'departures' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Due Departures
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quick search guest or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
          />
        </div>
      </div>

      {/* Guest Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            No guests found in the {tab} category.
          </div>
        ) : (
          filtered.map(res => {
            const roomType = roomTypes.find(rt => rt.id === res.roomTypeId);
            const room = rooms.find(r => r.id === res.roomId);

            return (
              <div key={res.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{res.guest.firstName} {res.guest.lastName}</span>
                        {res.guest.vip && (
                          <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">VIP</span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-indigo-600 font-semibold mt-0.5">
                        {res.reservationCode}
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      {res.source.replace('_', '.')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Room Category:</span>
                      <span className="font-semibold text-slate-900">{roomType?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Physical Room:</span>
                      <span className="font-bold text-indigo-700">
                        {room ? `Room ${room.roomNumber} (${room.status})` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stay Period:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {res.checkIn} → {res.checkOut}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Folio Balance:</span>
                      <span className={`font-mono font-bold ${res.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {res.balanceDue > 0 ? `$${res.balanceDue.toFixed(2)} Due` : 'Fully Paid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => onSelectReservation(res)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    View Folio →
                  </button>

                  {tab === 'arrivals' && (
                    <button
                      onClick={() => setKeycardModalRes(res)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" /> Check In & Keycard
                    </button>
                  )}

                  {tab === 'departures' && (
                    <button
                      onClick={() => handleCheckOut(res)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Check Out Guest
                    </button>
                  )}

                  {tab === 'inhouse' && (
                    <button
                      onClick={() => onSelectReservation(res)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Manage Stay
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Digital Keycard & Check-in Modal */}
      {keycardModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-indigo-600">
              <Key className="w-6 h-6" />
              <h2 className="text-base font-bold text-slate-900">Check-In & Program Keycard</h2>
            </div>

            <p className="text-xs text-slate-600">
              Guest: <strong>{keycardModalRes.guest.firstName} {keycardModalRes.guest.lastName}</strong> ({keycardModalRes.reservationCode})
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Assign Clean Room</label>
              <select
                id="assignRoomSelect"
                defaultValue={keycardModalRes.roomId || ''}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none"
              >
                {rooms
                  .filter(r => r.roomTypeId === keycardModalRes.roomTypeId)
                  .map(rm => (
                    <option key={rm.id} value={rm.id}>
                      Room {rm.roomNumber} — Status: {rm.status.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Digital Keycard RFID / NFC Encoder Code</label>
              <input
                type="text"
                value={keycardNumber}
                onChange={(e) => setKeycardNumber(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-bold text-indigo-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setKeycardModalRes(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const sel = document.getElementById('assignRoomSelect') as HTMLSelectElement;
                  handleCheckIn(keycardModalRes, sel?.value);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Encode & Complete Check-In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
