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
