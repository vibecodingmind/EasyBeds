import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRoleDefinition, PermissionCode, UserRole } from '../types';
import {
  Settings,
  Building,
  CreditCard,
  ShieldCheck,
  Check,
  Save,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Lock,
  UserCheck,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentProperty,
    currentTenant,
    properties,
    allUsers,
    roles,
    permissionsCatalog,
    createUser,
    updateUser,
    deleteUser,
    createCustomRole,
    updateRole,
    deleteRole,
    hasPermission,
    currentUser,
    addToast,
    activeSubTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'property' | 'users' | 'roles' | 'billing' | 'security'>('property');

  React.useEffect(() => {
    if (activeSubTab === 'property' || activeSubTab === 'users' || activeSubTab === 'roles' || activeSubTab === 'billing' || activeSubTab === 'security') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Property Form State
  const [propName, setPropName] = useState(currentProperty?.name || 'Azure Bay Resort & Villas');
  const [address, setAddress] = useState(currentProperty?.address || '104 Oceanfront Highway');
  const [city, setCity] = useState(currentProperty?.city || 'Malibu, CA');
  const [currency, setCurrency] = useState(currentProperty?.currency || 'USD');
  const [checkInTime, setCheckInTime] = useState(currentProperty?.checkInTime || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(currentProperty?.checkOutTime || '11:00');
  const [selectedPlan, setSelectedPlan] = useState(currentTenant?.subscriptionTier || 'pro');

  // New User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('FRONT_DESK');
  const [newUserDept, setNewUserDept] = useState('Front Desk');
  const [newUserPhone, setNewUserPhone] = useState('+1 (310) 555-0199');
  const [newUserPropScope, setNewUserPropScope] = useState<string>('*');

  // Role Studio State
  const [selectedRole, setSelectedRole] = useState<UserRoleDefinition | null>(roles[0] || null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleLanding, setNewRoleLanding] = useState('dashboard');
  const [newRoleSelectedPerms, setNewRoleSelectedPerms] = useState<PermissionCode[]>([
    'reservations.view',
    'guests.view'
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Property settings and policies saved successfully');
  };

  const handleUpgradePlan = (plan: 'starter' | 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
    addToast('success', `Tenant subscription tier updated to ${plan.toUpperCase()}`);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      addToast('error', 'Name and email are required');
      return;
    }
    const roleDef = roles.find(r => r.code === newUserRole);
    await createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      roleId: roleDef?.id,
      department: newUserDept,
      phone: newUserPhone,
      scope: {
        tenantId: currentTenant?.id || 'tenant-azure',
        propertyIds: newUserPropScope === '*' ? ['*'] : [newUserPropScope],
        outletIds: ['*'],
        department: newUserDept
      }
    });
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleTogglePermission = async (permCode: PermissionCode) => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      addToast('info', 'System roles have protected core permission baselines. Create a custom role to customize fully.');
      return;
    }

    const hasP = selectedRole.permissions.includes(permCode);
    const updatedPerms = hasP
      ? selectedRole.permissions.filter(p => p !== permCode)
      : [...selectedRole.permissions, permCode];

    await updateRole(selectedRole.id, { permissions: updatedPerms });
    setSelectedRole(prev => prev ? { ...prev, permissions: updatedPerms } : null);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) {
      addToast('error', 'Role name is required');
      return;
    }
    const created = await createCustomRole({
      name: newRoleName,
      code: `CUSTOM_${newRoleName.toUpperCase().replace(/\s+/g, '_')}`,
      description: newRoleDesc || 'Custom hotel role',
      category: 'custom',
      isSystem: false,
      tenantId: currentTenant?.id || 'tenant-azure',
      permissions: newRoleSelectedPerms,
      defaultLandingView: newRoleLanding,
      allowedOutlets: ['*']
    });
    setSelectedRole(created);
    setShowNewRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  // Group permissions catalog by category for the permission matrix
  const permissionCategories = Array.from(new Set(permissionsCatalog.map(p => p.category)));

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Hotel Settings, Identity & Authorization Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure property operational policies, manage staff users, and design granular role permission matrices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('property')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'property' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Property Policies
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff Directory ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roles' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Roles & Permissions ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'billing' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Subscription Plan
          </button>
        </div>
      </div>

      {/* TAB 1: PROPERTY POLICIES */}
      {activeTab === 'property' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Property Profile & Operating Rules
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700">Property Name</label>
                <input
                  type="text"
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Operating Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="AUD">AUD ($ - Australian Dollar)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">City / State / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700">Standard Check-In Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Standard Check-Out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Property Policies
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: STAFF & USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Staff & User Access Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage all hotel employees, their assigned roles, departments, and property access scopes.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Role & Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Property Scope</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => {
                  const roleDef = roles.find(r => r.id === u.roleId || r.code === u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {roleDef?.name || u.customRoleName || u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {u.department || 'General'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {u.scope?.propertyIds?.includes('*') ? 'All Properties (*)' : u.scope?.propertyIds?.join(', ') || 'Assigned'}
                      </td>
                      <td className="py-3 px-3">
                        {u.active ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Deactivated</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.role !== 'SUPER_ADMIN' && u.id !== currentUser?.id && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Deactivate User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & PERMISSIONS STUDIO */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Role List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hotel Roles ({roles.length})</h3>
                <p className="text-[11px] text-slate-500">Select a role to inspect permissions</p>
              </div>
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                title="Create Custom Role"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{r.name}</span>
                      {r.isSystem ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          SYSTEM
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60 text-[10px] text-slate-400 font-mono">
                      <span>{r.permissions.length} perms</span>
                      <span>View: {r.defaultLandingView}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permission Matrix */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
            {selectedRole ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{selectedRole.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {selectedRole.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                  </div>

                  {!selectedRole.isSystem && (
                    <button
                      onClick={() => deleteRole(selectedRole.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Role
                    </button>
                  )}
                </div>

                {/* Permission Matrix Categorized */}
                <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
                  {permissionCategories.map((category) => {
                    const categoryPerms = permissionsCatalog.filter(p => p.category === category);
                    return (
                      <div key={category} className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/60 px-2.5 py-1 rounded border border-indigo-100">
                          {category} Permissions
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoryPerms.map((perm) => {
                            const isGranted = selectedRole.permissions.includes(perm.code) || selectedRole.permissions.includes('*');
                            return (
                              <div
                                key={perm.code}
                                onClick={() => handleTogglePermission(perm.code)}
                                className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 transition cursor-pointer ${
                                  isGranted
                                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                                    : 'bg-slate-50/40 border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-[11px]">{perm.name}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{perm.description}</div>
                                  <div className="text-[9px] font-mono text-slate-400">{perm.code}</div>
                                </div>
                                <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center mt-0.5 ${
                                  isGranted ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                                }`}>
                                  {isGranted && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Select a role from the left list to view and configure its permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">SaaS PMS & Channel Manager Subscription Tier</h2>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              Active: {selectedPlan} Plan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starter */}
            <div className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
              selectedPlan === 'starter' ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white'
            }`}>
              <div>
                <div className="font-bold text-slate-900 text-sm">Starter PMS</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">$49 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 15 Rooms</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 2 OTA Channels</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Basic Tape Chart</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgradePlan('starter')}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedPlan === 'starter' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {selectedPlan === 'starter' ? 'Current Tier' : 'Select Starter'}
              </button>
            </div>

            {/* Pro */}
            <div className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
              selectedPlan === 'pro' ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Professional</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">POPULAR</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">$129 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 50 Rooms</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Unlimited OTAs & iCal</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Live 2-Way Sync Engine</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Multi-Role RBAC & Custom Roles</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgradePlan('pro')}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedPlan === 'pro' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {selectedPlan === 'pro' ? 'Current Tier' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* Enterprise */}
            <div className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
              selectedPlan === 'enterprise' ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white'
            }`}>
              <div>
                <div className="font-bold text-slate-900 text-sm">Enterprise Multi-Hotel</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">$299 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Unlimited Properties & Rooms</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Dedicated Direct Channel Gateway</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> White-label Guest Portal</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 24/7 Dedicated Support</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgradePlan('enterprise')}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedPlan === 'enterprise' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {selectedPlan === 'enterprise' ? 'Current Tier' : 'Upgrade Enterprise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF MEMBER */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="jordan@azurebay.com"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="Front Desk / F&B"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Property Access Scope</label>
                <select
                  value={newUserPropScope}
                  onChange={(e) => setNewUserPropScope(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="*">All Properties in Tenant (*)</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-semibold"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ROLE */}
      {showNewRoleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Custom Hotel Role</h3>
            <form onSubmit={handleCreateRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Role Title</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. VIP Concierge & Guest Experience"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Handles VIP check-ins, dining arrangements, and custom folios..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Default Landing Dashboard</label>
                <select
                  value={newRoleLanding}
                  onChange={(e) => setNewRoleLanding(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="dashboard">Operations Dashboard</option>
                  <option value="frontdesk">Front Desk Hub</option>
                  <option value="reservations">Reservations</option>
                  <option value="restaurant">Restaurant & Bistro POS</option>
                  <option value="kds">Kitchen Display (KDS)</option>
                  <option value="pool">Swimming Pool Hub</option>
                  <option value="inventory">Inventory & Stock</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-semibold"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
