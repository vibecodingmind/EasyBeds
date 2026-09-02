import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Reservation, RoomType, Room } from '../types';
import { 
  Search, Filter, Plus, BookOpenCheck, Calendar, Download, 
  ChevronRight, ArrowUpDown, User, CheckCircle2, Clock, AlertTriangle 
} from 'lucide-react';

export const ReservationsView: React.FC<{
  onOpenNewBooking: () => void;
  onSelectReservation: (res: Reservation) => void;
}> = ({ onOpenNewBooking, onSelectReservation }) => {
  const { currentProperty, apiFetch, dataVersion } = useApp();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty) return;
    setLoading(true);

    Promise.all([
      apiFetch(`/api/reservations?status=${statusFilter}&search=${encodeURIComponent(search)}`),
      apiFetch('/api/room-types'),
      apiFetch('/api/rooms'),
    ])
      .then(([resList, rtList, rmList]) => {
        let list = resList;
        if (channelFilter !== 'all') {
          list = list.filter((r: Reservation) => r.source === channelFilter);
        }
        setReservations(list);
        setRoomTypes(rtList);
        setRooms(rmList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentProperty?.id, statusFilter, channelFilter, search, dataVersion]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'booking_com': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'airbnb': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'expedia': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'direct': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'walk_in': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'checked_out': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'no_show': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-indigo-600" />
            Central Reservation Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct, Walk-in, OTA, and iCal synchronized booking records for {currentProperty?.name}
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Reservation
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, guest name, email, OTA reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

        {/* Channel Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Channel:</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="direct">Direct Website</option>
            <option value="walk_in">Walk-In</option>
            <option value="booking_com">Booking.com</option>
            <option value="airbnb">Airbnb</option>
            <option value="expedia">Expedia</option>
            <option value="agoda">Agoda</option>
            <option value="ical">iCal Feed</option>
          </select>
        </div>
      </div>

      {/* Main Reservations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Code / Reference</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Stay Window</th>
                <th className="py-3 px-4">Room / Type</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total / Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const roomType = roomTypes.find(rt => rt.id === res.roomTypeId);
                  const room = rooms.find(r => r.id === res.roomId);

                  return (
                    <tr
                      key={res.id}
                      onClick={() => onSelectReservation(res)}
                      className="hover:bg-indigo-50/40 transition cursor-pointer group"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {res.reservationCode}
                        {res.channelReservationId && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                            {res.channelReservationId}
                          </div>
                        )}
                      </td>

                      {/* Guest */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{res.guest.firstName} {res.guest.lastName}</span>
                          {res.guest.vip && (
                            <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">VIP</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {res.guest.email || res.guest.phone || 'No contact'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">
                          {res.checkIn} → {res.checkOut}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {res.totalNights} Night{res.totalNights > 1 ? 's' : ''} • {res.adults} Ad, {res.children} Ch
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                          {room ? `Room ${room.roomNumber}` : 'Unassigned'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {roomType?.name}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border capitalize ${getSourceBadge(res.source)}`}>
                          {res.source.replace('_', '.')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(res.status)}`}>
                          {res.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          ${res.totalAmount.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          res.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {res.balanceDue > 0 ? `Due: $${res.balanceDue.toFixed(2)}` : 'Fully Paid'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReservation(res);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-semibold text-[11px] transition shadow-2xs"
                        >
                          Folio →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
