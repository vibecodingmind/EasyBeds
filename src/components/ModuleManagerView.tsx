import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Boxes,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Settings2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  DollarSign,
  PackageCheck,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Store,
  Check,
  X
} from 'lucide-react';
import { ModuleCategory, ModuleCode } from '../types';

export const ModuleManagerView: React.FC = () => {
  const {
    modules,
    entitlements,
    addons,
    currentTenant,
    currentProperty,
    enableModule,
    disableModule,
    updateModuleConfig,
    subscribeAddon,
    setActiveView
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'addons' | 'limits'>('installed');

  // Config modal state
  const [configModule, setConfigModule] = useState<any | null>(null);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({});
  const [isTenantWide, setIsTenantWide] = useState(false);
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'core_pms', label: 'Core PMS' },
    { id: 'distribution', label: 'Distribution & Channels' },
    { id: 'food_beverage', label: 'Food & Beverage' },
    { id: 'leisure_wellness', label: 'Leisure & Wellness' },
    { id: 'operations', label: 'Operations & Stock' },
    { id: 'guest_services', label: 'Guest Services' },
    { id: 'events_sales', label: 'Events & Sales' },
    { id: 'finance_reporting', label: 'Finance & Ledger' },
  ];

  const handleToggleModule = async (mod: any) => {
    setSubmittingCode(mod.code);
    try {
      if (mod.isEnabled) {
        await disableModule(mod.code, isTenantWide);
      } else {
        await enableModule(mod.code, isTenantWide);
      }
    } finally {
      setSubmittingCode(null);
    }
  };

  const handleOpenConfig = (mod: any) => {
    setConfigModule(mod);
    setTempConfig(mod.configuration || {});
  };

  const handleSaveConfig = async () => {
    if (!configModule) return;
    try {
      await updateModuleConfig(configModule.code, tempConfig);
      setConfigModule(null);
    } catch (e) {
      // toast is handled in context
    }
  };

  const filteredModules = modules.filter(m => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'installed') {
      return matchesCat && matchesSearch && m.isEnabled;
    } else if (activeTab === 'marketplace') {
      return matchesCat && matchesSearch;
    }
    return true;
  });

  const enabledCount = modules.filter(m => m.isEnabled).length;
  const availableCount = modules.length;

  return (
    <div className="space-y-6 select-none" id="module-manager-view">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-900/40 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-400">
                <Boxes className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Modular Operating System</h1>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30">
                {currentTenant?.subscriptionTier?.toUpperCase()} PLAN
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Enable and manage hotel operating modules. Activate Food & Beverage, Kitchen KDS, Swimming Pool, Multi-Location Inventory, or custom Add-ons on demand with unified guest folios.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 shrink-0">
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Modules</div>
              <div className="text-2xl font-bold text-emerald-400">{enabledCount} <span className="text-sm font-normal text-slate-400">/ {availableCount}</span></div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Current Property</div>
              <div className="text-sm font-semibold text-white truncate max-w-[140px]">{currentProperty?.name || 'All Properties'}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'installed'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Active Modules ({enabledCount})
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Module Catalog ({availableCount})
          </button>

          <button
            onClick={() => setActiveTab('addons')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'addons'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Subscription Add-ons ({addons.length})
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'limits'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Entitlements & Usage
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {(activeTab === 'installed' || activeTab === 'marketplace') && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 md:w-60"
              />
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map(mod => {
              const isLocked = !mod.isEntitled;
              const isCore = mod.isCore;
              const isEnabled = mod.isEnabled;

              return (
                <div
                  key={mod.id}
                  className={`bg-white rounded-xl border p-5 transition flex flex-col justify-between shadow-xs ${
                    isEnabled
                      ? 'border-emerald-200 ring-1 ring-emerald-500/20'
                      : isLocked
                      ? 'border-slate-200 opacity-80 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2.5 rounded-lg ${
                            isEnabled
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : isLocked
                              ? 'bg-slate-100 text-slate-400 border border-slate-200'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}
                        >
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{mod.name}</h3>
                          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{mod.code}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isCore ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          CORE
                        </span>
                      ) : isEnabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                        </span>
                      ) : isLocked ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> {mod.requiredPlanTier.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{mod.description}</p>

                    {/* Dependencies indicator */}
                    {mod.dependencies && mod.dependencies.length > 0 && (
                      <div className="mb-4 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>Requires: <strong className="text-slate-700">{mod.dependencies.join(', ')}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    {isEnabled && (
                      <button
                        onClick={() => handleOpenConfig(mod)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                        title="Configure Module Settings"
                      >
                        <Settings2 className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {isCore ? (
                        <span className="text-xs text-slate-600 font-medium">Always Enabled</span>
                      ) : isLocked ? (
                        <button
                          onClick={() => setActiveTab('addons')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Unlock</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleModule(mod)}
                          disabled={submittingCode === mod.code}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isEnabled
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {submittingCode === mod.code ? (
                            <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                          ) : isEnabled ? (
                            <span>Disable</span>
                          ) : (
                            <span>Enable</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add-ons Catalog Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-6 text-white border border-indigo-800">
            <h2 className="text-lg font-bold mb-1">A La Carte Hotel Add-ons</h2>
            <p className="text-slate-300 text-xs max-w-xl">
              Expand your property operations without upgrading your entire tier plan. Subscribe to specialized modular suites with flexible monthly billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map(addon => {
              const isSubscribed = entitlements?.activeAddons.includes(addon.code) || currentTenant?.subscriptionTier === 'enterprise';

              return (
                <div key={addon.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {addon.category.replace('_', ' & ').toUpperCase()}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{addon.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">${addon.monthlyPrice}</div>
                        <div className="text-[11px] text-slate-600">/ month</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-4">{addon.description}</p>

                    <div className="space-y-1.5 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Unlocks Modules:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {addon.moduleCodes.map(code => (
                          <span key={code} className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isSubscribed ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active in Subscription
                      </span>
                    ) : (
                      <button
                        onClick={() => subscribeAddon(addon.code)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <DollarSign className="w-4 h-4" /> Subscribe for ${addon.monthlyPrice}/mo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entitlements & Limits Tab */}
      {activeTab === 'limits' && entitlements && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Tenant Entitlements & Capacity Usage</h2>
            <p className="text-xs text-slate-600">Real-time resource allocation and hard limit counters enforced by the OS kernel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Properties</span>
                <span>{entitlements.currentUsage.properties} / {entitlements.limits.maxProperties}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (entitlements.currentUsage.properties / entitlements.limits.maxProperties) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Rooms Managed</span>
                <span>{entitlements.currentUsage.rooms} / {entitlements.limits.maxRooms}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (entitlements.currentUsage.rooms / entitlements.limits.maxRooms) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Team Members</span>
                <span>{entitlements.currentUsage.users} / {entitlements.limits.maxUsers}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (entitlements.currentUsage.users / entitlements.limits.maxUsers) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Configuration Modal */}
      {configModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{configModule.name} Configuration</h3>
                <span className="text-xs text-slate-600 font-mono">Module: {configModule.code}</span>
              </div>
              <button
                onClick={() => setConfigModule(null)}
                className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Config Fields based on module code */}
            <div className="space-y-4 py-2">
              {configModule.code === 'RESTAURANT' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Sales Tax Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempConfig.taxRate || 0.08}
                      onChange={e => setTempConfig({ ...tempConfig, taxRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Charge Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempConfig.serviceCharge || 0.10}
                      onChange={e => setTempConfig({ ...tempConfig, serviceCharge: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowRoomCharge"
                      checked={tempConfig.allowRoomCharge ?? true}
                      onChange={e => setTempConfig({ ...tempConfig, allowRoomCharge: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="allowRoomCharge" className="text-xs font-medium text-slate-700">Allow Direct Guest Room Folio Posting</label>
                  </div>
                </>
              )}

              {configModule.code === 'SWIMMING_POOL' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Safe Bather Capacity</label>
                    <input
                      type="number"
                      value={tempConfig.maxCapacity || 45}
                      onChange={e => setTempConfig({ ...tempConfig, maxCapacity: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Adult Visitor Day Pass ($)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tempConfig.adultDayPassPrice || 35}
                        onChange={e => setTempConfig({ ...tempConfig, adultDayPassPrice: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Towel Rental Fee ($)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tempConfig.towelRentalPrice || 5}
                        onChange={e => setTempConfig({ ...tempConfig, towelRentalPrice: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {configModule.code === 'BAR' && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hhEnabled"
                      checked={tempConfig.happyHourEnabled ?? true}
                      onChange={e => setTempConfig({ ...tempConfig, happyHourEnabled: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="hhEnabled" className="text-xs font-medium text-slate-700">Enable Happy Hour Pricing Discount</label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Happy Hour Discount Percentage (%)</label>
                    <input
                      type="number"
                      value={tempConfig.happyHourDiscountPercent || 20}
                      onChange={e => setTempConfig({ ...tempConfig, happyHourDiscountPercent: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {configModule.code === 'INVENTORY' && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lowAlerts"
                      checked={tempConfig.lowStockAlerts ?? true}
                      onChange={e => setTempConfig({ ...tempConfig, lowStockAlerts: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="lowAlerts" className="text-xs font-medium text-slate-700">Enable Automated Low-Stock Reorder Alerts</label>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setConfigModule(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
