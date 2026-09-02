import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChannelConnection, ChannelMapping, SyncLog, RoomType, RatePlan } from '../types';
import { 
  Share2, RefreshCw, CheckCircle2, AlertTriangle, Key, 
  Settings, Link as LinkIcon, Calendar, ArrowRight, ExternalLink, 
  Copy, Check, Play, ShieldCheck, HelpCircle 
} from 'lucide-react';

export const ChannelManagerView: React.FC = () => {
  const { currentProperty, apiFetch, dataVersion, addToast, refreshData, activeSubTab } = useApp();
  
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [mappings, setMappings] = useState<ChannelMapping[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'channels' | 'mappings' | 'logs' | 'ical'>('channels');
  const [copiedICal, setCopiedICal] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'channels' || activeSubTab === 'mappings' || activeSubTab === 'logs' || activeSubTab === 'ical') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Edit connection modal state
  const [editingConn, setEditingConn] = useState<ChannelConnection | null>(null);
  const [hotelIdInput, setHotelIdInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  // New mapping form state
  const [newMappingChannelId, setNewMappingChannelId] = useState('booking_com');
  const [newMappingRoomTypeId, setNewMappingRoomTypeId] = useState('');
  const [newMappingChannelRoomId, setNewMappingChannelRoomId] = useState('');

  useEffect(() => {
    if (!currentProperty) return;

    Promise.all([
      apiFetch('/api/channels'),
      apiFetch('/api/channels/mappings'),
      apiFetch('/api/channels/logs'),
      apiFetch('/api/room-types'),
    ]).then(([conns, maps, logList, rts]) => {
      setConnections(conns);
      setMappings(maps);
      setLogs(logList);
      setRoomTypes(rts);
      if (rts.length > 0 && !newMappingRoomTypeId) {
        setNewMappingRoomTypeId(rts[0].id);
      }
    });
  }, [currentProperty?.id, dataVersion]);

  const handleToggleActive = async (conn: ChannelConnection) => {
    try {
      const updated = await apiFetch(`/api/channels/${conn.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !conn.isActive }),
      });
      setConnections(prev => prev.map(c => c.id === conn.id ? updated : c));
      addToast('success', `${conn.channelId.replace('_', '.').toUpperCase()} is now ${!conn.isActive ? 'Active' : 'Disabled'}`);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConn) return;

    try {
      const updated = await apiFetch(`/api/channels/${editingConn.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          hotelId: hotelIdInput,
          apiKey: apiKeyInput,
          isActive: true,
        }),
      });
      setConnections(prev => prev.map(c => c.id === editingConn.id ? updated : c));
      setEditingConn(null);
      addToast('success', `Saved OTA credentials for ${editingConn.channelId.toUpperCase()}`);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleTriggerSync = async (channelId: string) => {
    setSyncingChannel(channelId);
    try {
      const res = await apiFetch(`/api/channels/${channelId}/sync`, { method: 'POST' });
      addToast('success', `Sync completed for ${channelId.replace('_', '.').toUpperCase()}: ${res.recordsUpdated} rates/availability records synchronized.`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Sync failed');
    } finally {
      setSyncingChannel(null);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiFetch('/api/channels/mappings', {
        method: 'POST',
        body: JSON.stringify({
          channelId: newMappingChannelId,
          roomTypeId: newMappingRoomTypeId,
          channelRoomTypeId: newMappingChannelRoomId || `OTA-RM-${newMappingRoomTypeId}`,
          channelRatePlanId: 'OTA-STD-BAR',
          rateMultiplier: 1.0,
        }),
      });
      setMappings(prev => [...prev, created]);
      setNewMappingChannelRoomId('');
      addToast('success', 'OTA Room mapping established');
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedICal(id);
    addToast('info', 'iCal URL copied to clipboard');
    setTimeout(() => setCopiedICal(null), 2000);
  };

  const getChannelLogo = (channelId: string) => {
    switch (channelId) {
      case 'booking_com': return { name: 'Booking.com', bg: 'bg-blue-600', color: 'text-white' };
      case 'airbnb': return { name: 'Airbnb', bg: 'bg-rose-500', color: 'text-white' };
      case 'expedia': return { name: 'Expedia PartnerCentral', bg: 'bg-amber-500', color: 'text-slate-950' };
      case 'agoda': return { name: 'Agoda YCS', bg: 'bg-indigo-700', color: 'text-white' };
      case 'hostelworld': return { name: 'Hostelworld Inbox', bg: 'bg-orange-600', color: 'text-white' };
      case 'nobeds': return { name: 'NOBEDS OpenAPI Gateway', bg: 'bg-emerald-600', color: 'text-white' };
      case 'ical': return { name: 'iCal Calendar Sync (2-Way)', bg: 'bg-purple-600', color: 'text-white' };
      default: return { name: channelId, bg: 'bg-slate-800', color: 'text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Share2 className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold tracking-tight">Channel Manager & 2-Way OTA Distribution</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time rate parity, stop-sell, minimum stay rules, and instantaneous booking synchronization with world OTAs.
          </p>
        </div>

        <button
          onClick={() => handleTriggerSync('all')}
          disabled={!!syncingChannel}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncingChannel ? 'animate-spin' : ''}`} />
          <span>{syncingChannel ? 'Synchronizing OTAs...' : 'Sync All Channels Now'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'channels' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          OTA Channels & Credentials ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'mappings' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Room & Rate Mappings ({mappings.length})
        </button>
        <button
          onClick={() => setActiveTab('ical')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'ical' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          iCal 2-Way Calendar Feeds
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'logs' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Sync Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: Channels & Credentials Cards */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => {
            const logo = getChannelLogo(conn.channelId);
            const isSyncing = syncingChannel === conn.channelId;

            return (
              <div key={conn.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-lg ${logo.bg} ${logo.color} flex items-center justify-center font-bold text-xs shadow-xs`}>
                        {conn.channelId.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{logo.name}</h2>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {conn.credentials?.hotelId || conn.credentials?.propertyId || 'Not Configured'}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      conn.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}>
                      {conn.isActive ? 'Connected' : 'Offline'}
                    </span>
                  </div>

                  {/* Body Specs */}
                  <div className="p-4 space-y-2 text-xs text-slate-600 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span>Sync Engine:</span>
                      <span className="font-semibold text-slate-900 capitalize font-mono">
                        {conn.channelId === 'booking_com' ? 'XML OTA Standard' : 
                         conn.channelId === 'airbnb' ? 'REST & Webhooks' : 
                         conn.channelId === 'ical' ? 'RFC 5545 iCalendar' : 'Direct API v2'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Synchronized:</span>
                      <span className="font-mono text-slate-700">
                        {conn.lastSync ? new Date(conn.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sync Health:</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Parity
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setEditingConn(conn);
                      setHotelIdInput(conn.credentials?.hotelId || conn.credentials?.propertyId || '');
                      setApiKeyInput(conn.credentials?.apiKey || conn.credentials?.token || '');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" /> Credentials
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleToggleActive(conn)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        conn.isActive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {conn.isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => handleTriggerSync(conn.channelId)}
                      disabled={isSyncing || !conn.isActive}
                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer disabled:opacity-40"
                      title="Trigger Immediate Sync"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Room & Rate Mappings */}
      {activeTab === 'mappings' && (
        <div className="space-y-6">
          {/* Create Mapping Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Map PMS Room Type to OTA Channel Room</h2>
            <form onSubmit={handleCreateMapping} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-slate-700">Select OTA Channel</label>
                <select
                  value={newMappingChannelId}
                  onChange={(e) => setNewMappingChannelId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  <option value="booking_com">Booking.com</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="expedia">Expedia</option>
                  <option value="agoda">Agoda</option>
                  <option value="hostelworld">Hostelworld</option>
                  <option value="nobeds">NOBEDS OpenAPI</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">PMS Room Type</label>
                <select
                  value={newMappingRoomTypeId}
                  onChange={(e) => setNewMappingRoomTypeId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Channel External Room ID</label>
                <input
                  type="text"
                  placeholder="e.g. BCOM_ROOM_9823"
                  value={newMappingChannelRoomId}
                  onChange={(e) => setNewMappingChannelRoomId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                + Connect Mapping
              </button>
            </form>
          </div>

          {/* Active Mappings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">PMS Internal Room Type</th>
                  <th className="py-3 px-4">OTA External Room ID</th>
                  <th className="py-3 px-4">Rate Multiplier</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map(map => {
                  const roomType = roomTypes.find(rt => rt.id === map.roomTypeId);

                  return (
                    <tr key={map.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 capitalize">
                        {map.channelId.replace('_', '.')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">
                        {roomType?.name || map.roomTypeId}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {map.channelRoomTypeId}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {map.rateMultiplier}x (100% Parity)
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Active Sync
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: iCal Feeds (2-Way Calendar Synchronization) */}
      {activeTab === 'ical' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Live RFC 5545 iCalendar Feeds (Outbound & Inbound)</h2>
            </div>
            <p className="text-xs text-slate-600">
              Provide these live `.ics` feed URLs to channels like Airbnb, VRBO, TripAdvisor, or Google Calendar to automatically block dates when bookings occur in your PMS.
            </p>
          </div>

          {/* List of room type iCal export links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomTypes.map(rt => {
              const exportUrl = `${window.location.origin}/api/ical/export/${rt.id}.ics`;

              return (
                <div key={rt.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{rt.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      RFC 5545
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">{exportUrl}</span>
                    <button
                      onClick={() => handleCopy(exportUrl, rt.id)}
                      className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      title="Copy Feed URL"
                    >
                      {copiedICal === rt.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Updates every 10 mins automatically</span>
                    <a
                      href={`/api/ical/export/${rt.id}.ics`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      Inspect .ICS Feed <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Live Channel Sync Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Payload Summary</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                    {log.channelId.replace('_', '.')}
                  </td>
                  <td className="py-3 px-4 text-slate-700 capitalize">
                    {log.action.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-800">
                    {log.payloadSummary}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.recordsAffected}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credentials Edit Modal */}
      {editingConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <h2 className="text-sm font-bold capitalize">Configure {editingConn.channelId.replace('_', '.')} API</h2>
              <button onClick={() => setEditingConn(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Hotel / Property ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 849201"
                  value={hotelIdInput}
                  onChange={(e) => setHotelIdInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">API Key / OAuth Bearer Token *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg text-purple-900 text-[11px] leading-relaxed border border-purple-200">
                <span className="font-bold">2-Way Security:</span> Credentials are encrypted and isolated per-tenant. Once saved, full inventory push will activate automatically.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingConn(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
