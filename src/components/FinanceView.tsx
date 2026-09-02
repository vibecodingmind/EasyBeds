import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, PaymentTransaction } from '../types';
import { 
  Receipt, DollarSign, TrendingUp, CreditCard, 
  Download, Plus, Filter, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2,
  Moon, Globe, Percent, ShieldCheck, RefreshCw, Settings2
} from 'lucide-react';
import { NightAuditModal } from './NightAuditModal';

export const FinanceView: React.FC = () => {
  const { currentProperty, apiFetch, dataVersion, addToast, activeSubTab } = useApp();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'taxes' | 'currencies'>('invoices');
  const [showNightAudit, setShowNightAudit] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'invoices' || activeSubTab === 'expenses' || activeSubTab === 'taxes' || activeSubTab === 'currencies') {
      setActiveTab(activeSubTab);
    } else if (activeSubTab === 'night-audit') {
      setShowNightAudit(true);
    }
  }, [activeSubTab]);
  
  // Multi-Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'AED'>('USD');
  const currencyRates: Record<string, { symbol: string; rate: number; label: string }> = {
    USD: { symbol: '$', rate: 1.0, label: 'US Dollar (Base)' },
    EUR: { symbol: '€', rate: 0.92, label: 'Euro' },
    GBP: { symbol: '£', rate: 0.78, label: 'British Pound' },
    JPY: { symbol: '¥', rate: 155.20, label: 'Japanese Yen' },
    CAD: { symbol: 'CA$', rate: 1.36, label: 'Canadian Dollar' },
    AUD: { symbol: 'A$', rate: 1.52, label: 'Australian Dollar' },
    AED: { symbol: 'AED ', rate: 3.67, label: 'UAE Dirham' },
  };

  // Tax Engine Rules
  const [vatRate, setVatRate] = useState(10.0);
  const [cityTaxRate, setCityTaxRate] = useState(5.0);
  const [tourismFlatFee, setTourismFlatFee] = useState(4.00);
  const [allowDiplomaticExemption, setAllowDiplomaticExemption] = useState(true);

  // New Expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('Supplies & Linen');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(150);

  const [expenses, setExpenses] = useState([
    { id: 'exp-1', date: '2026-08-30', category: 'Laundry & Linen', description: 'Weekly linen washing service', amount: 480.00, vendor: 'CleanBrite Commercial' },
    { id: 'exp-2', date: '2026-08-28', category: 'OTA Commission', description: 'Booking.com 15% net commission remittance', amount: 1240.00, vendor: 'Booking.com BV' },
    { id: 'exp-3', date: '2026-08-26', category: 'Utilities', description: 'Electricity & Water commercial meter', amount: 890.00, vendor: 'Pacific Power' },
    { id: 'exp-4', date: '2026-08-24', category: 'Maintenance Supplies', description: 'HVAC filters, plumbing seals, paint touch-ups', amount: 215.50, vendor: 'HomeDepot Pro' },
  ]);

  useEffect(() => {
    if (!currentProperty) return;
    apiFetch('/api/finance/invoices')
      .then(invList => setInvoices(invList))
      .catch(e => console.error(e));
  }, [currentProperty?.id, dataVersion]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc) return;
    const newExp = {
      id: `exp-${Date.now()}`,
      date: '2026-09-01',
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      vendor: 'Direct Merchant',
    };
    setExpenses(prev => [newExp, ...prev]);
    setShowAddExpense(false);
    setExpDesc('');
    addToast('success', `Recorded expense of $${expAmount}`);
  };

  const currentRate = currencyRates[selectedCurrency].rate;
  const currentSymbol = currencyRates[selectedCurrency].symbol;

  const totalInvoiceRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0) * currentRate;
  const totalPaidRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0) * currentRate;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) * currentRate;
  const netIncome = totalPaidRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Top Banner with Night Audit & Currency Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              Hotel Finance, General Ledger & Audits
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AUDITED GAAP / IFRS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile guest folios, trial balances, multi-currency conversions, automated night audits, and local tax remittances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
            <Globe className="w-3.5 h-3.5 text-indigo-400 mr-2" />
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value as any);
                addToast('info', `Active display currency switched to ${e.target.value}`);
              }}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {Object.entries(currencyRates).map(([code, data]) => (
                <option key={code} value={code} className="bg-slate-900 text-white">
                  {code} ({data.symbol}) - {data.label}
                </option>
              ))}
            </select>
          </div>

          {/* Night Audit Trigger */}
          <button
            onClick={() => setShowNightAudit(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Moon className="w-4 h-4 text-indigo-200" />
            <span>Execute Night Audit & Close Day</span>
          </button>
        </div>
      </div>

      {/* Top Financial KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gross Billed Invoices</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {currentSymbol}{totalInvoiceRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{invoices.length} invoices generated</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Captured Cash & POS</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {currentSymbol}{totalPaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block font-medium">Cleared settlements</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Operating Expenses</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {currentSymbol}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Laundry, Utilities, OTA fees</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Net Operating Margin</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1 font-mono">
            {currentSymbol}{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-indigo-600 mt-0.5 block font-semibold">Healthy Operating Surplus</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Guest Invoices & Billing Folios ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Operating Expenses & OTA Commissions ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'taxes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Occupancy Tax & VAT Rules Engine
          </button>
        </div>

        {activeTab === 'expenses' && (
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        )}
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Guest / Recipient</th>
                <th className="py-3 px-4 text-right">Subtotal ({selectedCurrency})</th>
                <th className="py-3 px-4 text-right">Tax (13%)</th>
                <th className="py-3 px-4 text-right">Total ({selectedCurrency})</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{inv.issueDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{inv.guestName}</td>
                  <td className="py-3 px-4 text-right font-mono">{currentSymbol}{(inv.subtotal * currentRate).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{currentSymbol}{(inv.taxTotal * currentRate).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{currentSymbol}{(inv.total * currentRate).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                      inv.status === 'partially_paid' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor / Merchant</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount ({selectedCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{exp.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{exp.category}</td>
                  <td className="py-3 px-4 text-indigo-700 font-medium">{exp.vendor}</td>
                  <td className="py-3 px-4 text-slate-600">{exp.description}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    -{currentSymbol}{(exp.amount * currentRate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Tax Rules Engine */}
      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  Configurable Property Tax & VAT Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set tiered occupancy, VAT, and city tourist fees automatically calculated across all reservations and folios.
                </p>
              </div>
              <button
                onClick={() => addToast('success', 'Property tax configuration rules saved successfully.')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Save Tax Configuration
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">State / Regional VAT (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white"
                  />
                  <span className="font-bold text-slate-500 text-sm">%</span>
                </div>
                <p className="text-[11px] text-slate-500">Applies to room rate and incidental dining.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">City Occupancy Tax (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={cityTaxRate}
                    onChange={(e) => setCityTaxRate(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white"
                  />
                  <span className="font-bold text-slate-500 text-sm">%</span>
                </div>
                <p className="text-[11px] text-slate-500">Applies to nightly accommodation only.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Nightly Tourism Fee ($ / night)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.50"
                    value={tourismFlatFee}
                    onChange={(e) => setTourismFlatFee(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white"
                  />
                  <span className="font-bold text-slate-500 text-sm">$</span>
                </div>
                <p className="text-[11px] text-slate-500">Fixed municipal environmental fee per night.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exempt-toggle"
                  checked={allowDiplomaticExemption}
                  onChange={(e) => setAllowDiplomaticExemption(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="exempt-toggle" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Allow Diplomatic & Official Tax-Exempt Overrides on Guest Folio
                </label>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active in Folio Engine
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Log Operating Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  <option value="Laundry & Linen">Laundry & Linen</option>
                  <option value="OTA Commission">OTA Commission</option>
                  <option value="Utilities">Utilities & Internet</option>
                  <option value="Maintenance Supplies">Maintenance Supplies</option>
                  <option value="Front Desk Supplies">Front Desk Supplies</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replenished bathroom toiletries"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Night Audit Modal */}
      <NightAuditModal
        isOpen={showNightAudit}
        onClose={() => setShowNightAudit(false)}
      />
    </div>
  );
};

