/**
 * Provider-agnostic analytics. No provider is wired up yet — the
 * console adapter is the honest placeholder until GA4/Meta/etc.
 * credentials exist, matching the pattern already used for the contact
 * form's "no CRM yet" server action. Swap `activeAdapter` when a real
 * provider is configured; nothing calling `track()` needs to change.
 *
 * Hard rule enforced by the type signature: event payloads are a flat
 * map of primitives (ids, counts, booleans) — never email, phone,
 * message text, or name. If you need to pass a lead reference, use the
 * public `SP-XXXXXX` reference, never a database ID.
 */
export const ANALYTICS_EVENTS = [
  "project_builder_viewed",
  "project_builder_started",
  "project_builder_step_completed",
  "project_builder_abandoned",
  "project_builder_completed",
  "lead_created",
  "whatsapp_handoff_clicked",
  "contact_form_submitted",
  "contact_form_failed",
  "ai_consultant_viewed",
  "ai_consultation_started",
  "ai_message_sent",
  "ai_qualification_updated",
  "ai_builder_handoff",
  "ai_contact_requested",
  "ai_error",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
}

const consoleAdapter: AnalyticsAdapter = {
  track(event, props) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[analytics]", event, props ?? {});
    }
  },
};

const activeAdapter: AnalyticsAdapter = consoleAdapter;

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  activeAdapter.track(event, props);
}
