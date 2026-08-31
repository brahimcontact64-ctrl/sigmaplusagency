/**
 * Minimal RBAC foundation (see master plan Phase 5). Only OWNER and
 * ADMIN are actually assignable today via the seed script — SALES,
 * EDITOR, VIEWER exist so future role-gated features don't require a
 * schema/migration change, but nothing creates them yet.
 */
export const ADMIN_ROLES = ["OWNER", "ADMIN", "SALES", "EDITOR", "VIEWER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Roles allowed to change lead status / add notes — everyone with real admin access. */
export const CRM_EDITOR_ROLES: AdminRole[] = ["OWNER", "ADMIN", "SALES", "EDITOR"];

/** Settings mutate shared business configuration — restricted to owners. */
export const SETTINGS_EDITOR_ROLES: AdminRole[] = ["OWNER"];

/**
 * Insights/CMS editorial permissions (Phase 8 §56). OWNER/ADMIN have
 * full content control; EDITOR is the role this system finally gives
 * real meaning to (previously defined but unused since Phase 5) —
 * create/edit/review/publish. SALES explicitly does NOT get editorial
 * publishing rights even though it can act on leads (`CRM_EDITOR_ROLES`
 * above) — those are different domains of trust. VIEWER never mutates
 * anything; every role can at least *view* the admin content list
 * (enforced by giving these constants to mutation actions only, never
 * to the list/detail read paths).
 */
export const CONTENT_EDITOR_ROLES: AdminRole[] = ["OWNER", "ADMIN", "EDITOR"];

/** Approving/rejecting an SEO recommendation is a business-strategy decision — kept tighter than general content editing. */
export const SEO_EDITOR_ROLES: AdminRole[] = ["OWNER", "ADMIN"];

/**
 * Analytics/Growth dashboard exposes aggregate conversion intelligence
 * derived from real lead and session data — never public, and kept
 * tighter than general CRM access (Phase 9 §65). SALES/EDITOR/VIEWER
 * don't get it today; a read-only VIEWER-level view is a plausible
 * future addition, not built until there's an actual VIEWER user.
 */
export const ANALYTICS_VIEWER_ROLES: AdminRole[] = ["OWNER", "ADMIN"];

export type AdminUser = {
  id: string;
  email: string;
  emailNormalized: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

/** The authenticated actor shape carried through the session and passed explicitly to services — never re-derived from client input. */
export type AdminActor = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};
