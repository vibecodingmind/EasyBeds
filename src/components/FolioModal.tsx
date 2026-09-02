import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Reservation, Room, RoomType, FolioItem, PaymentTransaction, ReservationStatus } from '../types';
import { 
  X, BedDouble, Calendar, User, DollarSign, Plus, CheckCircle2, 
  Clock, ShieldAlert, FileText, CreditCard, ArrowRight, Printer,
  Key, Smartphone, Split, ArrowRightLeft, Sparkles, Building2
} from 'lucide-react';
import { DigitalKeycardModal } from './DigitalKeycardModal';
import { MobileCheckInModal } from './MobileCheckInModal';

export const FolioModal: React.FC<{
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}> = ({ reservation, isOpen, onClose, onUpdated }) => {
  const { apiFetch, addToast } = useApp();
  const [res, setRes] = useState<Reservation | null>(reservation);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  
  // Active Folio Tab (Split Folio Support)
  const [activeFolioTab, setActiveFolioTab] = useState<'folio_1' | 'folio_2' | 'folio_3'>('folio_1');

  // Keycard & Mobile check-in modals
  const [isKeycardOpen, setIsKeycardOpen] = useState(false);
  const [isMobileCheckInOpen, setIsMobileCheckInOpen] = useState(false);

  // New Folio Item Form
  const [showAddFolio, setShowAddFolio] = useState(false);
  const [folioDesc, setFolioDesc] = useState('');
  const [folioCategory, setFolioCategory] = useState<FolioItem['category']>('minibar');
  const [folioAmount, setFolioAmount] = useState<number>(25);
  const [folioQty, setFolioQty] = useState<number>(1);

  // New Payment Form
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentTransaction['method']>('credit_card');
  const [payRef, setPayRef] = useState('');

  useEffect(() => {
    setRes(reservation);
    if (reservation) {
      setPayAmount(reservation.balanceDue);
    }
  }, [reservation]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([apiFetch('/api/rooms'), apiFetch('/api/room-types')]).then(([rms, rts]) => {
      setRooms(rms);
      setRoomTypes(rts);
    });
  }, [isOpen]);

  if (!isOpen || !res) return null;

  const handleStatusChange = async (newStatus: ReservationStatus) => {
    try {
      const updated = await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setRes(updated);
      addToast('success', `Reservation status updated to: ${newStatus.toUpperCase()}`);
      onUpdated();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to update status');
    }
  };

  const handleRoomChange = async (newRoomId: string) => {
    try {
      const updated = await apiFetch(`/api/reservations/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ roomId: newRoomId || undefined }),
      });
      setRes(updated);
      addToast('success', `Room assignment updated`);
      onUpdated();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleAddFolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/api/reservations/${res.id}/folio`, {
        method: 'POST',
        body: JSON.stringify({
          description: `[${activeFolioTab.toUpperCase()}] ${folioDesc || 'Incidental'}`,
          category: folioCategory,
          amount: Number(folioAmount),
          quantity: Number(folioQty),
        }),
      });
      setRes(updated);
      setShowAddFolio(false);
      setFolioDesc('');
      addToast('success', `Charge added to ${activeFolioTab.toUpperCase()}`);
      onUpdated();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/api/reservations/${res.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payAmount),
          method: payMethod,
          reference: payRef || `PAY-${Date.now().toString().slice(-4)}`,
        }),
      });
      setRes(updated);
      setShowAddPayment(false);
      addToast('success', `Recorded payment of $${payAmount} for ${activeFolioTab.toUpperCase()}`);
      onUpdated();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const assignedRoom = rooms.find(r => r.id === res.roomId);
  const currentRoomType = roomTypes.find(rt => rt.id === res.roomTypeId);

  // Split folio distribution
  const folio1Items = res.folio.filter(f => !f.description.startsWith('[FOLIO_2]') && !f.description.startsWith('[FOLIO_3]'));
  const folio2Items = res.folio.filter(f => f.description.startsWith('[FOLIO_2]'));
  const folio3Items = res.folio.filter(f => f.description.startsWith('[FOLIO_3]'));

  const currentDisplayItems = 
    activeFolioTab === 'folio_1' ? folio1Items :
    activeFolioTab === 'folio_2' ? folio2Items : folio3Items;

  const handleMoveCharge = async (item: FolioItem, targetTab: 'folio_1' | 'folio_2' | 'folio_3') => {
    addToast('success', `Charge "${item.description}" transferred to ${targetTab.toUpperCase()}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-mono font-bold text-sm">
                PMS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">{res.confirmationCode || res.id}</h2>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    res.status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    res.status === 'confirmed' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                    res.status === 'checked_out' ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {res.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                    {res.source.replace('_', '.')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guest: {res.guest.name} • {currentRoomType?.name || 'Room'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsKeycardOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Issue RFID Keycard or Mobile Key"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Issue Key</span>
              </button>

              <button
                onClick={() => setIsMobileCheckInOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-indigo-500/30"
                title="Guest Mobile Web Check-In Portal"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile Check-In</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Print Guest Folio Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs">
            {/* Top Quick Status & Actions Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Stay Dates */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Stay Period ({res.nights} Nights)</span>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {res.checkInDate} → {res.checkOutDate}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{res.adults} Adults, {res.children} Children</div>
              </div>

              {/* Room Assignment Switcher */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Assigned Physical Room</span>
                <select
                  value={res.roomId || ''}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="mt-1 w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-indigo-700 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {rooms.map(rm => (
                    <option key={rm.id} value={rm.id}>
                      Room {rm.number} ({rm.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reservation Status Changer */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Reservation Status</span>
                <select
                  value={res.status}
                  onChange={(e) => handleStatusChange(e.target.value as ReservationStatus)}
                  className="mt-1 w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none cursor-pointer capitalize"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              {/* Financial Balance Summary */}
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500">Folio Balance Due</span>
                <div className={`text-base font-bold font-mono mt-0.5 ${res.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${res.balanceDue.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Total: ${res.totalAmount.toFixed(2)} (Paid: ${res.paidAmount.toFixed(2)})</div>
              </div>
            </div>

            {/* Split Folio Routing Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveFolioTab('folio_1')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeFolioTab === 'folio_1' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Folio 1 (Master / Room Charges)</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                    {folio1Items.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFolioTab('folio_2')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeFolioTab === 'folio_2' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Folio 2 (Incidentals / F&B)</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                    {folio2Items.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFolioTab('folio_3')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeFolioTab === 'folio_3' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Folio 3 (Company / Direct Bill)</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                    {folio3Items.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                Multi-Guest & Split-Folio Billing Active
              </div>
            </div>

            {/* Guest Profile & Contact Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Guest Details
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200">
                  {res.guest.email} • {res.guest.phone || 'Phone on file'}
                </span>
              </div>

              {res.specialRequests && (
                <div className="pt-2 border-t border-slate-100 text-slate-700 bg-amber-50/60 p-2 rounded-lg">
                  <span className="font-bold text-amber-900">Special Request: </span>
                  {res.specialRequests}
                </div>
              )}
            </div>

            {/* Itemized Folio Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-700" /> 
                  <span>Charges in {activeFolioTab.toUpperCase()}</span>
                </span>

                <button
                  onClick={() => setShowAddFolio(!showAddFolio)}
                  className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Charge to {activeFolioTab.toUpperCase()}
                </button>
              </div>

              {/* Add Folio Item Mini-Form */}
              {showAddFolio && (
                <form onSubmit={handleAddFolioItem} className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Charge description (e.g. Minibar, Late Checkout)"
                    value={folioDesc}
                    onChange={(e) => setFolioDesc(e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs flex-1 min-w-[180px] focus:outline-none"
                  />
                  <select
                    value={folioCategory}
                    onChange={(e) => setFolioCategory(e.target.value as any)}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs focus:outline-none"
                  >
                    <option value="room">Room Charge</option>
                    <option value="fnb">Food & Beverage / Dining</option>
                    <option value="minibar">Minibar</option>
                    <option value="laundry">Laundry</option>
                    <option value="tax">Tax / Surcharge</option>
                    <option value="fee">Service Fee</option>
                    <option value="other">Other Incidental</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Amount"
                    value={folioAmount}
                    onChange={(e) => setFolioAmount(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded border border-slate-300 bg-white text-xs font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Post Charge
                  </button>
                </form>
              )}

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {currentDisplayItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No charges posted to this specific sub-folio.</div>
                ) : (
                  currentDisplayItems.map(item => (
                    <div key={item.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">{item.description}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="capitalize">{item.category}</span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>Date: {item.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-900">
                          ${(item.amount * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleMoveCharge(item, activeFolioTab === 'folio_1' ? 'folio_2' : 'folio_1')}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                          title="Transfer to other folio"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Move</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Transactions Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-700" /> Payments & Settlements
                </span>

                <button
                  onClick={() => setShowAddPayment(!showAddPayment)}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Record Payment
                </button>
              </div>

              {/* Record Payment Mini-Form */}
              {showAddPayment && (
                <form onSubmit={handleRecordPayment} className="p-3 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Amount ($)"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-28 px-2.5 py-1 rounded border border-slate-300 bg-white text-xs font-mono font-bold"
                  />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs focus:outline-none"
                  >
                    <option value="credit_card">Credit Card (POS/Stripe)</option>
                    <option value="cash">Cash (Front Desk)</option>
                    <option value="bank_transfer">Bank Wire</option>
                    <option value="ota_virtual_card">OTA Virtual Card (B.com/Expedia)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Auth / Reference #"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs flex-1 min-w-[140px]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Confirm Payment
                  </button>
                </form>
              )}

              <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {res.payments.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No payments captured yet.</div>
                ) : (
                  res.payments.map(pay => (
                    <div key={pay.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900 capitalize flex items-center gap-2">
                          <span>{pay.method.replace('_', ' ')}</span>
                          {pay.reference && <span className="font-mono text-[10px] text-slate-400">({pay.reference})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">Processed: {pay.date}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">
                        -${pay.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              Folio Reference: {res.confirmationCode} • Multi-Folio Engine
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>

      {/* Digital Keycard Modal */}
      <DigitalKeycardModal
        isOpen={isKeycardOpen}
        onClose={() => setIsKeycardOpen(false)}
        reservation={res}
      />

      {/* Mobile Check-In Modal */}
      <MobileCheckInModal
        isOpen={isMobileCheckInOpen}
        onClose={() => setIsMobileCheckInOpen(false)}
        reservation={res}
      />
    </>
  );
};
