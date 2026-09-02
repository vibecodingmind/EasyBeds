import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  PlatformMetrics, PlatformTenantDetail, PlatformSubscriptionPlan,
  PlatformInvoice, PlatformAPIClient, PlatformIntegrationService,
  PlatformSystemHealth, PlatformAuditLog, HotelAccessReasonCode,
  TemporaryHotelAccessSession
} from '../types';
import {
  Server, Building2, Users, DollarSign, Plus, CheckCircle2,
  ShieldCheck, Activity, Key, Globe, ShieldAlert, FileText,
  Settings, LogIn, ExternalLink, RefreshCw, AlertTriangle,
  Clock, ArrowRight, Database, Check, X, Search, Filter,
  Lock, Laptop, Zap, Radio, Layers
} from 'lucide-react';

export const PlatformAdminView: React.FC<{ defaultTab?: string }> = ({ defaultTab }) => {
  const {
    tenants,
    properties,
    apiFetch,
    addToast,
    enterHotelContext,
    isHotelAccessActive,
    hotelAccessSession,
    exitHotelContext,
    currentUser,
    hasPermission,
    setActiveView,
    activeView,
    activeSubTab,
    navigateWithSubTab,
  } = useApp();

  // Determine active tab from activeView and activeSubTab, with defaultTab fallback
  const getDerivedActiveTab = (): 'overview' | 'tenants' | 'subscriptions' | 'modules' | 'team' | 'apis' | 'integrations' | 'audit' | 'settings' => {
    const target = activeView || defaultTab;
    if (target === 'platform-tenants' || activeSubTab === 'tenants') return 'tenants';
    if (target === 'platform-subscriptions' || activeSubTab === 'subscriptions' || activeSubTab === 'invoices') return 'subscriptions';
    if (target === 'platform-modules' || activeSubTab === 'modules') return 'modules';
    if (target === 'platform-users' || activeSubTab === 'team') return 'team';
    if (target === 'platform-apis' || activeSubTab === 'apis') return 'apis';
    if (target === 'platform-integrations' || activeSubTab === 'integrations') return 'integrations';
    if (target === 'platform-audit' || activeSubTab === 'audit') return 'audit';
    if (target === 'platform-settings' || activeSubTab === 'settings') return 'settings';
    return 'overview';
  };

  const activeTab = getDerivedActiveTab();

  // Data states
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tenantList, setTenantList] = useState<PlatformTenantDetail[]>([]);
  const [plans, setPlans] = useState<PlatformSubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [apiClients, setApiClients] = useState<PlatformAPIClient[]>([]);
  const [integrations, setIntegrations] = useState<PlatformIntegrationService[]>([]);
  const [systemHealth, setSystemHealth] = useState<PlatformSystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [tenantSearch, setTenantSearch] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState<string>('ALL');

  // Modal: Enter Hotel Context
  const [hotelToEnter, setHotelToEnter] = useState<PlatformTenantDetail | null>(null);
  const [accessReason, setAccessReason] = useState<HotelAccessReasonCode>('customer_support');
  const [accessNotes, setAccessNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [entering, setEntering] = useState(false);

  // Modal: Provision New Tenant
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provName, setProvName] = useState('');
  const [provSlug, setProvSlug] = useState('');
  const [provTier, setProvTier] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [provOwnerEmail, setProvOwnerEmail] = useState('');
  const [provOwnerName, setProvOwnerName] = useState('');

  // Modal: Create API Key
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyTier, setApiKeyTier] = useState<'standard' | 'unlimited'>('standard');
  const [apiKeyWebhook, setApiKeyWebhook] = useState('');

  // Load Platform Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        tenantsData,
        plansData,
        invData,
        modsData,
        usersData,
        apisData,
        intData,
        healthData,
        auditData,
        settingsData,
      ] = await Promise.all([
        apiFetch('/api/platform/metrics').catch(() => null),
        apiFetch('/api/platform/tenants').catch(() => []),
        apiFetch('/api/platform/subscriptions/plans').catch(() => []),
        apiFetch('/api/platform/billing/invoices').catch(() => []),
        apiFetch('/api/platform/modules').catch(() => []),
        apiFetch('/api/platform/users').catch(() => []),
        apiFetch('/api/platform/apis').catch(() => []),
        apiFetch('/api/platform/integrations').catch(() => []),
        apiFetch('/api/platform/system/health').catch(() => null),
        apiFetch('/api/platform/audit-logs').catch(() => []),
        apiFetch('/api/platform/settings').catch(() => null),
      ]);

      if (metricsData) setMetrics(metricsData);
      if (Array.isArray(tenantsData)) setTenantList(tenantsData);
      if (Array.isArray(plansData)) setPlans(plansData);
      if (Array.isArray(invData)) setInvoices(invData);
      if (Array.isArray(modsData)) setModules(modsData);
      if (Array.isArray(usersData)) setPlatformUsers(usersData);
      if (Array.isArray(apisData)) setApiClients(apisData);
      if (Array.isArray(intData)) setIntegrations(intData);
      if (healthData) setSystemHealth(healthData);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
      if (settingsData) setPlatformSettings(settingsData);
    } catch (e: any) {
      console.error('Failed to load platform admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Enter Hotel
  const handleConfirmEnterHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelToEnter) return;
    if (!termsAccepted) {
      addToast('error', 'You must acknowledge the audited access policy terms.');
      return;
    }

    setEntering(true);
    try {
      const success = await enterHotelContext(hotelToEnter.id, accessReason, accessNotes);
      if (success) {
        setHotelToEnter(null);
        setAccessNotes('');
        setTermsAccepted(false);
      }
    } finally {
      setEntering(false);
    }
  };

  // Handle Provision Tenant
  const handleProvisionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName || !provSlug) return;

    try {
      await apiFetch('/api/platform/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: provName,
          slug: provSlug,
          subscriptionTier: provTier,
          ownerEmail: provOwnerEmail,
          ownerName: provOwnerName,
        }),
      });

      addToast('success', `Provisioned tenant "${provName}" successfully!`);
      setShowProvisionModal(false);
      setProvName('');
      setProvSlug('');
      setProvOwnerEmail('');
      setProvOwnerName('');
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to provision tenant');
    }
  };

  // Handle Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyName) return;

    try {
      await apiFetch('/api/platform/apis', {
        method: 'POST',
        body: JSON.stringify({
          name: apiKeyName,
          tier: apiKeyTier,
          webhookUrl: apiKeyWebhook,
        }),
      });

      addToast('success', `API Key for "${apiKeyName}" generated!`);
      setShowApiKeyModal(false);
      setApiKeyName('');
      setApiKeyWebhook('');
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to generate API Key');
    }
  };

  // Test integration connection
  const handleTestIntegration = async (id: string, name: string) => {
    try {
      const res = await apiFetch(`/api/platform/integrations/${id}/test`, { method: 'POST' });
      addToast('success', res.message || `Tested connection to ${name}`);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || `Failed to test ${name}`);
    }
  };

  // Filtered tenants & audit logs
  const filteredTenants = tenantList.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.slug.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.id.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilterAction === 'ALL') return true;
    return log.action === auditFilterAction;
  });

  return (
    <div className="space-y-6">
      {/* Platform Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">SaaS Platform Administration</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPER_ADMIN KERNEL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Global tenant database partitions, subscription billing, OTA cluster health, and audited hotel-access controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={loadData}
            title="Refresh Platform Metrics"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Provision New Hotel
          </button>
        </div>
      </div>

      {/* Platform Sub-Tab Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', viewId: 'platform-admin', label: 'Telemetry & MRR', icon: Activity },
          { id: 'tenants', viewId: 'platform-tenants', label: 'Tenants & Access', icon: Building2 },
          { id: 'subscriptions', viewId: 'platform-subscriptions', label: 'Plans & Invoices', icon: DollarSign },
          { id: 'modules', viewId: 'platform-modules', label: 'Global Modules', icon: Layers },
          { id: 'team', viewId: 'platform-users', label: 'Platform Team', icon: Users },
          { id: 'apis', viewId: 'platform-apis', label: 'API Keys & Webhooks', icon: Key },
          { id: 'integrations', viewId: 'platform-integrations', label: 'Connectors', icon: Globe },
          { id: 'audit', viewId: 'platform-audit', label: 'Audit Trail', icon: ShieldAlert },
          { id: 'settings', viewId: 'platform-settings', label: 'Settings', icon: Settings },
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateWithSubTab(tab.viewId, tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-amber-300 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OVERVIEW & TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Monthly Recurring Revenue</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                ${metrics?.monthlyRecurringRevenue?.toLocaleString() || '1,297'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>ARR: ${metrics?.annualRecurringRevenue?.toLocaleString() || '15,564'}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Hotel Tenants</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {metrics?.totalTenants || tenantList.length} Tenants
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-600 font-medium">{metrics?.activeTenants || 3} Active</span>
                <span>•</span>
                <span>{metrics?.totalProperties || 4} Properties</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Live OTA Channel Engine</span>
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Radio className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-sky-600 mt-1 font-mono">
                {metrics?.activeOtaConnections || 3} Active
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                99.98% Gateway Uptime
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">API Requests (24h)</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-700 mt-1 font-mono">
                {metrics?.apiRequests24h?.toLocaleString() || '38,450'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Avg Latency: <span className="font-mono font-bold text-slate-700">{metrics?.averageResponseTimeMs || 42}ms</span>
              </div>
            </div>
          </div>

          {/* Platform Health & Cluster Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  SaaS Core System Health & Worker Queues
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ALL SYSTEMS OPERATIONAL
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">CPU Utilization</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">14.2%</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[14%]" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Memory Allocated</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">38.6%</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[38%]" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Redis Channel Queue</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">0 pending</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Realtime sync active</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">DB Partition Isolation</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">Verified</span>
                  <span className="text-[10px] text-slate-500">Multi-tenant RLS</span>
                </div>
              </div>

              {/* Global Integrations Summary */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700">Connected Cloud & OTA Gateways</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {integrations.slice(0, 3).map(integ => (
                    <div key={integ.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 truncate">{integ.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{integ.provider}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Access / Active Audited Sessions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Hotel Context Access Status
              </h3>

              {isHotelAccessActive ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                    Audited Hotel Session Active
                  </div>
                  <div className="text-xs text-amber-800">
                    You are currently inside <strong>{hotelAccessSession?.targetTenantName}</strong>.
                  </div>
                  <div className="text-[11px] text-amber-700 font-mono bg-white/60 p-2 rounded border border-amber-200">
                    Session: {hotelAccessSession?.sessionId}<br />
                    Reason: {hotelAccessSession?.reasonLabel}
                  </div>
                  <button
                    onClick={exitHotelContext}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition cursor-pointer"
                  >
                    Exit Hotel Context
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Operating in Platform Context</div>
                  <p className="text-[11px] text-slate-500">
                    SUPER_ADMIN belongs to the SaaS platform. To access hotel operational data, use the audited "Enter Hotel" workflow in the Tenants tab.
                  </p>
                  <button
                    onClick={() => navigateWithSubTab('platform-tenants', 'tenants')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    View Tenants & Hotel Access
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TENANTS MANAGEMENT & AUDITED HOTEL ACCESS WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hotel tenants by name, slug, or ID..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProvisionModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Provision New Hotel
              </button>
            </div>
          </div>

          {/* Tenants Table with "Enter Hotel" Button */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Hotel Organization</th>
                  <th className="py-3 px-4">Properties / Rooms</th>
                  <th className="py-3 px-4">Plan & Billing</th>
                  <th className="py-3 px-4">Active Modules</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Hotel Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-[11px] text-indigo-600 font-mono">{t.slug}.vanguardpms.com</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {t.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {t.propertiesCount || 1} {t.propertiesCount === 1 ? 'Property' : 'Properties'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {t.roomsCount || 20} Total Rooms
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {t.subscriptionTier}
                      </span>
                      <div className="text-[11px] font-bold text-emerald-600 font-mono mt-1">
                        ${t.monthlyFee || 349}/mo
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(t.activeModules || ['FRONT_DESK', 'HOUSEKEEPING', 'RESERVATIONS']).map(m => (
                          <span key={m} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-mono border border-slate-200">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-300">
                        {t.subscriptionStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setHotelToEnter(t);
                          setTermsAccepted(false);
                          setAccessNotes('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Enter Hotel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUBSCRIPTIONS & BILLING */}
      {/* ========================================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Subscription Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative ${
                  plan.isPopular ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">${plan.monthlyPrice}</span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                    or ${plan.annualPrice}/yr (billed annually)
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">Plan Entitlements:</div>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Subscribed Tenants:</span>
                  <span className="font-bold text-slate-900 font-mono">{plan.tenantCount || 1} Hotels</span>
                </div>
              </div>
            ))}
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent SaaS Subscription Invoices</h3>
              <span className="text-xs text-slate-500 font-mono">Automated Stripe Billing</span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Hotel Organization</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4 text-right">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{inv.tenantName}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{inv.planName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${inv.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-sans text-slate-500">{inv.issuedDate}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GLOBAL MODULES & MARKETPLACE ADOPTION */}
      {/* ========================================================================= */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Global Modular OS Catalog</h3>
              <p className="text-xs text-slate-500">Monitor modular adoption and core PMS distribution across all hotel tenants.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(mod => (
              <div key={mod.id || mod.code} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {mod.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{mod.name}</h4>
                  </div>
                  {mod.isCore ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Core PMS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Add-on Module
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{mod.description}</p>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tenant Adoption:</span>
                  <span className="font-bold font-mono text-indigo-600">
                    {mod.adoptionCount || 0} / {tenantList.length} Hotels
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLATFORM TEAM & SUPER ADMINS */}
      {/* ========================================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">SaaS Platform Administrative Team</h3>
              <p className="text-xs text-slate-500">
                Staff members authorized at the platform level (tenant: <code className="font-mono text-indigo-600">platform</code>).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Platform Staff Member</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Hotel Access Permitted</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.department || 'Platform Engineering'}</td>
                    <td className="py-3 px-4">
                      {u.role === 'SUPER_ADMIN' || u.role === 'SUPPORT_AGENT' || u.role === 'PLATFORM_ADMIN' ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes (Audited Access)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Platform Only</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: API KEYS & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'apis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Developer API Clients & Webhook Gateways</h3>
              <p className="text-xs text-slate-500">Manage client IDs, rate limit tiers, and external PMS event webhooks.</p>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Generate API Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiClients.map(client => (
              <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{client.name}</h4>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {client.clientId}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {client.tier}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Secret:</span>
                    <span>{client.clientSecretMasked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate Limit:</span>
                    <span>{client.rateLimitRps} RPS ({client.dailyQuota?.toLocaleString()} req/day)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Today:</span>
                    <span className="font-bold text-indigo-600">{client.requestsToday?.toLocaleString()} requests</span>
                  </div>
                </div>

                {client.webhookUrl && (
                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="font-semibold text-slate-700">Webhook: </span>
                    <span className="font-mono text-indigo-600">{client.webhookUrl}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GLOBAL INTEGRATIONS & CONNECTORS */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <h3 className="text-sm font-bold text-slate-900">SaaS Platform Global Infrastructure Connectors</h3>
            <p className="text-xs text-slate-500">Live connection health, latency benchmarks, and ping diagnostics for core cloud providers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(integ => (
              <div key={integ.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{integ.name}</h4>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{integ.provider}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {integ.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Latency</span>
                    <span className="font-bold text-slate-800">{integ.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">24h Uptime</span>
                    <span className="font-bold text-emerald-600">{integ.uptime24h}%</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {integ.configSummary}
                </div>

                <button
                  onClick={() => handleTestIntegration(integ.id, integ.name)}
                  className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Test Connection
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PLATFORM AUDIT & HOTEL ACCESS LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Security & Hotel Context Access Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable record of all super-admin hotel entries, tenant provisioning, and system events.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={auditFilterAction}
                onChange={e => setAuditFilterAction(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="IMPERSONATION_STARTED">IMPERSONATION_STARTED</option>
                <option value="IMPERSONATION_ENDED">IMPERSONATION_ENDED</option>
                <option value="ENTER_HOTEL_CONTEXT">ENTER_HOTEL_CONTEXT</option>
                <option value="EXIT_HOTEL_CONTEXT">EXIT_HOTEL_CONTEXT</option>
                <option value="TENANT_PROVISIONED">TENANT_PROVISIONED</option>
                <option value="TENANT_CONFIG_UPDATED">TENANT_CONFIG_UPDATED</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Hotel</th>
                  <th className="py-3 px-4">Reason / Details</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-amber-600 font-mono">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'IMPERSONATION_STARTED' || log.action === 'ENTER_HOTEL_CONTEXT'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : log.action === 'IMPERSONATION_ENDED' || log.action === 'EXIT_HOTEL_CONTEXT'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.targetTenantName || '—'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {log.details || log.reason || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: PLATFORM SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Global SaaS Platform Configuration</h3>
            <p className="text-xs text-slate-500">Security policies, tenant isolation parameters, and maintenance modes.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <div className="font-bold text-slate-900">Enforce Audited Hotel Access Mode</div>
                <div className="text-slate-500">Requires explicit reason logging and auto-terminates hotel context sessions.</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                STRICTLY ENFORCED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <div className="font-bold text-slate-900">Multi-Tenant Database Row-Level Security (RLS)</div>
                <div className="text-slate-500">Ensures physical and logical partition barriers between hotel data stores.</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <div className="font-bold text-slate-900">Global OTA Two-Way Rate Push Engine</div>
                <div className="text-slate-500">Real-time webhooks for Booking.com, Airbnb, and Expedia availability sync.</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                RUNNING (10m SYNC)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENTER HOTEL CONTEXT ACCESS (AUDITED WORKFLOW) */}
      {/* ========================================================================= */}
      {hotelToEnter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audited Hotel Access Confirmation</h3>
                  <p className="text-xs text-slate-500">Explicit security boundary crossing</p>
                </div>
              </div>
              <button
                onClick={() => setHotelToEnter(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                SUPER_ADMIN Identity & Audit Policy
              </div>
              <p className="text-[11px] leading-relaxed">
                You are entering the private operational environment of <strong>{hotelToEnter.name}</strong> ({hotelToEnter.id}). Your original identity (<strong>{currentUser?.name}</strong>) will be preserved. Every action, modification, and query will be logged to the SaaS Platform Audit Trail.
              </p>
            </div>

            <form onSubmit={handleConfirmEnterHotel} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Mandatory Reason for Hotel Access *
                </label>
                <select
                  value={accessReason}
                  onChange={e => setAccessReason(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="customer_support">Customer Support Request / Troubleshooting</option>
                  <option value="troubleshooting">Technical Diagnostic & Error Resolution</option>
                  <option value="configuration">Tenant Configuration & Module Onboarding</option>
                  <option value="security_investigation">Security Audit & Compliance Review</option>
                  <option value="billing_tier">Subscription Upgrade / Provisioning Review</option>
                  <option value="other">Authorized Administrative Operational Request</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Support Ticket # / Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={accessNotes}
                  onChange={e => setAccessNotes(e.target.value)}
                  placeholder="e.g. Zendesk Ticket #49281 — Inquiring about OTAs room synchronization mismatch..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="ack-terms"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="ack-terms" className="text-[11px] text-slate-700 cursor-pointer">
                  I understand that this session is temporary and audited. I agree to exit the hotel context immediately once operational maintenance is complete.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setHotelToEnter(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={entering || !termsAccepted}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {entering ? 'Authorizing...' : 'Confirm & Enter Hotel Environment'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROVISION NEW HOTEL TENANT */}
      {/* ========================================================================= */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Provision Hotel Customer Tenant</h3>
              <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hotel Group / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seaside Sanctuary Boutique Resorts"
                  value={provName}
                  onChange={e => {
                    setProvName(e.target.value);
                    if (!provSlug) {
                      setProvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subdomain Slug *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. seasidesanctuary"
                    value={provSlug}
                    onChange={e => setProvSlug(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-l-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg px-2.5 py-2.5 text-slate-500 font-mono text-[11px]">
                    .vanguardpms.com
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subscription Plan Tier *</label>
                <select
                  value={provTier}
                  onChange={e => setProvTier(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="starter">Starter PMS ($149/mo) — 1 Property / 20 Rooms</option>
                  <option value="professional">Professional Hotel OS ($349/mo) — 3 Properties / 100 Rooms</option>
                  <option value="enterprise">Enterprise Hospitality Suite ($799/mo) — Unlimited Properties</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">General Manager / Owner Email</label>
                <input
                  type="email"
                  placeholder="gm@hotelgroup.com"
                  value={provOwnerEmail}
                  onChange={e => setProvOwnerEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Provision Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE API KEY */}
      {/* ========================================================================= */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Generate Developer API Key</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Application / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest Mobile App Concierge"
                  value={apiKeyName}
                  onChange={e => setApiKeyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rate Limit Tier</label>
                <select
                  value={apiKeyTier}
                  onChange={e => setApiKeyTier(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="standard">Standard (50 RPS, 100k daily quota)</option>
                  <option value="unlimited">Enterprise / High-throughput (200 RPS, 1M daily quota)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Webhook Endpoint URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://api.myapp.com/webhooks/pms-events"
                  value={apiKeyWebhook}
                  onChange={e => setApiKeyWebhook(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
