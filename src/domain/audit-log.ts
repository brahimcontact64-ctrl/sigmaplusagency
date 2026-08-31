/**
 * System-wide security/admin audit trail — distinct from LeadActivity
 * (which is the per-lead business timeline). An action here may or may
 * not target a specific lead (e.g. "login" and "settings_updated"
 * don't); when it does, targetType/targetId point at it.
 */
export const AUDIT_ACTIONS = [
  "login",
  "login_failed",
  "logout",
  "status_changed",
  "note_added",
  "settings_updated",
  "password_changed",
  "article_created",
  "article_updated",
  "article_published",
  "article_archived",
  "article_slug_changed",
  "seo_recommendation_approved",
  "seo_recommendation_rejected",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditLogEntry = {
  id: string;
  actorId?: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};
