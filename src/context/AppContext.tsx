import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Tenant, Property, UserRole, User, RoomType, Room, Reservation, ChannelConnection,
  ModuleDefinition, ModuleCode, ModuleLifecycleStatus, TenantEntitlement, SubscriptionAddon,
  UserRoleDefinition, PermissionDefinition, PermissionCode, UserScope,
  AuthorizationContextType, TemporaryHotelAccessSession, HotelAccessReasonCode
} from '../types';
import { apiRequest, setStoredToken } from '../lib/session';

export type ModuleStatus = ModuleLifecycleStatus | 'AVAILABLE' | 'LOCKED';

export interface ActiveModuleState extends ModuleDefinition {
  isEntitled: boolean;
  isEnabled: boolean;
  status: ModuleStatus;
  configuration?: Record<string, any>;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  properties: Property[];
  currentProperty: Property | null;
  setCurrentProperty: (property: Property) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  activeSubTab: string | null;
  setActiveSubTab: (subTab: string | null) => void;
  navigateWithSubTab: (view: string, subTab?: string | null) => void;
  toasts: Toast[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  refreshData: () => void;
  dataVersion: number;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;

  // Enterprise Identity, Roles, Permissions & Scopes
  currentUser: User | null;
  allUsers: User[];
  roles: UserRoleDefinition[];
  permissionsCatalog: PermissionDefinition[];
  userPermissions: PermissionCode[];
  userScope: UserScope | null;
  hasPermission: (perm: PermissionCode) => boolean;
  hasPropertyScope: (propertyId: string) => boolean;
  hasOutletScope: (outletId: string) => boolean;
  switchUser: (userOrId: User | string) => Promise<void>;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createCustomRole: (roleData: Omit<UserRoleDefinition, 'id'>) => Promise<UserRoleDefinition>;
  updateRole: (id: string, updates: Partial<UserRoleDefinition>) => Promise<UserRoleDefinition>;
  deleteRole: (id: string) => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  // SaaS Platform & Audited Hotel Context Access
  activeContext: 'PLATFORM' | 'HOTEL';
  authContextType: AuthorizationContextType;
  hotelAccessSession: TemporaryHotelAccessSession | null;
  isPlatformUser: boolean;
  isHotelAccessActive: boolean;
  enterHotelContext: (tenantId: string, reason: HotelAccessReasonCode, notes?: string) => Promise<boolean>;
  exitHotelContext: () => Promise<void>;
  enterHotel: (tenantId: string, reason?: HotelAccessReasonCode, notes?: string) => Promise<boolean>;
  exitHotel: () => Promise<void>;

  // Modular OS State & Helpers
  modules: ActiveModuleState[];
  entitlements: TenantEntitlement | null;
  addons: SubscriptionAddon[];
  isModuleEnabled: (code: string) => boolean;
  isModuleEntitled: (code: string) => boolean;
  enableModule: (code: string, applyTenantWide?: boolean) => Promise<void>;
  disableModule: (code: string, applyTenantWide?: boolean) => Promise<void>;
  updateModuleConfig: (code: string, config: Record<string, any>) => Promise<void>;
  subscribeAddon: (addonCode: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('PROPERTY_OWNER');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  const navigateWithSubTab = (view: string, subTab?: string | null) => {
    setActiveView(view);
    setActiveSubTab(subTab ?? null);
  };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Enterprise Security & Identity State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRoleDefinition[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionDefinition[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionCode[]>([]);
  const [userScope, setUserScope] = useState<UserScope | null>(null);

  // SaaS Platform vs Hotel Access Context
  const [hotelAccessSession, setHotelAccessSession] = useState<TemporaryHotelAccessSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Modular OS State
  const [modules, setModules] = useState<ActiveModuleState[]>([]);
  const [entitlements, setEntitlements] = useState<TenantEntitlement | null>(null);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);

  const isPlatformUser = currentUser?.tenantId === 'platform' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PLATFORM_ADMIN' || currentUser?.role === 'SUPPORT_AGENT' || currentUser?.role === 'FINANCE_ADMIN' || currentUser?.role === 'TECHNICAL_ADMIN';
  const isHotelAccessActive = !!hotelAccessSession;
  const authContextType: AuthorizationContextType = isHotelAccessActive
    ? 'HOTEL_ADMIN_ACCESS'
    : isPlatformUser
    ? 'PLATFORM'
    : 'HOTEL_STAFF';

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const extraHeaders: Record<string, string> = {
      ...(currentProperty?.id ? { 'x-property-id': currentProperty.id } : {}),
      ...(hotelAccessSession ? { 'x-hotel-access-session-id': hotelAccessSession.sessionId } : {}),
    };

    try {
      return await apiRequest(url, options, extraHeaders);
    } catch (e: any) {
      if (e.status === 401) {
        setCurrentUser(null);
        setAuthReady(true);
      }
      console.error('API Fetch Error:', e);
      throw e;
    }
  };

  const bootstrapSession = useCallback(async () => {
    try {
      const me = await apiRequest('/api/auth/me');
      if (!me?.user) {
        setCurrentUser(null);
        return;
      }

      const user: User = me.user;
      const isPlatform = user.tenantId === 'platform'
        || user.role === 'SUPER_ADMIN'
        || user.role === 'PLATFORM_ADMIN'
        || user.role === 'SUPPORT_AGENT'
        || user.role === 'FINANCE_ADMIN'
        || user.role === 'TECHNICAL_ADMIN';

      const [tenantsData, permsData, rolesData, usersData, sessionData] = await Promise.all([
        apiRequest('/api/tenants'),
        apiRequest('/api/auth/permissions').catch(() => []),
        apiRequest('/api/auth/roles').catch(() => []),
        apiRequest('/api/users').catch(() => []),
        isPlatform
          ? apiRequest('/api/platform/hotel-access/current').catch(() => ({ session: null }))
          : Promise.resolve({ session: null }),
      ]);

      if (Array.isArray(permsData)) setPermissionsCatalog(permsData);
      if (Array.isArray(rolesData)) setRoles(rolesData);
      if (Array.isArray(usersData)) setAllUsers(usersData);
      if (Array.isArray(tenantsData)) setTenants(tenantsData);

      if (sessionData?.session) {
        setHotelAccessSession(sessionData.session);
        const sessionTenant = tenantsData.find((t: Tenant) => t.id === sessionData.session.targetTenantId);
        if (sessionTenant) setCurrentTenant(sessionTenant);
      } else if (!isPlatform && tenantsData.length > 0) {
        setCurrentTenant(tenantsData.find((t: Tenant) => t.id === user.tenantId) || tenantsData[0]);
      }

      switchUserInternal(user, rolesData, permsData);
      if (sessionData?.session) {
        setActiveView('dashboard');
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setStoredToken(data.token);
    setAuthReady(true);
    await bootstrapSession();
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // still clear local session
    }
    setStoredToken(null);
    setCurrentUser(null);
    setHotelAccessSession(null);
    setTenants([]);
    setProperties([]);
    setCurrentTenant(null);
    setCurrentProperty(null);
  };

  // When tenant changes, fetch properties and reload roles & users
  useEffect(() => {
    if (!currentTenant || !currentUser) return;
    apiFetch('/api/properties')
      .then(props => {
        setProperties(props);
        if (props.length > 0) {
          setCurrentProperty(props[0]);
        } else {
          setCurrentProperty(null);
        }
      })
      .catch(err => console.error('Failed to load properties', err));

    apiFetch('/api/auth/roles')
      .then(r => setRoles(r))
      .catch(err => console.error('Failed to load roles', err));

    apiFetch('/api/users')
      .then(u => setAllUsers(u))
      .catch(err => console.error('Failed to load users', err));
  }, [currentTenant?.id]);

  // Load modules, entitlements, and addons whenever tenant or property or dataVersion changes
  useEffect(() => {
    if (!currentTenant) return;

    Promise.all([
      apiFetch('/api/modules').catch(() => []),
      apiFetch('/api/modules/entitlements').catch(() => null),
      apiFetch('/api/modules/addons').catch(() => []),
    ]).then(([modsData, entData, addonsData]) => {
      if (Array.isArray(modsData)) setModules(modsData);
      if (entData) setEntitlements(entData);
      if (Array.isArray(addonsData)) setAddons(addonsData);
    });
  }, [currentTenant?.id, currentProperty?.id, dataVersion]);

  // Switch active persona / user
  const switchUserInternal = (user: User, currentRoles: UserRoleDefinition[] = roles, permsCat: PermissionDefinition[] = permissionsCatalog) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setUserScope(user.scope || { tenantId: user.tenantId, propertyIds: ['*'], outletIds: ['*'] });

    const isPlatform = user.tenantId === 'platform' || user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN' || user.role === 'SUPPORT_AGENT' || user.role === 'FINANCE_ADMIN' || user.role === 'TECHNICAL_ADMIN';

    if (isPlatform) {
      const roleDef = currentRoles.find(r => r.id === user.roleId || r.code === user.role);
      const rolePerms = roleDef ? roleDef.permissions : ['platform.overview.view', 'platform.tenants.view', 'platform.hotel_access', 'platform.audit_logs.view'];
      setUserPermissions(user.role === 'SUPER_ADMIN' ? (permsCat.length > 0 ? permsCat.map(p => p.code) : ['*']) : rolePerms);

      if (!hotelAccessSession) {
        setActiveView('platform-dashboard');
      }
      return;
    }

    const roleDef = currentRoles.find(r => r.id === user.roleId || r.code === user.role);
    const rolePerms = roleDef ? roleDef.permissions : [];
    const directPerms = user.permissions || [];
    const combinedPerms = Array.from(new Set([...rolePerms, ...directPerms]));
    setUserPermissions(combinedPerms);

    // Set appropriate default landing view for this role if available
    if (roleDef && roleDef.defaultLandingView) {
      setActiveView(roleDef.defaultLandingView);
    } else {
      setActiveView('dashboard');
    }
  };

  const switchUser = async (_userOrId: User | string) => {
    addToast('info', 'Identity is bound to your signed session. Sign out to switch users.');
  };

  // Enter Hotel Context (Audited, Explicit)
  const enterHotelContext = async (targetTenantId: string, reason: HotelAccessReasonCode, notes?: string): Promise<boolean> => {
    try {
      const targetTenant = tenants.find(t => t.id === targetTenantId);
      if (!targetTenant) {
        throw new Error(`Target hotel tenant '${targetTenantId}' not found.`);
      }

      const res = await apiFetch('/api/platform/hotel-access/enter', {
        method: 'POST',
        body: JSON.stringify({
          targetTenantId,
          reason,
          notes,
        }),
      });

      setHotelAccessSession(res);
      setCurrentTenant(targetTenant);
      setActiveView('dashboard');
      addToast('success', `Entered Hotel Context: ${targetTenant.name} (Audited Session ID: ${res.sessionId.slice(0, 14)}...)`);
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to enter hotel context');
      return false;
    }
  };

  // Exit Hotel Context (Restore Platform Context)
  const exitHotelContext = async (): Promise<void> => {
    try {
      await apiFetch('/api/platform/hotel-access/exit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: hotelAccessSession?.sessionId,
        }),
      });

      const previousHotelName = hotelAccessSession?.targetTenantName || 'Hotel';
      setHotelAccessSession(null);
      setActiveView('platform-dashboard');
      addToast('info', `Exited ${previousHotelName} operational environment. Returned to SaaS Platform.`);
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to exit hotel context');
      setHotelAccessSession(null);
      setActiveView('platform-dashboard');
    }
  };

