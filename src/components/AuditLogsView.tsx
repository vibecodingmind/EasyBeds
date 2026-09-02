import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Activity,
  Search,
  Filter,
  Layers,
  Receipt,
  Boxes,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AuditLogEntry } from '../types';

export const AuditLogsView: React.FC = () => {
  const { apiFetch, currentTenant, dataVersion } = useApp();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    apiFetch('/api/modules/audit-logs')
      .then(data => setLogs(data))
      .catch(err => console.error(err));
  }, [currentTenant?.id, dataVersion]);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.userName && l.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = filterAction === 'all' || l.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('MODULE')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('FOLIO') || action.includes('PAYMENT') || action.includes('ORDER')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('STOCK') || action.includes('INVENTORY') || action.includes('PO')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('POOL')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 select-none" id="audit-logs-view">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">System Audit & Security Trail</h1>
            <p className="text-slate-400 text-xs">Immutable chronological ledger of module activations, room folio charges, inventory movements & administrative events</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Actions</option>
            <option value="MODULE_ENABLED">Module Enabled</option>
            <option value="MODULE_DISABLED">Module Disabled</option>
            <option value="FOLIO_CHARGE_CREATED">Folio Charge</option>
            <option value="STOCK_ADJUSTED">Stock Adjusted</option>
            <option value="ORDER_CREATED">POS Order Created</option>
            <option value="POOL_PASS_ISSUED">Pool Pass Issued</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full md:w-60 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Details</th>
                <th className="p-3">Actor / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{log.details}</td>
                  <td className="p-3 text-slate-600 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.userName || 'System'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
