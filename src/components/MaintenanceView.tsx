import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MaintenanceTicket, Room } from '../types';
import { 
  Wrench, Plus, CheckCircle2, AlertTriangle, 
  ShieldAlert, DollarSign, Clock, User, X 
} from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { currentProperty, apiFetch, dataVersion, addToast, refreshData } = useApp();
  
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New ticket state
  const [newRoomId, setNewRoomId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<MaintenanceTicket['priority']>('high');
  const [blockOutOfOrder, setBlockOutOfOrder] = useState(true);

  useEffect(() => {
    if (!currentProperty) return;

    Promise.all([
      apiFetch('/api/maintenance/tickets'),
      apiFetch('/api/rooms'),
    ]).then(([tList, rList]) => {
      setTickets(tList);
      setRooms(rList);
      if (rList.length > 0 && !newRoomId) {
        setNewRoomId(rList[0].id);
      }
    });
  }, [currentProperty?.id, dataVersion]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newRoomId) return;

    try {
      const created = await apiFetch('/api/maintenance/tickets', {
        method: 'POST',
        body: JSON.stringify({
          roomId: newRoomId,
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          isOutOfOrder: blockOutOfOrder,
        }),
      });

      // If out of order, also update room status
      if (blockOutOfOrder) {
        await apiFetch(`/api/rooms/${newRoomId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'out_of_order' }),
        });
      }

      setTickets(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      addToast('success', `Maintenance ticket logged: "${created.title}"`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleResolveTicket = async (ticketId: string, roomId: string) => {
    try {
      const updated = await apiFetch(`/api/maintenance/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      });
      
      // Return room to clean status
      await apiFetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'clean' }),
      });

      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      addToast('success', 'Ticket marked resolved and room returned to inventory');
      refreshData();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-950 border border-amber-900 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold">Property Engineering & Maintenance</h1>
            <p className="text-xs text-amber-200">
              Work orders, Out-of-Order room inventory blocking, contractor dispatch, and repair expense logs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Repair Ticket
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map(ticket => {
          const room = rooms.find(r => r.id === ticket.roomId);

          return (
            <div
              key={ticket.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700">
                      Room {room?.roomNumber || ticket.roomId}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 mt-0.5">{ticket.title}</h2>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    ticket.status === 'open' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {ticket.description || 'No additional details.'}
                </p>

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Priority:</span>
                    <span className="font-bold text-slate-800 capitalize">{ticket.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assigned Technician:</span>
                    <span className="font-medium text-slate-800">{ticket.assignedTo || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Out of Order Lock:</span>
                    <span className={`font-bold ${ticket.isOutOfOrder ? 'text-rose-600' : 'text-slate-600'}`}>
                      {ticket.isOutOfOrder ? 'Active (Blocked on OTAs)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>

                {ticket.status !== 'resolved' ? (
                  <button
                    onClick={() => handleResolveTicket(ticket.id, ticket.roomId)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Log Maintenance Ticket</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Room</label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  {rooms.map(rm => (
                    <option key={rm.id} value={rm.id}>Room {rm.roomNumber} ({rm.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC compressor humming / Shower leak"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Description & Repair Steps</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details for the engineering team..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="blockOOO"
                    checked={blockOutOfOrder}
                    onChange={(e) => setBlockOutOfOrder(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="blockOOO" className="font-semibold text-slate-700 cursor-pointer">
                    Block OOO on OTAs
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save & Lock Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
