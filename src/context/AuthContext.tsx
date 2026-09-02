import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User, UserRole, UserRoleDefinition, PermissionDefinition,
  PermissionCode, UserScope, Tenant, Property,
  TemporaryHotelAccessSession, HotelAccessReasonCode,
  AuthorizationContextType
} from '../types';

export interface PlatformContextState {
  isPlatformUser: boolean;
  isSuperAdmin: boolean;
  actor: User | null;
  platformRole: string | null;
  globalScope: boolean;
}

export interface HotelContextState {
  isInHotel: boolean;
  activeTenant: Tenant | null;
  activeProperty: Property | null;
  session: TemporaryHotelAccessSession | null;
  isSuperAdminHotelAccess: boolean;
  reason?: string;
  reasonCode?: string;
  startedAt?: string;
}

export interface AuthContextValue {
  // Environment & Context Separation
  activeContext: 'PLATFORM' | 'HOTEL';
  authContextType: AuthorizationContextType;
  platformContext: PlatformContextState;
  hotelContext: HotelContextState;

  // Identity State
  currentUser: User | null;
  allUsers: User[];
  currentRole: UserRole;
  userPermissions: PermissionCode[];
  userScope: UserScope | null;

  // Environment Switching Functions
  enterHotel: (tenantId: string, reason?: HotelAccessReasonCode, notes?: string) => Promise<boolean>;
  exitHotel: () => Promise<void>;
  switchUser: (userOrId: User | string) => Promise<void>;

  // Authorization Checks
  hasPermission: (permission: PermissionCode) => boolean;
  hasPropertyScope: (propertyId: string) => boolean;
  hasOutletScope: (outletId: string) => boolean;

