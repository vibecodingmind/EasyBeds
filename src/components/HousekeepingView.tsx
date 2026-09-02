import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HousekeepingTask, Room } from '../types';
import { 
  Sparkles, CheckCircle2, AlertCircle, Clock, 
  UserCheck, Plus, Check, ShieldCheck, RefreshCw 
} from 'lucide-react';

export const HousekeepingView: React.FC = () => {
  const { currentProperty, apiFetch, dataVersion, addToast, refreshData } = useApp();
  
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'dirty' | 'in_progress' | 'clean' | 'inspected'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty) return;
    setLoading(true);

    Promise.all([
      apiFetch('/api/housekeeping/tasks'),
      apiFetch('/api/rooms'),
    ])
      .then(([taskList, roomList]) => {
        setTasks(taskList);
        setRooms(roomList);
      })
      .finally(() => setLoading(false));
  }, [currentProperty?.id, dataVersion]);

  const handleUpdateStatus = async (taskId: string, newStatus: HousekeepingTask['status']) => {
    try {
      const updated = await apiFetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      addToast('success', `Room cleaning status updated to ${newStatus.toUpperCase()}`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleAssignStaff = async (taskId: string, staffName: string) => {
    try {
      const updated = await apiFetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: staffName }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      addToast('success', `Assigned task to ${staffName}`);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-teal-900 border border-teal-800 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold">Housekeeping & Room Turnover Command</h1>
            <p className="text-xs text-teal-200">
              Real-time room sanitization workflow, turn-down priority queues, and supervisor inspection board.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-teal-800 border border-teal-700 text-teal-200">
            {tasks.filter(t => t.status === 'clean' || t.status === 'inspected').length} / {tasks.length} Clean
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${filter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          All Rooms ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('dirty')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${filter === 'dirty' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Dirty / Checkout ({tasks.filter(t => t.status === 'dirty').length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${filter === 'in_progress' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          In Progress ({tasks.filter(t => t.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilter('clean')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${filter === 'clean' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Cleaned ({tasks.filter(t => t.status === 'clean').length})
        </button>
        <button
          onClick={() => setFilter('inspected')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${filter === 'inspected' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Supervisor Inspected ({tasks.filter(t => t.status === 'inspected').length})
        </button>
      </div>

      {/* Housekeeping Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(task => {
          const room = rooms.find(r => r.id === task.roomId);

          return (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900 font-mono">
                      Room {room?.roomNumber || task.roomId.replace('rm-', '')}
                    </div>
                    <div className="text-xs text-slate-500 capitalize mt-0.5">
                      {task.taskType.replace('_', ' ')} Turn
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    task.priority === 'urgent' ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
                    task.priority === 'high' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Status:</span>
                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                      task.status === 'dirty' ? 'bg-rose-100 text-rose-800' :
                      task.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                      task.status === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Staff:</span>
                    <select
                      value={task.assignedTo || ''}
                      onChange={(e) => handleAssignStaff(task.id, e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      <option value="Maria Santos">Maria Santos</option>
                      <option value="Carlos Mendez">Carlos Mendez</option>
                      <option value="Elena Rostova">Elena Rostova</option>
                    </select>
                  </div>

                  {task.notes && (
                    <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
                      "{task.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Cleaning Crew */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                  className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-center transition cursor-pointer"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(task.id, 'clean')}
                  className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-center transition cursor-pointer"
                >
                  Mark Clean
                </button>
                <button
                  onClick={() => handleUpdateStatus(task.id, 'inspected')}
                  className="py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-center transition cursor-pointer"
                >
                  Supervisor OK
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