  // Permission and scope check helpers
  const hasPermission = (permission: PermissionCode): boolean => {
    if (!currentUser || !currentUser.active) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (userPermissions.includes('*') || userPermissions.includes(permission)) return true;
    return false;
  };

  const hasPropertyScope = (propertyId: string): boolean => {
    if (!currentUser || !currentUser.active) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (!userScope || !userScope.propertyIds) return true;
    return userScope.propertyIds.includes('*') || userScope.propertyIds.includes(propertyId);
  };

  const hasOutletScope = (outletId: string): boolean => {
    if (!currentUser || !currentUser.active) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PROPERTY_OWNER') return true;
    if (!userScope || !userScope.outletIds) return true;
    return userScope.outletIds.includes('*') || userScope.outletIds.includes(outletId);
  };

  // Role and user management API actions
  const createCustomRole = async (roleData: Omit<UserRoleDefinition, 'id'>): Promise<UserRoleDefinition> => {
    try {
      const res = await apiFetch('/api/auth/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      });
      setRoles(prev => [...prev, res]);
      addToast('success', `Created custom role '${res.name}' with ${res.permissions.length} permissions.`);
      refreshData();
      return res;
    } catch (e: any) {
      addToast('error', e.message || 'Failed to create role');
      throw e;
    }
  };

  const updateRole = async (id: string, updates: Partial<UserRoleDefinition>): Promise<UserRoleDefinition> => {
    try {
      const res = await apiFetch(`/api/auth/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setRoles(prev => prev.map(r => r.id === id ? res : r));
      addToast('success', `Updated role '${res.name}' successfully.`);
      refreshData();
      return res;
    } catch (e: any) {
      addToast('error', e.message || 'Failed to update role');
      throw e;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await apiFetch(`/api/auth/roles/${id}`, { method: 'DELETE' });
      setRoles(prev => prev.filter(r => r.id !== id));
      addToast('info', 'Custom role deleted.');
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to delete role');
      throw e;
    }
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      setAllUsers(prev => [...prev, res]);
      addToast('success', `Added staff user ${res.name} (${res.email}).`);
      refreshData();
      return res;
    } catch (e: any) {
      addToast('error', e.message || 'Failed to create user');
      throw e;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setAllUsers(prev => prev.map(u => u.id === id ? res : u));
      if (currentUser?.id === id) {
        switchUserInternal(res, roles, permissionsCatalog);
      }
      addToast('success', `Updated user ${res.name}.`);
      refreshData();
      return res;
    } catch (e: any) {
      addToast('error', e.message || 'Failed to update user');
      throw e;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u));
      addToast('info', 'User account deactivated.');
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to delete user');
      throw e;
    }
  };

  // Helper module check functions
  const isModuleEnabled = (code: string): boolean => {
    const mod = modules.find(m => m.code === code);
    return mod ? mod.isEnabled : false;
  };

  const isModuleEntitled = (code: string): boolean => {
    const mod = modules.find(m => m.code === code);
    return mod ? mod.isEntitled : false;
  };

  const enableModule = async (code: string, applyTenantWide: boolean = false) => {
    try {
      const res = await apiFetch('/api/modules/enable', {
        method: 'POST',
        body: JSON.stringify({ moduleCode: code, applyTenantWide }),
      });
      addToast('success', res.message || `Module '${code}' enabled`);
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || `Failed to enable module '${code}'`);
      throw err;
    }
  };

  const disableModule = async (code: string, applyTenantWide: boolean = false) => {
    try {
      const res = await apiFetch('/api/modules/disable', {
        method: 'POST',
        body: JSON.stringify({ moduleCode: code, applyTenantWide }),
      });
      addToast('info', res.message || `Module '${code}' disabled`);
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || `Failed to disable module '${code}'`);
      throw err;
    }
  };

  const updateModuleConfig = async (code: string, configuration: Record<string, any>) => {
    try {
      await apiFetch('/api/modules/config', {
        method: 'POST',
        body: JSON.stringify({ moduleCode: code, configuration }),
      });
      addToast('success', `Settings for '${code}' updated successfully.`);
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || `Failed to update configuration`);
      throw err;
    }
  };

  const subscribeAddon = async (addonCode: string) => {
    try {
      const res = await apiFetch('/api/modules/addons/subscribe', {
        method: 'POST',
        body: JSON.stringify({ addonCode }),
      });
      addToast('success', `Subscribed to ${res.addon.name}. Modules activated!`);
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || `Failed to subscribe to addon`);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        tenants,
        currentTenant,
        setCurrentTenant,
        properties,
        currentProperty,
        setCurrentProperty,
        currentRole,
        setCurrentRole,
        activeView,
        setActiveView,
        activeSubTab,
        setActiveSubTab,
        navigateWithSubTab,
        toasts,
        addToast,
        removeToast,
        refreshData,
        dataVersion,
        apiFetch,
        currentUser,
        allUsers,
        roles,
        permissionsCatalog,
        userPermissions,
        userScope,
        hasPermission,
        hasPropertyScope,
        hasOutletScope,
        switchUser,
        authReady,
        login,
        logout,
        createCustomRole,
        updateRole,
        deleteRole,
        createUser,
        updateUser,
        deleteUser,
        activeContext: isPlatformUser && !isHotelAccessActive ? 'PLATFORM' : 'HOTEL',
        authContextType,
        hotelAccessSession,
        isPlatformUser,
        isHotelAccessActive,
        enterHotelContext,
        exitHotelContext,
        enterHotel: enterHotelContext,
        exitHotel: exitHotelContext,
        modules,
        entitlements,
        addons,
        isModuleEnabled,
        isModuleEntitled,
        enableModule,
        disableModule,
        updateModuleConfig,
        subscribeAddon,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


