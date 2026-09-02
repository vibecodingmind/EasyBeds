import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Plus, Clock, User, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface StaffTask {
  id: string;
  title: string;
  department: 'Front Desk' | 'Housekeeping' | 'Maintenance' | 'Management';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  dueDate: string;
  completed: boolean;
}

export const TasksView: React.FC = () => {
  const { addToast } = useApp();

  const [tasks, setTasks] = useState<StaffTask[]>([
    { id: 'tsk-1', title: 'Prepare VIP champagne & welcome card for Room 101 arrival', department: 'Front Desk', priority: 'high', assignedTo: 'Receptionist Sarah', dueDate: 'Today, 2:00 PM', completed: false },
    { id: 'tsk-2', title: 'Conduct weekly pool filter backwash and pH calibration', department: 'Maintenance', priority: 'medium', assignedTo: 'Tech Dave', dueDate: 'Today, 5:00 PM', completed: false },
    { id: 'tsk-3', title: 'Audit minibar consumption logs against PMS folios', department: 'Front Desk', priority: 'low', assignedTo: 'Night Auditor Alex', dueDate: 'Tomorrow, 6:00 AM', completed: true },
    { id: 'tsk-4', title: 'Deep clean penthouse balcony glass railings', department: 'Housekeeping', priority: 'medium', assignedTo: 'Maria Santos', dueDate: 'Sep 02', completed: false },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState<StaffTask['department']>('Front Desk');
  const [newPriority, setNewPriority] = useState<StaffTask['priority']>('medium');
  const [newAssignee, setNewAssignee] = useState('Front Desk Staff');
  const [newDueDate, setNewDueDate] = useState('Today, 6:00 PM');

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const next = !t.completed;
        addToast(next ? 'success' : 'info', `Task marked ${next ? 'completed' : 'pending'}`);
        return { ...t, completed: next };
      }
      return t;
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const created: StaffTask = {
      id: `tsk-${Date.now()}`,
      title: newTitle,
      department: newDept,
      priority: newPriority,
      assignedTo: newAssignee,
      dueDate: newDueDate,
      completed: false,
    };

    setTasks(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    addToast('success', 'Task added to shift board');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Operational Shift Tasks & Handovers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-department action items, VIP prep, and shift handover reminders.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Shift Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {tasks.map(t => (
          <div
            key={t.id}
            onClick={() => handleToggleTask(t.id)}
            className={`p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
              t.completed ? 'bg-slate-50/70 opacity-60' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => {}}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className={`text-xs font-bold text-slate-900 ${t.completed ? 'line-through text-slate-400' : ''}`}>
                  {t.title}
                </span>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-indigo-700">{t.department}</span>
                  <span>•</span>
                  <span>Assigned: {t.assignedTo}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-600">Due: {t.dueDate}</span>
                </div>
              </div>
            </div>

            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
              t.priority === 'high' ? 'bg-rose-100 text-rose-800 border-rose-300' :
              t.priority === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-300' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Create Shift Task</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect room 204 minibar before 3 PM"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Date / Time</label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
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
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
