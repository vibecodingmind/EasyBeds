import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Building2, Calendar, Plus, CheckCircle2, 
  DollarSign, FileText, ArrowRight, ShieldCheck, AlertCircle, Clock, X
} from 'lucide-react';

interface GroupBlock {
  id: string;
  groupName: string;
  companyOrOrganizer: string;
  contractCode: string;
  startDate: string;
  endDate: string;
  cutOffDate: string;
  allocatedRooms: number;
  pickedUpRooms: number;
  roomType: string;
  negotiatedRate: number;
  status: 'contracted' | 'definite' | 'released' | 'completed';
  billingRouting: 'master_room_tax_guest_incidentals' | 'all_to_master' | 'individual_all';
}

export const GroupBlocksView: React.FC = () => {
  const { addToast } = useApp();

  const [blocks, setBlocks] = useState<GroupBlock[]>([
    {
      id: 'grp-1',
      groupName: 'Apex Cloud Tech Summit 2026',
      companyOrOrganizer: 'Apex Global Enterprises',
      contractCode: 'GRP-APEX-0926',
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      cutOffDate: '2026-09-05',
      allocatedRooms: 20,
      pickedUpRooms: 16,
      roomType: 'Deluxe King',
      negotiatedRate: 195.00,
      status: 'definite',
      billingRouting: 'master_room_tax_guest_incidentals',
    },
    {
      id: 'grp-2',
      groupName: 'Somerset & Vance Wedding Party',
      companyOrOrganizer: 'Eleanor Vance',
      contractCode: 'GRP-WED-VANCE',
      startDate: '2026-09-18',
      endDate: '2026-09-21',
      cutOffDate: '2026-09-10',
      allocatedRooms: 12,
      pickedUpRooms: 10,
      roomType: 'Oceanfront King',
      negotiatedRate: 240.00,
      status: 'contracted',
      billingRouting: 'individual_all',
    },
    {
      id: 'grp-3',
      groupName: 'Pacific Rim Medical Symposium',
      companyOrOrganizer: 'CA Health Alliance',
      contractCode: 'GRP-MED-PACIFIC',
      startDate: '2026-09-25',
      endDate: '2026-09-29',
      cutOffDate: '2026-09-15',
      allocatedRooms: 15,
      pickedUpRooms: 4,
      roomType: 'Standard Queen',
      negotiatedRate: 175.00,
      status: 'contracted',
      billingRouting: 'master_room_tax_guest_incidentals',
    }
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newOrganizer, setNewOrganizer] = useState('');
  const [newAllocated, setNewAllocated] = useState(10);
  const [newRate, setNewRate] = useState(199);
  const [newStartDate, setNewStartDate] = useState('2026-09-15');
  const [newEndDate, setNewEndDate] = useState('2026-09-18');
  const [newCutOff, setNewCutOff] = useState('2026-09-08');

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const newBlock: GroupBlock = {
      id: `grp-${Date.now()}`,
      groupName: newGroupName,
      companyOrOrganizer: newOrganizer || 'Direct Group',
      contractCode: `GRP-${newGroupName.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      startDate: newStartDate,
      endDate: newEndDate,
      cutOffDate: newCutOff,
      allocatedRooms: Number(newAllocated),
      pickedUpRooms: 0,
      roomType: 'Deluxe King',
      negotiatedRate: Number(newRate),
      status: 'contracted',
      billingRouting: 'master_room_tax_guest_incidentals',
    };

    setBlocks(prev => [newBlock, ...prev]);
    setShowNewModal(false);
    setNewGroupName('');
    addToast('success', `Created room block "${newGroupName}" with ${newAllocated} contracted rooms`);
  };

  const handleReleaseInventory = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, status: 'released' };
      }
      return b;
    }));
    addToast('info', 'Unsold group room block inventory released back to public OTA channels.');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Group Bookings & Room Block Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate blocks, weddings, pick-up pace, cut-off date inventory releases, and master-folio billing routes.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Contract New Group Block</span>
        </button>
      </div>

      {/* Group Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map(b => {
          const pickupPercentage = Math.round((b.pickedUpRooms / b.allocatedRooms) * 100);
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {b.contractCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    b.status === 'definite' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'contracted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{b.groupName}</h3>
                <div className="text-[11px] text-slate-500 mt-0.5">{b.companyOrOrganizer}</div>

                {/* Dates & Rates */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Stay Period:</span>
                    <span className="font-mono font-semibold text-slate-900">{b.startDate} → {b.endDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cut-Off Release:</span>
                    <span className="font-mono font-semibold text-rose-600">{b.cutOffDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Negotiated Rate:</span>
                    <span className="font-mono font-bold text-emerald-600">${b.negotiatedRate}/night</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Billing Route:</span>
                    <span className="text-[10px] font-semibold text-indigo-700">Master + Guest Extras</span>
                  </div>
                </div>

                {/* Pickup Meter */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Pick-Up Progress:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {b.pickedUpRooms} / {b.allocatedRooms} Rooms ({pickupPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        pickupPercentage > 80 ? 'bg-emerald-500' : pickupPercentage > 40 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pickupPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleReleaseInventory(b.id)}
                  disabled={b.status === 'released'}
                  className="w-full py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {b.status === 'released' ? 'Inventory Released' : 'Release Unsold Rooms'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Group Block Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Contract New Group Room Block</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Group / Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BioTech Summit 2026"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Organizer</label>
                <input
                  type="text"
                  placeholder="e.g. BioTech International"
                  value={newOrganizer}
                  onChange={e => setNewOrganizer(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allocated Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newAllocated}
                    onChange={e => setNewAllocated(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Negotiated Rate ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRate}
                    onChange={e => setNewRate(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cut-Off Release Date</label>
                <input
                  type="date"
                  value={newCutOff}
                  onChange={e => setNewCutOff(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Create Contracted Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
