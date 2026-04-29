import { pool } from './db.service.js';

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (
  action: string,
  resourceType: string,
  resourceId: string,
  details: string,
  severity: AuditSeverity = AuditSeverity.INFO,
  context: AuditContext = {}
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, user_name, user_email, action, 
        resource_type, resource_id, target_type, target_id,
        details, severity, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        context.userId || null,
        context.userName || 'System',
        context.userEmail || null,
        action,
        resourceType,
        resourceId,
        resourceType, // For backward compatibility if any query uses target_type
        resourceId,   // For backward compatibility if any query uses target_id
        details,
        severity,
        context.ipAddress || null,
        context.userAgent || null
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw, we don't want audit failure to break the main action
  }
};
