import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Room, RoomType, RoomStatus } from '../types';
import { 
  BedDouble, Plus, Sparkles, Wrench, ShieldAlert, 
  CheckCircle2, Building, DollarSign, Users, Layers, X 
} from 'lucide-react';

export const RoomsView: React.FC = () => {
  const { currentProperty, apiFetch, dataVersion, addToast, refreshData } = useApp();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms');

  // New Room Modal
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState('');

  // New Room Type Modal
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeBaseRate, setNewTypeBaseRate] = useState(180);
  const [newTypeCapacity, setNewTypeCapacity] = useState(2);
  const [newTypeBeds, setNewTypeBeds] = useState('1 King Bed');

  useEffect(() => {
    if (!currentProperty) return;

    Promise.all([
      apiFetch('/api/rooms'),
      apiFetch('/api/room-types'),
    ]).then(([rmList, rtList]) => {
      setRooms(rmList);
      setRoomTypes(rtList);
      if (rtList.length > 0 && !newRoomTypeId) {
        setNewRoomTypeId(rtList[0].id);
      }
    });
  }, [currentProperty?.id, dataVersion]);

  const handleUpdateRoomStatus = async (roomId: string, newStatus: RoomStatus) => {
    try {
      const updated = await apiFetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setRooms(prev => prev.map(r => r.id === roomId ? updated : r));
      addToast('success', `Room ${updated.roomNumber} marked as ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomTypeId) return;

    try {
      const created = await apiFetch('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          floor: Number(newRoomFloor),
          roomTypeId: newRoomTypeId,
          status: 'clean',
        }),
      });
      setRooms(prev => [...prev, created]);
      setShowAddRoom(false);
      setNewRoomNumber('');
      addToast('success', `Room ${created.roomNumber} created successfully`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName) return;

    try {
      const created = await apiFetch('/api/room-types', {
        method: 'POST',
        body: JSON.stringify({
          name: newTypeName,
          code: newTypeName.toUpperCase().replace(/\s+/g, '-').slice(0, 8),
          baseRate: Number(newTypeBaseRate),
          maxGuests: Number(newTypeCapacity),
          bedConfiguration: newTypeBeds,
          weekendMultiplier: 1.15,
          minStayDefault: 1,
          amenities: ['Wi-Fi', 'En-Suite Bathroom', 'Smart TV', 'Air Conditioning'],
        }),
      });
      setRoomTypes(prev => [...prev, created]);
      setShowAddType(false);
      setNewTypeName('');
      addToast('success', `Room category ${created.name} added`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort();

  const filteredRooms = selectedFloor === 'all' 
    ? rooms 
    : rooms.filter(r => r.floor === selectedFloor);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-indigo-600" />
            Physical Rooms & Inventory Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel units, room categories, floor assignments, and housekeeping readiness.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddType(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            + Add Room Type
          </button>
          <button
            onClick={() => setShowAddRoom(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Physical Room Unit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'rooms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Physical Units Matrix ({rooms.length} Rooms)
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'types' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Room Types & Pricing ({roomTypes.length} Categories)
          </button>
        </div>

        {activeTab === 'rooms' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Floor:</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {floors.map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Rooms Grid */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map(room => {
            const rt = roomTypes.find(t => t.id === room.roomTypeId);

            return (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900 font-mono">
                        Room {room.roomNumber}
                      </div>
                      <div className="text-xs font-medium text-indigo-600 mt-0.5">
                        {rt?.name || 'Standard'}
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Floor {room.floor}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                      room.status === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                      room.status === 'inspected' ? 'bg-teal-100 text-teal-800' :
                      room.status === 'dirty' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {room.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Quick Status Toggles */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  <button
                    onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                    className="flex-1 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-center transition cursor-pointer"
                    title="Mark Clean"
                  >
                    Clean
                  </button>
                  <button
                    onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                    className="flex-1 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-center transition cursor-pointer"
                    title="Mark Dirty"
                  >
                    Dirty
                  </button>
                  <button
                    onClick={() => handleUpdateRoomStatus(room.id, 'out_of_order')}
                    className="flex-1 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-center transition cursor-pointer"
                    title="Lock for Maintenance"
                  >
                    OOO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Room Types List */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomTypes.map(rt => {
            const count = rooms.filter(r => r.roomTypeId === rt.id).length;

            return (
              <div key={rt.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{rt.name}</h2>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">Code: {rt.code}</div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {count} Units Total
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500">Base Rate:</span>
                    <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">${rt.baseRate}/nt</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Max Capacity:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{rt.maxGuests} Guests</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Bedding:</span>
                    <div className="font-bold text-slate-900 text-xs mt-0.5 truncate">{rt.bedConfiguration}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Included Amenities:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {rt.amenities.map(am => (
                      <span key={am} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Add New Physical Room</h2>
              <button onClick={() => setShowAddRoom(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Room Unit Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 305"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Floor Level</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Room Category Type</label>
                <select
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Type Modal */}
      {showAddType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Add Room Category</h2>
              <button onClick={() => setShowAddType(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomType} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Presidential Ocean Penthouse"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Base Rate ($/nt)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTypeBaseRate}
                    onChange={(e) => setNewTypeBaseRate(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTypeCapacity}
                    onChange={(e) => setNewTypeCapacity(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Bed Setup</label>
                <input
                  type="text"
                  value={newTypeBeds}
                  onChange={(e) => setNewTypeBeds(e.target.value)}
                  placeholder="e.g. 1 King + 1 Sofa Bed"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddType(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
