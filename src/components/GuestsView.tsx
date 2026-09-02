import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Guest } from '../types';
import { 
  Users, Search, Star, Mail, Phone, Globe, 
  CreditCard, Calendar, Plus, MessageSquare, ShieldCheck, X 
} from 'lucide-react';

export const GuestsView: React.FC<{ onOpenDirectMessage?: (guest: Guest) => void }> = ({ onOpenDirectMessage }) => {
  const { currentProperty, apiFetch, dataVersion, addToast } = useApp();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Guest Form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNationality, setNewNationality] = useState('United States');
  const [newPassport, setNewPassport] = useState('');
  const [newVip, setNewVip] = useState(false);

  useEffect(() => {
    if (!currentProperty) return;
    apiFetch('/api/guests')
      .then(gList => setGuests(gList))
      .catch(e => console.error(e));
  }, [currentProperty?.id, dataVersion]);

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) return;

    const created: Guest = {
      id: `guest-${Date.now()}`,
      tenantId: 'tenant-azure',
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      phone: newPhone,
      nationality: newNationality,
      idPassportNumber: newPassport,
      vip: newVip,
      totalStays: 1,
      totalSpent: 0,
      notes: 'Directly registered at Front Desk.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGuests(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewFirstName('');
    setNewLastName('');
    addToast('success', `Guest profile created for ${created.firstName} ${created.lastName}`);
  };

  const filtered = guests.filter(g => 
    `${g.firstName} ${g.lastName} ${g.email} ${g.phone} ${g.nationality}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Guest Relationship CRM & Stay History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, stay frequencies, total spend, passport/ID scans, and personalized guest preferences.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Guest Profile
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, email, phone number, passport, nationality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
        />
      </div>

      {/* Guests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(guest => (
          <div
            key={guest.id}
            onClick={() => setSelectedGuest(guest)}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {guest.firstName} {guest.lastName}
                    </h2>
                    <div className="text-[11px] text-slate-400">{guest.nationality || 'United States'}</div>
                  </div>
                </div>

                {guest.vip && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{guest.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{guest.phone || 'No phone provided'}</span>
                </div>
                {guest.idPassportNumber && (
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ID: {guest.idPassportNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                {guest.totalStays} Prior Stay{guest.totalStays !== 1 ? 's' : ''}
              </span>
              <span className="font-mono font-bold text-slate-900">
                ${guest.totalSpent?.toFixed(2) || '0.00'} LTV
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Add Guest Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Nationality</label>
                  <input
                    type="text"
                    value={newNationality}
                    onChange={(e) => setNewNationality(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Passport / ID Number</label>
                  <input
                    type="text"
                    value={newPassport}
                    onChange={(e) => setNewPassport(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="vipCheck"
                  checked={newVip}
                  onChange={(e) => setNewVip(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="vipCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as VIP Guest
                </label>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
