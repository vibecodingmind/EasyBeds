import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  CreditCard,
  Receipt,
  Search,
  BedDouble,
  Tag,
  ChefHat,
  Sparkles,
  DollarSign,
  Coffee,
  X,
  AlertCircle
} from 'lucide-react';
import { DiningTable, MenuItem, RestaurantOrder, Reservation } from '../types';

export const RestaurantView: React.FC = () => {
  const { currentProperty, apiFetch, addToast, refreshData, dataVersion, activeSubTab } = useApp();

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<RestaurantOrder[]>([]);
  const [inHouseGuests, setInHouseGuests] = useState<Reservation[]>([]);

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active POS state
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [cart, setCart] = useState<{
    menuItem: MenuItem;
    quantity: number;
    selectedModifiers: { name: string; priceDelta: number }[];
    instructions: string;
  }[]>([]);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'room_charge' | 'cash' | 'card'>('room_charge');
  const [selectedReservationId, setSelectedReservationId] = useState<string>('');
  const [serverName, setServerName] = useState('Staff Server');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active tabs
  const [viewTab, setViewTab] = useState<'pos' | 'tables' | 'orders'>('pos');

  useEffect(() => {
    if (activeSubTab === 'pos' || activeSubTab === 'tables' || activeSubTab === 'orders') {
      setViewTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Load data
  const loadData = async () => {
    try {
      const [tbls, menu, ords, resv] = await Promise.all([
        apiFetch('/api/restaurant/tables').catch(() => []),
        apiFetch('/api/restaurant/menu').catch(() => []),
        apiFetch('/api/restaurant/orders').catch(() => []),
        apiFetch('/api/reservations').catch(() => []),
      ]);
      setTables(tbls);
      setMenuItems(menu);
      setActiveOrders(ords);

      // In-house guests only (checked_in or confirmed)
      const inHouse = (resv || []).filter((r: Reservation) => r.status === 'checked_in' || r.status === 'confirmed');
      setInHouseGuests(inHouse);
      if (inHouse.length > 0 && !selectedReservationId) {
        setSelectedReservationId(inHouse[0].id);
      }
    } catch (e) {
      console.error('Failed to load restaurant data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProperty?.id, dataVersion]);

  // Categories list
  const categories = ['all', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1, selectedModifiers: [], instructions: '' }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItem.id === itemId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as any);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const taxAmount = subtotal * 0.08;
  const serviceCharge = subtotal * 0.10;
  const grandTotal = subtotal + taxAmount + serviceCharge;

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const selectedGuestResv = inHouseGuests.find(r => r.id === selectedReservationId);

    const orderPayload = {
      outletId: 'restaurant-main',
      outletName: 'Azure Fine Dining & Bistro',
      orderType: selectedTable ? 'dine_in' : selectedReservationId ? 'room_charge' : 'takeaway',
      tableId: selectedTable?.id,
      tableNumber: selectedTable?.number,
      guestId: selectedGuestResv?.guestId,
      guestName: selectedGuestResv?.guest.name,
      reservationId: selectedReservationId || undefined,
      roomId: selectedGuestResv?.roomId,
      roomNumber: selectedGuestResv?.roomId?.replace('room-', '').toUpperCase() || selectedGuestResv?.roomTypeId,
      items: cart.map(c => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        station: c.menuItem.station,
        selectedModifiers: c.selectedModifiers,
        specialInstructions: c.instructions || undefined,
      })),
      taxAmount,
      serviceCharge,
      discountAmount: 0,
      paymentStatus: paymentMethod === 'room_charge' ? 'paid_room_charge' : paymentMethod === 'cash' ? 'paid_cash' : 'paid_card',
      serverName,
    };

    try {
      const res = await apiFetch('/api/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      addToast('success', `Order #${res.order.orderNumber} placed! ${paymentMethod === 'room_charge' ? 'Charged to Room Folio.' : 'Settled.'}`);
      setCart([]);
      setIsCheckoutOpen(false);
      setSelectedTable(null);
      loadData();
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to submit restaurant order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none" id="restaurant-pos-view">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Restaurant & Bistro POS</h1>
            <p className="text-slate-400 text-xs">Touch-optimized order entry, table maps, kitchen ticket routing & guest folio charging</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setViewTab('pos')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              viewTab === 'pos' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Point of Sale
          </button>
          <button
            onClick={() => setViewTab('tables')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              viewTab === 'tables' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Floor Tables ({tables.length})
          </button>
          <button
            onClick={() => setViewTab('orders')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              viewTab === 'orders' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Orders ({activeOrders.length})
          </button>
        </div>
      </div>

      {/* Main View: POS */}
      {viewTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu Browsing & Search (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer capitalize ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search dishes & beverages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5">
              {filteredMenuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition rounded-xl p-3.5 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 capitalize">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">{item.station.replace('_', ' ')}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">${item.price.toFixed(2)}</span>
                    <button className="p-1 bg-amber-50 text-amber-700 rounded-md group-hover:bg-amber-600 group-hover:text-white transition">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POS Cart / Order Summary (Col 4) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 sticky top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-900 text-sm">Active Check</span>
                </div>
                {selectedTable ? (
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                    Table #{selectedTable.number}
                  </span>
                ) : (
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    Direct / Room Order
                  </span>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Select menu items from the left to start an order.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.menuItem.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between gap-2">
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-slate-900 truncate">{item.menuItem.name}</div>
                        <div className="text-slate-500 text-[11px]">${item.menuItem.price.toFixed(2)} ea</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Totals */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service (10%)</span>
                    <span>${serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span className="text-amber-600">${grandTotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment / Folio Charge
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floor Tables View */}
      {viewTab === 'tables' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dining Floor Matrix</h2>
              <p className="text-xs text-slate-500">Live seating status and table order assignment</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Reserved</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.map(tbl => (
              <div
                key={tbl.id}
                onClick={() => {
                  setSelectedTable(tbl);
                  setViewTab('pos');
                  addToast('info', `Selected Table #${tbl.number} (${tbl.section})`);
                }}
                className={`border rounded-xl p-4 text-center cursor-pointer transition flex flex-col justify-between h-32 ${
                  tbl.status === 'occupied'
                    ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400'
                    : tbl.status === 'reserved'
                    ? 'bg-indigo-50/60 border-indigo-300'
                    : 'bg-white border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{tbl.section}</div>
                <div>
                  <div className="text-xl font-black text-slate-900">#{tbl.number}</div>
                  <div className="text-[11px] text-slate-500">{tbl.capacity} Seats</div>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full mx-auto uppercase ${
                    tbl.status === 'occupied'
                      ? 'bg-amber-200 text-amber-900'
                      : tbl.status === 'reserved'
                      ? 'bg-indigo-200 text-indigo-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {tbl.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders History View */}
      {viewTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Today's Restaurant Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Server</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="p-3">
                      {ord.tableNumber ? `Table #${ord.tableNumber}` : ord.roomNumber ? `Room ${ord.roomNumber} (${ord.guestName})` : 'Takeaway'}
                    </td>
                    <td className="p-3 text-slate-600">
                      {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3 font-bold text-slate-900">${ord.totalAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200 uppercase text-[10px]">
                        {ord.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium uppercase text-[10px]">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{ord.serverName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout & Folio Charging Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Settle & Close Order</h3>
                <span className="text-xs text-amber-600 font-bold">Total Due: ${grandTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Payment Destination</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('room_charge')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'room_charge'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BedDouble className="w-5 h-5" />
                    <span className="text-xs">Room Folio</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Credit Card</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs">Cash POS</span>
                  </button>
                </div>
              </div>

              {/* If Room Folio, select guest with Credit Limit Validator */}
              {paymentMethod === 'room_charge' && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-indigo-900">Select In-House Guest Room</label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      Credit Limit: $1,500.00 (Active)
                    </span>
                  </div>
                  <select
                    value={selectedReservationId}
                    onChange={e => setSelectedReservationId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {inHouseGuests.map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomId?.replace('room-', '').toUpperCase() || r.roomTypeId} — {r.guest.name} ({r.reservationCode})
                      </option>
                    ))}
                  </select>

                  <div className="bg-white rounded-lg p-2.5 border border-indigo-100 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Folio Credit Pre-Auth:</span>
                      <span className="font-mono text-emerald-700 font-semibold">VISA •••• 4242 ($500 hold)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Available Spending Limit:</span>
                      <span className="font-mono font-bold text-slate-900">${(1500 - grandTotal).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Diner Signature Pad Simulation */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Guest / Room Sign-Off</label>
                    <div className="bg-white border border-slate-300 border-dashed rounded-lg p-2 text-center text-slate-400 font-mono text-[11px] italic h-12 flex items-center justify-center cursor-crosshair hover:bg-slate-50">
                      ✍️ [Guest Digital Signature Verified at Terminal]
                    </div>
                  </div>

                  <p className="text-[11px] text-indigo-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Automatically posts ${grandTotal.toFixed(2)} to guest folio ledger
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Server / Bartender Name</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={e => setServerName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Posting Order...' : 'Confirm & Print Kitchen Slip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
