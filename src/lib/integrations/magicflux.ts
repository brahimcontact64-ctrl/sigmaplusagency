import type { MagicFluxLeadPayload } from "@/domain/project-inquiry";

/**
 * Secure server-side bridge to the certified, already-deployed
 * MagicFlux webhook — the ONLY place this codebase ever talks to
 * MagicFlux. Never imported by a client component; the webhook URL and
 * secret are read from `process.env` only, never passed to or through
 * any client-rendered code.
 *
 * Real, verified auth contract (inspected directly from the deployed
 * MagicFlux codebase — `lib/runtime/webhook-security.ts` and
 * `app/api/workflows/[id]/webhook/route.ts` — rather than assumed):
 * every webhook-triggered MagicFlux workflow has its own per-workflow
 * secret, checked either as a full HMAC-SHA256 request signature or as
 * a simple static shared-secret header,
 * `X-MagicFlux-Webhook-Secret: <secret>`. MagicFlux's own code
 * explicitly documents the static-secret path as "sufficient on its
 * own... the accepted tradeoff for a credential simple enough for a
 * typical external caller" (a script, Zapier, a no-code tool) — exactly
 * Sigma Plus's situation here, so that's what this bridge uses. No
 * HMAC signing is implemented (not needed for this auth path — see the
 * final report for how to move to HMAC later if ever required).
 *
 * MagicFlux also natively deduplicates by a generic `Idempotency-Key`
 * header if one is supplied (`lib/runtime/idempotency.ts` in its
 * codebase) — this bridge always sends one, so a retried/duplicated
 * delivery of the same logical submission never triggers a second AI
 * classification run, Airtable row, or Slack/Gmail notification on
 * MagicFlux's side.
 */

const STATIC_SECRET_HEADER = "X-MagicFlux-Webhook-Secret";

export type MagicFluxForwardOutcome = "SENT" | "SKIPPED" | "FAILED";

export type MagicFluxForwardResult = {
  outcome: MagicFluxForwardOutcome;
  /** MagicFlux's own execution id, when available — safe to persist (not PII, not a secret) for internal traceability, e.g. "did this lead actually reach MagicFlux". */
  executionId?: string;
  /** A short, safe classifier only — never a raw response body (which could itself contain request-echoed data) and never any header value. */
  errorReason?: string;
};

function getWebhookUrl(): string | undefined {
  return process.env.MAGICFLUX_WEBHOOK_URL;
}
function getWebhookSecret(): string | undefined {
  return process.env.MAGICFLUX_WEBHOOK_SECRET;
}

export function isMagicFluxConfigured(): boolean {
  return Boolean(getWebhookUrl() && getWebhookSecret());
}

/**
 * Never throws. Never blocks or reverses the caller's own (already
 * successful) lead persistence — this is called strictly after that,
 * exactly like the existing email-notification services, and its
 * result is only ever used for internal logging/traceability, never
 * surfaced to the customer (§6: MagicFlux/Airtable/internal workflow
 * details must never reach the customer-facing response).
 */
export async function forwardLeadToMagicFlux(payload: MagicFluxLeadPayload, idempotencyKey: string): Promise<MagicFluxForwardResult> {
  const url = getWebhookUrl();
  const secret = getWebhookSecret();
  if (!url || !secret) return { outcome: "SKIPPED" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [STATIC_SECRET_HEADER]: secret,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
      // A qualification webhook must never hold a customer-facing
      // submission open indefinitely — MagicFlux's own route dispatches
      // asynchronously and responds quickly (202) by design, so a
      // generous-but-bounded timeout only guards against a genuine
      // network hang, not normal processing time.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Never log the response body: MagicFlux's error responses can
      // echo back request details, and this codebase's discipline
      // (see lead-service.ts's toFailure) is to log only a safe
      // classifier in a context that might be a shared log sink.
      return { outcome: "FAILED", errorReason: `http_${response.status}` };
    }

    const body = (await response.json().catch(() => ({}))) as { executionId?: unknown };
    return { outcome: "SENT", executionId: typeof body.executionId === "string" ? body.executionId : undefined };
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network_error";
    console.error("[magicflux] webhook forward failed (non-fatal — lead already persisted):", reason);
    return { outcome: "FAILED", errorReason: reason };
  }
}