  // Reference lists
  roles: UserRoleDefinition[];
  permissionsCatalog: PermissionDefinition[];
  tenants: Tenant[];
  properties: Property[];
  currentProperty: Property | null;
  setCurrentProperty: (property: Property) => void;
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  hotelAccessSession: TemporaryHotelAccessSession | null;
  isHotelAccessActive: boolean;
  isPlatformUser: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onNavigate?: (view: string) => void;
  onDataRefresh?: () => void;
}> = ({ children, onToast, onNavigate, onDataRefresh }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRoleDefinition[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionDefinition[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionCode[]>([]);
  const [userScope, setUserScope] = useState<UserScope | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('PROPERTY_OWNER');

  // Super Admin Hotel Access Session
  const [hotelAccessSession, setHotelAccessSession] = useState<TemporaryHotelAccessSession | null>(null);

  const isPlatformUser = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.tenantId === 'platform' ||
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'PLATFORM_ADMIN' ||
      currentUser.role === 'SUPPORT_AGENT' ||
      currentUser.role === 'FINANCE_ADMIN' ||
      currentUser.role === 'TECHNICAL_ADMIN'
    );
  }, [currentUser]);

  const isHotelAccessActive = !!hotelAccessSession;

  // Active Context resolution:
  // If Super Admin is NOT currently in an audited hotel access session, and is a platform user -> 'PLATFORM'
  // Otherwise -> 'HOTEL'
  const activeContext: 'PLATFORM' | 'HOTEL' = useMemo(() => {
    if (isPlatformUser && !isHotelAccessActive) {
      return 'PLATFORM';
    }
    return 'HOTEL';
  }, [isPlatformUser, isHotelAccessActive]);

  const authContextType: AuthorizationContextType = useMemo(() => {
    if (isHotelAccessActive) return 'HOTEL_ADMIN_ACCESS';
    if (isPlatformUser) return 'PLATFORM';
    return 'HOTEL_STAFF';
  }, [isHotelAccessActive, isPlatformUser]);

  // Platform Context State
  const platformContext: PlatformContextState = useMemo(() => ({
    isPlatformUser,
    isSuperAdmin: currentUser?.role === 'SUPER_ADMIN',
    actor: currentUser,
    platformRole: currentUser?.role || null,
    globalScope: isPlatformUser && !isHotelAccessActive,
  }), [isPlatformUser, currentUser, isHotelAccessActive]);

  // Hotel Context State
  const hotelContext: HotelContextState = useMemo(() => ({
    isInHotel: activeContext === 'HOTEL',
    activeTenant: currentTenant,
    activeProperty: currentProperty,
    session: hotelAccessSession,
    isSuperAdminHotelAccess: isHotelAccessActive,
    reason: hotelAccessSession?.reasonLabel,
    reasonCode: hotelAccessSession?.reason,
    startedAt: hotelAccessSession?.startedAt,
  }), [activeContext, currentTenant, currentProperty, hotelAccessSession, isHotelAccessActive]);

  // API fetch helper
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const activeTenantId = hotelAccessSession ? hotelAccessSession.targetTenantId : (currentTenant?.id || 'tenant-azure');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
      'x-property-id': currentProperty?.id || 'prop-azure-bay',
      'x-user-id': currentUser?.id || 'usr-admin-1',
      ...(hotelAccessSession ? { 'x-hotel-access-session-id': hotelAccessSession.sessionId } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, [hotelAccessSession, currentTenant, currentProperty, currentUser]);

  // Switch identity / persona internally
  const switchUserInternal = useCallback((
    user: User,
    loadedRoles: UserRoleDefinition[],
    loadedPerms: PermissionDefinition[]
  ) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setUserScope(user.scope || null);

    if (user.role === 'SUPER_ADMIN') {
      setUserPermissions(['*' as PermissionCode]);
      return;
    }

    const roleDef = loadedRoles.find(r => r.id === user.roleId || r.code === user.role);
    if (roleDef) {
      setUserPermissions(roleDef.permissions);
    } else {
      const defaultRole = loadedRoles.find(r => r.code === user.role);
      if (defaultRole) {
        setUserPermissions(defaultRole.permissions);
      } else {
        setUserPermissions(['pms.tape_chart.view', 'reservations.view', 'pms.rooms.view']);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [usersData, rolesData, permsData, tenantsData, propsData] = await Promise.all([
          fetch('/api/users').then(r => r.json()),
          fetch('/api/auth/roles').then(r => r.json()),
          fetch('/api/auth/permissions').then(r => r.json()),
          fetch('/api/tenants').then(r => r.json()),
          fetch('/api/properties').then(r => r.json()),
        ]);

        setAllUsers(usersData);
        setRoles(rolesData);
        setPermissionsCatalog(permsData);
        setTenants(tenantsData);

        if (tenantsData.length > 0) {
          setCurrentTenant(tenantsData[0]);
        }
        if (propsData.length > 0) {
          setProperties(propsData);
          setCurrentProperty(propsData[0]);
        }

        // Default to Super Admin (Platform user) to showcase dual-context architecture
        const superAdmin = usersData.find((u: User) => u.role === 'SUPER_ADMIN') || usersData[0];
        if (superAdmin) {
          switchUserInternal(superAdmin, rolesData, permsData);
        }
      } catch (err) {
        console.error('Failed to initialize AuthContext', err);
      }
    };

    initAuth();
  }, [switchUserInternal]);

  // Switch user
  const switchUser = async (userOrId: User | string) => {
    let targetUser: User | undefined;
    if (typeof userOrId === 'string') {
      targetUser = allUsers.find(u => u.id === userOrId);
    } else {
      targetUser = userOrId;
    }

    if (!targetUser) return;
    switchUserInternal(targetUser, roles, permissionsCatalog);

    // If switching from or to a platform user while in an active hotel session, handle gracefully
    if (targetUser.tenantId !== 'platform' && targetUser.role !== 'SUPER_ADMIN') {
      // Switching to a regular hotel user: clear any active super admin session
      setHotelAccessSession(null);
      const userTenant = tenants.find(t => t.id === targetUser?.tenantId);
      if (userTenant) setCurrentTenant(userTenant);
      onNavigate?.('dashboard');
    } else {
      // Switching to Super Admin / platform user
      if (!hotelAccessSession) {
        onNavigate?.('platform-admin');
      }
    }

    onToast?.('info', `Switched active identity to ${targetUser.name} (${targetUser.role})`);
  };

  // Enter Hotel (Audited, switches from PlatformContext to HotelContext)
  const enterHotel = async (
    targetTenantId: string,
    reason: HotelAccessReasonCode = 'customer_support',
    notes?: string
  ): Promise<boolean> => {
    try {
      const targetTenant = tenants.find(t => t.id === targetTenantId);
      if (!targetTenant) {
        throw new Error(`Target hotel tenant '${targetTenantId}' not found.`);
      }

      const res: TemporaryHotelAccessSession = await apiFetch('/api/platform/hotel-access/enter', {
        method: 'POST',
        body: JSON.stringify({
          targetTenantId,
          reason,
          notes,
        }),
      });

      setHotelAccessSession(res);
      setCurrentTenant(targetTenant);

      // Find primary property for this hotel
      const tenantProps = properties.filter(p => p.tenantId === targetTenantId);
      if (tenantProps.length > 0) {
        setCurrentProperty(tenantProps[0]);
      }

      onNavigate?.('dashboard');
      onToast?.('success', `Entered Hotel: ${targetTenant.name} (Audited Session: ${res.sessionId.slice(0, 14)}...)`);
      onDataRefresh?.();
      return true;
    } catch (err: any) {
      onToast?.('error', err.message || 'Failed to enter hotel');
      return false;
    }
  };

  // Exit Hotel (Terminates session and returns to PlatformContext)
  const exitHotel = async (): Promise<void> => {
    try {
      if (hotelAccessSession) {
        await apiFetch('/api/platform/hotel-access/exit', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: hotelAccessSession.sessionId,
          }),
        });
      }

      const prevHotelName = hotelAccessSession?.targetTenantName || currentTenant?.name || 'Hotel';
      setHotelAccessSession(null);
      onNavigate?.('platform-admin');
      onToast?.('info', `Exited ${prevHotelName} operational context. Returned to SaaS Platform.`);
      onDataRefresh?.();
    } catch (err: any) {
      setHotelAccessSession(null);
      onNavigate?.('platform-admin');
      onToast?.('error', err.message || 'Failed to exit hotel context');
    }
  };

  // Permission and scope checks
  const hasPermission = (permission: PermissionCode): boolean => {
    if (!currentUser || !currentUser.active) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (userPermissions.includes('*' as PermissionCode) || userPermissions.includes(permission)) return true;
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

  const value: AuthContextValue = {
    activeContext,
    authContextType,
    platformContext,
    hotelContext,
    currentUser,
    allUsers,
    currentRole,
    userPermissions,
    userScope,
    enterHotel,
    exitHotel,
    switchUser,
    hasPermission,
    hasPropertyScope,
    hasOutletScope,
    roles,
    permissionsCatalog,
    tenants,
    properties,
    currentProperty,
    setCurrentProperty,
    currentTenant,
    setCurrentTenant,
    hotelAccessSession,
    isHotelAccessActive,
    isPlatformUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
