import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Boxes,
  Truck,
  Plus,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingDown,
  Building2,
  FileText,
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  InventoryProduct,
  InventoryLocation,
  StockMovement,
  Supplier,
  PurchaseOrder
} from '../types';

export const InventoryView: React.FC = () => {
  const { currentProperty, apiFetch, addToast, refreshData, dataVersion, activeSubTab } = useApp();

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'purchase_orders' | 'suppliers'>('stock');

  useEffect(() => {
    if (activeSubTab === 'stock' || activeSubTab === 'movements' || activeSubTab === 'purchase_orders' || activeSubTab === 'suppliers') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'PURCHASE' | 'WASTE' | 'ADJUSTMENT' | 'TRANSFER'>('ADJUSTMENT');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [transferTargetLoc, setTransferTargetLoc] = useState('');

  // Create PO Modal
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poLocationId, setPoLocationId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number }[]>([]);

  const loadData = async () => {
    try {
      const [prods, locs, movs, sups, pos] = await Promise.all([
        apiFetch('/api/inventory/products').catch(() => []),
        apiFetch('/api/inventory/locations').catch(() => []),
        apiFetch('/api/inventory/movements').catch(() => []),
        apiFetch('/api/inventory/suppliers').catch(() => []),
        apiFetch('/api/inventory/purchase-orders').catch(() => []),
      ]);
      setProducts(prods);
      setLocations(locs);
      setMovements(movs);
      setSuppliers(sups);
      setPurchaseOrders(pos);

      if (locs.length > 0 && !poLocationId) setPoLocationId(locs[0].id);
      if (sups.length > 0 && !poSupplierId) setPoSupplierId(sups[0].id);
    } catch (e) {
      console.error('Failed to load inventory data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProperty?.id, dataVersion]);

  const filteredProducts = products.filter(p => {
    const matchesLoc = selectedLocation === 'all' || p.locationId === selectedLocation;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLoc && matchesSearch;
  });

  const lowStockCount = products.filter(p => p.currentStock <= p.minStockLevel).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPerUnit), 0);

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    try {
      const change = (adjustType === 'WASTE' || adjustType === 'TRANSFER') ? -Math.abs(adjustQty) : adjustQty;
      await apiFetch('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustType,
          quantityChange: change,
          notes: adjustReason,
          toLocationId: adjustType === 'TRANSFER' ? transferTargetLoc : undefined,
        }),
      });

      addToast('success', `Stock adjusted for ${selectedProduct.name}`);
      setIsAdjustOpen(false);
      loadData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to adjust stock');
    }
  };

  const handleReceivePO = async (poId: string) => {
    try {
      const res = await apiFetch(`/api/inventory/purchase-orders/${poId}/receive`, {
        method: 'POST',
      });
      addToast('success', res.message || 'Purchase order received and stock added!');
      loadData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to receive purchase order');
    }
  };

  return (
    <div className="space-y-6 select-none" id="inventory-management-view">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Multi-Location Inventory & Purchasing</h1>
              <p className="text-slate-400 text-xs">Stock ledger across warehouses, kitchens, bars, automatic POS depletions & supplier POs</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700 p-3 rounded-xl shrink-0">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Asset Value</div>
              <div className="text-xl font-bold text-white">${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Low Stock Alerts</div>
              <div className={`text-xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lowStockCount} items
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stock' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Stock Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'movements' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Stock Movements ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('purchase_orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'purchase_orders' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Stock Catalog */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedLocation('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedLocation === 'all' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Locations
              </button>
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedLocation === loc.id ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU, product or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full md:w-60 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Min / Target</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(prod => {
                    const isLow = prod.currentStock <= prod.minStockLevel;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{prod.sku}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{prod.name}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md font-medium text-[10px] uppercase bg-slate-100 text-slate-700">
                            {prod.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{prod.locationName}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {prod.currentStock} {prod.unit}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 uppercase">
                                LOW
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          {prod.minStockLevel} / {prod.targetStockLevel} {prod.unit}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">${prod.costPerUnit.toFixed(2)}</td>
                        <td className="p-3 text-slate-600">{prod.supplierName}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setIsAdjustOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Adjust / Transfer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements Audit */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Stock Movements & Depletions Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Qty Change</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Reference / Notes</th>
                  <th className="p-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => {
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            m.type === 'PURCHASE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.type === 'CONSUMPTION' || m.type === 'SALE'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : m.type === 'WASTE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{m.productName}</td>
                      <td className="p-3">
                        <span className={`font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange} {m.unit}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">${m.costValue.toFixed(2)}</td>
                      <td className="p-3 text-slate-600">{m.reference || m.notes || '—'}</td>
                      <td className="p-3 text-slate-500">{m.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Procurement & Purchase Orders</h2>
            <button
              onClick={() => setIsNewPoOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Purchase Order
            </button>
          </div>

          <div className="space-y-3">
            {purchaseOrders.map(po => (
              <div key={po.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{po.poNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'submitted'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Supplier: <strong className="text-slate-700">{po.supplierName}</strong> ➔ Destination: <strong className="text-slate-700">{po.destinationLocationName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Order Total</div>
                      <div className="text-base font-black text-slate-900">${po.totalAmount.toFixed(2)}</div>
                    </div>

                    {po.status === 'submitted' && (
                      <button
                        onClick={() => handleReceivePO(po.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Receive Goods & Restock
                      </button>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-2 text-xs text-slate-600 flex flex-wrap gap-4">
                  {po.items.map(item => (
                    <div key={item.productId} className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <strong>{item.orderedQty} {item.unit}</strong> {item.productName} (${item.totalPrice.toFixed(2)})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                  <div className="text-xs text-slate-500 font-medium">{sup.contactPerson}</div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Lead Time: {sup.leadTimeDays}d
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Email: <span className="font-medium text-slate-800">{sup.email}</span></div>
                <div>Phone: <span className="font-medium text-slate-800">{sup.phone}</span></div>
                <div>Terms: <span className="font-medium text-slate-800">{sup.paymentTerms}</span></div>
              </div>

              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                {sup.categories.map(c => (
                  <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Stock: {selectedProduct.name}</h3>
                <span className="text-xs text-slate-500">Current: {selectedProduct.currentStock} {selectedProduct.unit}</span>
              </div>
              <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Action</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="PURCHASE">Add Received Stock (Purchase / Restock)</option>
                  <option value="ADJUSTMENT">Manual Cycle Count Adjustment (+/-)</option>
                  <option value="WASTE">Log Spillage / Spoilage / Waste (-)</option>
                  <option value="TRANSFER">Transfer to Another Location</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity ({selectedProduct.unit})</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              {adjustType === 'TRANSFER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Destination Location</label>
                  <select
                    value={transferTargetLoc}
                    onChange={e => setTransferTargetLoc(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {locations.filter(l => l.id !== selectedProduct.locationId).map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Broken bottle during setup"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsAdjustOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Confirm Stock Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
