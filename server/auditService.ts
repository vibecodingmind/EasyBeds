import { UserRole, HotelAccessReasonCode } from '../src/types';

export interface ImpersonationActor {
  userId: string;
  name: string;
  email?: string;
  role: UserRole | string;
}

export interface ImpersonationTargetTenant {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
}

export interface ImpersonationAuditEvent {
  id: string;
  event: 'IMPERSONATION_STARTED' | 'IMPERSONATION_ENDED';
  actor: ImpersonationActor;
  targetTenant: ImpersonationTargetTenant;
  reason: string;
  reasonCode?: HotelAccessReasonCode | string;
  notes?: string;
  sessionId: string;
  timestamp: string;
  durationSeconds?: number;
  ipAddress: string;
}

/**
 * Enterprise Audit Service
 * Dedicated to tracking all platform administrative access and impersonation lifecycle events.
 */
export class AuditService {
  private static instance: AuditService;
  private impersonationLogs: ImpersonationAuditEvent[] = [];

  private constructor() {
    // Initialize with recent historical audit record for visibility
    this.impersonationLogs.push({
      id: 'imp-init-1',
      event: 'IMPERSONATION_ENDED',
      actor: {
        userId: 'usr-admin-1',
        name: 'Alexander Cross',
        email: 'alex.cross@vanguardpms.io',
        role: 'SUPER_ADMIN',
      },
      targetTenant: {
        id: 'tenant-azure',
        name: 'Azure Bay Grand Resort',
        slug: 'azure-bay',
        plan: 'enterprise',
      },
      reason: 'Technical Diagnostic & Error Resolution',
      reasonCode: 'troubleshooting',
      notes: 'Investigated and resolved OTA rate disparity on Expedia channel.',
      sessionId: 'has-prev-001',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      durationSeconds: 1420,
      ipAddress: '192.168.1.100',
    });
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an IMPERSONATION_STARTED audit event when Super Admin enters a hotel context.
   */
  public logImpersonationStarted(params: {
    actor: ImpersonationActor;
    targetTenant: ImpersonationTargetTenant;
    reason: string;
    reasonCode?: HotelAccessReasonCode | string;
    notes?: string;
    sessionId: string;
    ipAddress?: string;
  }): ImpersonationAuditEvent {
    const event: ImpersonationAuditEvent = {
      id: `imp-start-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event: 'IMPERSONATION_STARTED',
      actor: params.actor,
      targetTenant: params.targetTenant,
      reason: params.reason,
      reasonCode: params.reasonCode,
      notes: params.notes,
      sessionId: params.sessionId,
      timestamp: new Date().toISOString(),
      ipAddress: params.ipAddress || '127.0.0.1',
    };

    this.impersonationLogs.unshift(event);
    console.log(`[AuditService] [IMPERSONATION_STARTED] Actor: ${params.actor.name} (${params.actor.userId}) -> Target: ${params.targetTenant.name} (${params.targetTenant.id}) | Reason: ${params.reason} | Session: ${params.sessionId}`);
    return event;
  }

  /**
   * Log an IMPERSONATION_ENDED audit event when Super Admin exits hotel context.
   */
  public logImpersonationEnded(params: {
    actor: ImpersonationActor;
    targetTenant: ImpersonationTargetTenant;
    reason: string;
    reasonCode?: HotelAccessReasonCode | string;
    notes?: string;
    sessionId: string;
    durationSeconds?: number;
    ipAddress?: string;
  }): ImpersonationAuditEvent {
    const event: ImpersonationAuditEvent = {
      id: `imp-end-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event: 'IMPERSONATION_ENDED',
      actor: params.actor,
      targetTenant: params.targetTenant,
      reason: params.reason,
      reasonCode: params.reasonCode,
      notes: params.notes,
      sessionId: params.sessionId,
      timestamp: new Date().toISOString(),
      durationSeconds: params.durationSeconds,
      ipAddress: params.ipAddress || '127.0.0.1',
    };

    this.impersonationLogs.unshift(event);
    console.log(`[AuditService] [IMPERSONATION_ENDED] Actor: ${params.actor.name} exited ${params.targetTenant.name} | Session: ${params.sessionId} | Duration: ${params.durationSeconds || 0}s`);
    return event;
  }

  /**
   * Query all impersonation audit events.
   */
  public getImpersonationLogs(): ImpersonationAuditEvent[] {
    return [...this.impersonationLogs];
  }

  /**
   * Query impersonation events for a specific tenant or actor.
   */
  public getLogsForTenant(tenantId: string): ImpersonationAuditEvent[] {
    return this.impersonationLogs.filter(l => l.targetTenant.id === tenantId);
  }

  public getLogsForActor(actorUserId: string): ImpersonationAuditEvent[] {
    return this.impersonationLogs.filter(l => l.actor.userId === actorUserId);
  }
}

export const auditService = AuditService.getInstance();
