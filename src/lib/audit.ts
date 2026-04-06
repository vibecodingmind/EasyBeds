import { db } from '@/lib/db';

type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'logout'
  | 'payment'
  | 'refund'
  | 'sync'
  | 'export'
  | 'import';

interface LogActionInput {
  hotelId: string;
  userId?: string | null;
  action: AuditActionType;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  description?: string | null;
}

/**
 * Log an action to the audit trail.
 * This is a fire-and-forget helper — errors are logged to console but not thrown.
 */
export async function logAction(input: LogActionInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        hotelId: input.hotelId,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        oldValue: input.oldValue !== undefined ? JSON.stringify(input.oldValue) : null,
        newValue: input.newValue !== undefined ? JSON.stringify(input.newValue) : null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        description: input.description || null,
      },
    });
  } catch (error) {
    console.error('[audit] Failed to log action:', error);
  }
}
