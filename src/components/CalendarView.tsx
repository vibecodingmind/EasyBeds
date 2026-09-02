import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Room, RoomType, Reservation } from '../types';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Filter, Plus, User, BedDouble, AlertCircle, Sparkles, CheckCircle2
} from 'lucide-react';
import { addDays, format, parseISO, isSameDay, differenceInDays } from 'date-fns';

export const CalendarView: React.FC<{ 
  onSelectReservation: (res: Reservation) => void;
  onOpenNewBookingWithParams?: (roomId: string, date: string) => void;
}> = ({ onSelectReservation, onOpenNewBookingWithParams }) => {
  const { currentProperty, apiFetch, dataVersion, addToast, refreshData } = useApp();
  
  const [baseDate, setBaseDate] = useState<Date>(new Date('2026-08-30'));
  const [daysCount, setDaysCount] = useState<number>(14);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [draggedResId, setDraggedResId] = useState<string | null>(null);

  const startDateStr = format(baseDate, 'yyyy-MM-dd');
  const endDateStr = format(addDays(baseDate, daysCount - 1), 'yyyy-MM-dd');

  useEffect(() => {
    if (!currentProperty) return;
    setLoading(true);

    Promise.all([
      apiFetch('/api/rooms'),
      apiFetch('/api/room-types'),
      apiFetch(`/api/calendar/tape-chart?startDate=${startDateStr}&endDate=${endDateStr}`),
    ])
      .then(([roomList, typeList, calendarData]) => {
        setRooms(roomList);
        setRoomTypes(typeList);
        setReservations(calendarData.reservations || []);
      })
      .catch((err) => console.error('Calendar error', err))
      .finally(() => setLoading(false));
  }, [currentProperty?.id, baseDate, daysCount, dataVersion]);

  const handleDragStart = (e: React.DragEvent, resId: string) => {
    e.dataTransfer.setData('text/plain', resId);
    setDraggedResId(resId);
  };

  const handleRoomDrop = async (e: React.DragEvent, targetRoomId: string) => {
    e.preventDefault();
    const resId = e.dataTransfer.getData('text/plain') || draggedResId;
    if (!resId) return;

    const res = reservations.find(r => r.id === resId);
    const targetRoom = rooms.find(r => r.id === targetRoomId);
    if (!res || !targetRoom) return;

    if (res.roomId === targetRoomId) {
      setDraggedResId(null);
      return;
    }

    // Check collision in target room
    const targetRoomOccupied = reservations.some(
      r => r.id !== resId && r.roomId === targetRoomId &&
      ((r.checkIn <= res.checkIn && r.checkOut > res.checkIn) ||
       (r.checkIn < res.checkOut && r.checkOut >= res.checkOut) ||
       (r.checkIn >= res.checkIn && r.checkOut <= res.checkOut))
    );

    if (targetRoomOccupied) {
      addToast('error', `Room ${targetRoom.roomNumber} has a conflicting booking during those dates.`);
      setDraggedResId(null);
      return;
    }

    // Update locally and inform user
    setReservations(prev => prev.map(r => r.id === resId ? { ...r, roomId: targetRoomId } : r));
    setDraggedResId(null);
    addToast('success', `Reallocated ${res.guest.firstName} ${res.guest.lastName} to Room ${targetRoom.roomNumber} via Tape Chart`);
  };

  // Generate date array
  const dateColumns = Array.from({ length: daysCount }).map((_, i) => addDays(baseDate, i));

  const filteredRooms = selectedRoomType === 'all' 
    ? rooms 
    : rooms.filter(r => r.roomTypeId === selectedRoomType);

  const handlePrev = () => setBaseDate(d => addDays(d, -7));
  const handleNext = () => setBaseDate(d => addDays(d, 7));
  const handleToday = () => setBaseDate(new Date('2026-08-30'));

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'booking_com': return 'bg-blue-600 text-white border-blue-700';
      case 'airbnb': return 'bg-rose-600 text-white border-rose-700';
      case 'expedia': return 'bg-amber-600 text-white border-amber-700';
      case 'direct': return 'bg-emerald-600 text-white border-emerald-700';
      case 'walk_in': return 'bg-indigo-600 text-white border-indigo-700';
      case 'phone': return 'bg-purple-600 text-white border-purple-700';
      default: return 'bg-slate-700 text-white border-slate-800';
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-emerald-500';
      case 'inspected': return 'bg-teal-500';
      case 'dirty': return 'bg-rose-500';
      case 'maintenance':
      case 'out_of_order': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-7rem)]">
      {/* Calendar Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-md text-slate-700 transition cursor-pointer"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-white rounded-md transition cursor-pointer"
            >
              Current Week
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-md text-slate-700 transition cursor-pointer"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 px-2">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {format(baseDate, 'MMM d, yyyy')} — {format(addDays(baseDate, daysCount - 1), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Filters & View Density */}
        <div className="flex items-center space-x-3">
          {/* Room Type Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Room Types ({rooms.length} rooms)</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Days count toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setDaysCount(7)}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${daysCount === 7 ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysCount(14)}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${daysCount === 14 ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600'}`}
            >
              14 Days
            </button>
            <button
              onClick={() => setDaysCount(21)}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${daysCount === 21 ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600'}`}
            >
              21 Days
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 gap-2 shrink-0">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-700">Channels:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600" /> Booking.com</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-600" /> Airbnb</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-600" /> Expedia</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Direct / Website</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-600" /> Walk-In</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-700">Room Status:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Clean</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Dirty</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance / OOO</span>
        </div>
      </div>

      {/* Tape Chart Grid View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 overflow-auto relative">
        <div className="min-w-[900px]">
          {/* Header Row: Dates */}
          <div className="sticky top-0 z-20 bg-slate-900 text-white flex border-b border-slate-800">
            {/* Top Left Sticky Corner: Room Header */}
            <div className="w-48 sticky left-0 z-30 bg-slate-900 px-3 py-2.5 border-r border-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Room / Type</span>
              <BedDouble className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Date Columns */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}>
              {dateColumns.map((day) => {
                const isToday = isSameDay(day, new Date('2026-09-01'));
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={day.toISOString()}
                    className={`py-2 text-center border-r border-slate-800/60 ${
                      isToday ? 'bg-indigo-950/80 font-bold ring-1 ring-indigo-400' : isWeekend ? 'bg-slate-800/40' : ''
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium">{format(day, 'EEE')}</div>
                    <div className={`text-xs font-mono mt-0.5 ${isToday ? 'text-indigo-300 font-bold' : 'text-slate-200'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rooms Rows */}
          <div className="divide-y divide-slate-100">
            {filteredRooms.map((room) => {
              const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
              
              return (
                <div key={room.id} className="flex hover:bg-slate-50/70 transition group relative min-h-[52px]">
                  {/* Sticky Left Column: Room Number & Type */}
                  <div className="w-48 sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getRoomStatusColor(room.status)}`} title={`Status: ${room.status}`} />
                        <span className="font-bold text-xs text-slate-900">Room {room.roomNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={roomType?.name}>
                        {roomType?.name || 'Standard'}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono text-slate-400 font-medium">
                      ${roomType?.baseRate}
                    </span>
                  </div>

                  {/* Date Grid Cells for this room */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleRoomDrop(e, room.id)}
                    className="flex-1 grid relative" 
                    style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}
                  >
                    {dateColumns.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const isToday = isSameDay(day, new Date('2026-09-01'));

                      return (
                        <div
                          key={dayStr}
                          onClick={() => onOpenNewBookingWithParams && onOpenNewBookingWithParams(room.id, dayStr)}
                          title={`Click to book Room ${room.roomNumber} starting ${dayStr}`}
                          className={`border-r border-slate-100 h-full min-h-[52px] hover:bg-indigo-50/40 cursor-pointer transition relative ${
                            isToday ? 'bg-indigo-50/20' : ''
                          }`}
                        />
                      );
                    })}

                    {/* Render Reservations allocated to this room */}
                    {reservations
                      .filter((res) => res.roomId === room.id || (!res.roomId && res.roomTypeId === room.roomTypeId))
                      .map((res) => {
                        const checkInDate = parseISO(res.checkIn);
                        const checkOutDate = parseISO(res.checkOut);
                        
                        // Calculate offset from baseDate
                        const startOffsetDays = differenceInDays(checkInDate, baseDate);
                        const durationNights = differenceInDays(checkOutDate, checkInDate);

                        // If reservation is completely outside our visible window, skip
                        if (startOffsetDays + durationNights <= 0 || startOffsetDays >= daysCount) {
                          return null;
                        }

                        // Calculate clamp
                        const visibleStart = Math.max(0, startOffsetDays);
                        const visibleEnd = Math.min(daysCount, startOffsetDays + durationNights);
                        const visibleSpan = Math.max(1, visibleEnd - visibleStart);

                        // Position calculation
                        const leftPercent = (visibleStart / daysCount) * 100;
                        const widthPercent = (visibleSpan / daysCount) * 100;

                        return (
                          <div
                            key={res.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, res.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectReservation(res);
                            }}
                            style={{
                              left: `${leftPercent}%`,
                              width: `calc(${widthPercent}% - 4px)`,
                              top: '6px',
                              bottom: '6px',
                            }}
                            title={`Drag reservation tile to reassign room`}
                            className={`absolute z-10 rounded-md px-2 py-1 shadow-xs border cursor-grab active:cursor-grabbing flex items-center justify-between text-xs font-semibold overflow-hidden transition hover:scale-[1.01] hover:shadow-md ${getSourceBadgeColor(
                              res.source
                            )}`}
                          >
                            <div className="truncate flex items-center gap-1.5 leading-tight">
                              <span className="truncate">{res.guest.firstName} {res.guest.lastName}</span>
                              <span className="text-[10px] opacity-80 font-mono hidden sm:inline">({res.reservationCode})</span>
                            </div>

                            <span className="text-[10px] font-mono opacity-90 shrink-0 ml-1">
                              ${res.totalAmount}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
