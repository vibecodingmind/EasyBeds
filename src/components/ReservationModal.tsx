import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RoomType, Room, Guest, ReservationSource } from '../types';
import { X, Calendar, User, DollarSign, BedDouble, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReservationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialDate?: string;
  onCreated: () => void;
}> = ({ isOpen, onClose, initialRoomId, initialDate, onCreated }) => {
  const { currentProperty, apiFetch, addToast } = useApp();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('new');
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('United States');
  
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [checkIn, setCheckIn] = useState<string>(initialDate || '2026-09-01');
  const [checkOut, setCheckOut] = useState<string>('2026-09-04');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [source, setSource] = useState<ReservationSource>('direct');
  const [channelReservationId, setChannelReservationId] = useState('');
  const [nightlyRate, setNightlyRate] = useState<number>(250);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      apiFetch('/api/room-types'),
      apiFetch('/api/rooms'),
      apiFetch('/api/guests'),
    ]).then(([rtList, rmList, gstList]) => {
      setRoomTypes(rtList);
      setRooms(rmList);
      setGuests(gstList);

      if (rtList.length > 0 && !roomTypeId) {
        setRoomTypeId(rtList[0].id);
        setNightlyRate(rtList[0].baseRate);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (initialRoomId) {
      const rm = rooms.find(r => r.id === initialRoomId);
      if (rm) {
        setRoomId(rm.id);
        setRoomTypeId(rm.roomTypeId);
        const rt = roomTypes.find(t => t.id === rm.roomTypeId);
        if (rt) setNightlyRate(rt.baseRate);
      }
    }
  }, [initialRoomId, rooms, roomTypes]);

  if (!isOpen) return null;

  const handleRoomTypeChange = (newTypeId: string) => {
    setRoomTypeId(newTypeId);
    const rt = roomTypes.find(t => t.id === newTypeId);
    if (rt) {
      setNightlyRate(rt.baseRate);
    }
    setRoomId('');
  };

  const handleGuestSelect = (gId: string) => {
    setSelectedGuestId(gId);
    if (gId === 'new') {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
    } else {
      const g = guests.find(item => item.id === gId);
      if (g) {
        setFirstName(g.firstName);
        setLastName(g.lastName);
        setEmail(g.email);
        setPhone(g.phone);
        if (g.nationality) setNationality(g.nationality);
      }
    }
  };

  // Math
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const diff = Math.max(1, Math.ceil((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
  const subtotal = nightlyRate * diff;
  const taxes = Number((subtotal * 0.13).toFixed(2));
  const fees = 85.0;
  const total = Number((subtotal + taxes + fees).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !roomTypeId) {
      addToast('error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          guest: { firstName, lastName, email, phone, nationality },
          guestId: selectedGuestId !== 'new' ? selectedGuestId : undefined,
          roomTypeId,
          roomId: roomId || undefined,
          checkIn,
          checkOut,
          adults,
          children,
          source,
          channelReservationId: channelReservationId || undefined,
          nightlyRate,
          paidAmount,
          paymentMethod,
          specialRequests,
        }),
      });

      addToast('success', `Reservation created for ${firstName} ${lastName}!`);
      onCreated();
      onClose();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const availableRoomsForType = rooms.filter(r => r.roomTypeId === roomTypeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BedDouble className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Create New PMS Reservation</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Guest Information Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Guest Details
              </span>

              <select
                value={selectedGuestId}
                onChange={(e) => handleGuestSelect(e.target.value)}
                className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="new">+ New Guest Profile</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.firstName} {g.lastName} ({g.totalStays} prior stays)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Arthur"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pendelton"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stay & Room Configuration */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Stay Dates & Room Selection
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Check-In Date *</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Check-Out Date *</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Room Type *</label>
                <select
                  value={roomTypeId}
                  onChange={(e) => handleRoomTypeChange(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (${rt.baseRate}/nt)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Assign Specific Room (Optional)</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">Auto-Assign at Check-in</option>
                  {availableRoomsForType.map(rm => (
                    <option key={rm.id} value={rm.id}>
                      Room {rm.roomNumber} ({rm.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Adults</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Children</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Nightly Rate ($)</label>
                <input
                  type="number"
                  min="1"
                  value={nightlyRate}
                  onChange={(e) => setNightlyRate(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Booking Channel & Financials */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Channel Source & Payment
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Channel / Origin</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as ReservationSource)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="direct">Direct Website</option>
                  <option value="walk_in">Front Desk Walk-In</option>
                  <option value="phone">Direct Phone Call</option>
                  <option value="booking_com">Booking.com</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="expedia">Expedia</option>
                  <option value="agoda">Agoda</option>
                  <option value="hostelworld">Hostelworld</option>
                  <option value="ical">iCal Inbound Feed</option>
                </select>
              </div>

              {source !== 'direct' && source !== 'walk_in' && source !== 'phone' && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Channel Reservation ID</label>
                  <input
                    type="text"
                    value={channelReservationId}
                    onChange={(e) => setChannelReservationId(e.target.value)}
                    placeholder="e.g. BCOM-991823"
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Financial Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Room Charges ({diff} night{diff > 1 ? 's' : ''} @ ${nightlyRate}/nt):</span>
                <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Taxes (13% State & City):</span>
                <span className="font-mono font-medium">${taxes.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Resort & Cleaning Fees:</span>
                <span className="font-mono font-medium">${fees.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                <span>Total Gross Folio:</span>
                <span className="font-mono text-indigo-700">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Deposit / Paid Now ($)</label>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="credit_card">Credit Card (POS/Stripe)</option>
                  <option value="cash">Cash (Front Desk)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="ota_virtual_card">OTA Virtual Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Special Guest Requests</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., Quiet room, early check-in, champagne on arrival..."
                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? 'Creating...' : 'Confirm & Save Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
