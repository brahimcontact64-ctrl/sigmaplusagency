/**
 * Minimal, typed, server-authoritative feature configuration (Phase
 * 10 §31) — not a feature-flag platform. Every flag here already has
 * its own real, honest source of truth elsewhere (an env var, a
 * provider's own availability check); this module is a single place
 * to *read* that combined picture, for Admin visibility and for the
 * one flag that needs active enforcement (`maintenanceMode`). Nothing
 * here is client-overridable — a request can never toggle its own
 * feature set.
 */
export type FeatureFlags = {
  aiConsultantEnabled: boolean;
  clientConfirmationEmailEnabled: boolean;
  externalAnalyticsEnabled: boolean;
  maintenanceMode: boolean;
};

/**
 * When true, new lead submissions (Contact, Project Builder, AI
 * proposal capture) and AI consultation are disabled — the rest of
 * the public site keeps serving normally, and Admin access is never
 * affected (this flag is never checked anywhere in `src/app/admin`).
 * Off by default; must be explicitly set to the string "true".
 */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

/**
 * Async, and dynamically imports `get-provider` (which has `import
 * "server-only"`), so this module stays importable from Vitest for the
 * pure `isMaintenanceModeEnabled()`/individual-flag checks without
 * that dependency ever needing to resolve.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const { getAIProvider } = await import("@/lib/ai/get-provider");
  return {
    aiConsultantEnabled: getAIProvider() !== null,
    clientConfirmationEmailEnabled: process.env.NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL === "true",
    externalAnalyticsEnabled: Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID),
    maintenanceMode: isMaintenanceModeEnabled(),
  };
}
