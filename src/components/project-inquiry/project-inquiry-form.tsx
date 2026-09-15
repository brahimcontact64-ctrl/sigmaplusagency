"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { projectInquirySchema, INQUIRY_SERVICES, URGENCY_LEVELS, PURCHASE_INTENT_LEVELS, type ProjectInquiryResult } from "@/domain/project-inquiry";
import { PROJECT_TIMELINES, type ProjectTimeline } from "@/domain/project-request";
import { BUDGET_RANGES } from "@/config/budget-ranges";
import { submitProjectInquiryForm } from "@/lib/actions/project-inquiry";
import { getClientAttribution } from "@/lib/attribution";
import { track } from "@/lib/integrations/analytics";
import { getOrCreateAnalyticsSessionId } from "@/lib/analytics/session-id";
import { persistShownCurrency, setCurrencyOverride } from "@/lib/pricing/currency-cookie-client";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { Button, ButtonLink } from "@/components/ui/button";
import { OptionCard } from "@/components/project-builder/option-card";
import { CurrencySwitcher } from "@/components/project-builder/currency-switcher";
import type { Locale } from "@/i18n/routing";
import type { CurrencyCode } from "@/lib/money";
import type { InquiryService, UrgencyLevel, PurchaseIntentLevel } from "@/domain/project-inquiry";

type FormLabels = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  serviceOptions: Record<InquiryService, string>;
  projectDescription: string;
  projectDescriptionHint: string;
  budget: string;
  desiredStart: string;
  urgency: string;
  urgencyOptions: Record<UrgencyLevel, string>;
  purchaseIntent: string;
  purchaseIntentOptions: Record<PurchaseIntentLevel, string>;
  submit: string;
  submitting: string;
  requiredError: string;
};

type SuccessCopy = { title: string; description: string; cta: string };
type ErrorCopy = {
  validation_error: string;
  rate_limited: string;
  db_unavailable: string;
  maintenance: string;
  unexpected: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service?: InquiryService;
  projectDescription: string;
  budgetRange?: string;
  desiredStart?: ProjectTimeline;
  urgency?: UrgencyLevel;
  purchaseIntent?: PurchaseIntentLevel;
  [HONEYPOT_FIELD_NAME]: string;
};

const EMPTY_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  projectDescription: "",
  [HONEYPOT_FIELD_NAME]: "",
};

const inputClass =
  "w-full rounded-xl border border-border bg-void px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-bright";

export function ProjectInquiryForm({
  locale,
  labels,
  success,
  errors: errorCopy,
  timelineLabels,
  budgetOptions,
  currencyLabel,
  currencyHint,
  whatsappFallbackUrl,
  initialCurrency = "EUR",
}: {
  locale: Locale;
  labels: FormLabels;
  success: SuccessCopy;
  errors: ErrorCopy;
  timelineLabels: Record<ProjectTimeline, string>;
  budgetOptions: { id: string; label: string }[];
  currencyLabel: string;
  currencyHint: string;
  whatsappFallbackUrl: string;
  initialCurrency?: CurrencyCode;
}) {
  const [data, setData] = useState<FormState>(EMPTY_STATE);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [result, setResult] = useState<ProjectInquiryResult | null>(null);
  const hasStarted = useRef(false);
  // One stable value per page load — the idempotency key for both
  // Sigma Plus's own double-submit guard and MagicFlux's
  // Idempotency-Key header (brief §7). A fresh page load gets a fresh
  // nonce; a rapid double-click of the same form submit does not.
  const [submissionNonce] = useState(() => crypto.randomUUID());

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function trackStartOnce() {
    if (hasStarted.current) return;
    hasStarted.current = true;
    track("contact_form_started");
  }

  function handleCurrencyChange(next: CurrencyCode) {
    setCurrency(next);
    setCurrencyOverride(next);
    persistShownCurrency(next);
  }

  const budgetCards = useMemo(
    () =>
      BUDGET_RANGES.map((range) => ({
        id: range.id,
        label: budgetOptions.find((o) => o.id === range.id)?.label ?? range.id,
      })),
    [budgetOptions],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);

    const candidate = {
      ...data,
      phone: data.phone || undefined,
      company: data.company || undefined,
      budgetCurrency: currency,
      locale,
      submissionNonce,
      ...getClientAttribution(),
    };

    const parsed = projectInquirySchema.safeParse(candidate);
    if (!parsed.success) {
      setResult({ success: false, error: "validation_error" });
      return;
    }

    setSubmitting(true);
    trackStartOnce();
    const res = await submitProjectInquiryForm(parsed.data, getOrCreateAnalyticsSessionId());
    setSubmitting(false);
    setResult(res);
    if (res.success) {
      track("contact_form_submitted");
    } else {
      track("contact_form_failed", { reason: res.error });
    }
  }

  if (result?.success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center" role="status" aria-live="polite">
        <h2 className="text-xl font-bold">{success.title}</h2>
        <p className="mt-1 font-mono text-sm text-primary-bright">{result.reference}</p>
        <p className="mt-2 text-sm text-muted">{success.description}</p>
        <ButtonLink
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
          className="mt-6"
          onClick={() => track("whatsapp_handoff_clicked", { context: "project_inquiry_form" })}
        >
          <MessageCircle className="size-5" />
          {success.cta}
        </ButtonLink>
      </div>
    );
  }

  const failure = result?.success === false ? result : null;
  const requiredError = (present: boolean) => (submitAttempted && !present ? labels.requiredError : undefined);

  return (
    <form onSubmit={onSubmit} onFocus={trackStartOnce} className="space-y-6" noValidate>
      {/* Honeypot — hidden via CSS, never type="hidden" (some bots skip those). */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input
            value={data[HONEYPOT_FIELD_NAME]}
            onChange={(e) => set(HONEYPOT_FIELD_NAME, e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={labels.name} error={requiredError(data.name.trim().length >= 2)}>
          <input value={data.name} onChange={(e) => set("name", e.target.value)} className={inputClass} autoComplete="name" />
        </Field>
        <Field label={labels.email} error={requiredError(/.+@.+\..+/.test(data.email))}>
          <input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className={inputClass} autoComplete="email" />
        </Field>
        <Field label={labels.phone}>
          <input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} autoComplete="tel" />
        </Field>
        <Field label={labels.company}>
          <input value={data.company} onChange={(e) => set("company", e.target.value)} className={inputClass} autoComplete="organization" />
        </Field>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-muted">{labels.service}</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INQUIRY_SERVICES.map((id) => (
            <OptionCard key={id} label={labels.serviceOptions[id]} selected={data.service === id} onToggle={() => set("service", id)} />
          ))}
        </div>
        {requiredError(Boolean(data.service)) && <p className="mt-1.5 text-xs text-red-400">{requiredError(Boolean(data.service))}</p>}
      </div>

      <Field label={labels.projectDescription} error={requiredError(data.projectDescription.trim().length >= 10)}>
        <p className="mb-1.5 text-xs text-muted">{labels.projectDescriptionHint}</p>
        <textarea value={data.projectDescription} onChange={(e) => set("projectDescription", e.target.value)} rows={5} className={inputClass} />
      </Field>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted">{labels.budget}</span>
          <CurrencySwitcher value={currency} onChange={handleCurrencyChange} label={currencyLabel} />
        </div>
        <p className="mb-2 text-xs text-muted">{currencyHint}</p>
        <div className="grid grid-cols-2 gap-3">
          {budgetCards.map((opt) => (
            <OptionCard
              key={opt.id}
              label={opt.label}
              selected={data.budgetRange === opt.id}
              onToggle={() => set("budgetRange", opt.id)}
              className={opt.id === "not-sure" ? "col-span-2" : undefined}
            />
          ))}
        </div>
        {requiredError(Boolean(data.budgetRange)) && <p className="mt-1.5 text-xs text-red-400">{requiredError(Boolean(data.budgetRange))}</p>}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-muted">{labels.desiredStart}</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROJECT_TIMELINES.map((id) => (
            <OptionCard key={id} label={timelineLabels[id]} selected={data.desiredStart === id} onToggle={() => set("desiredStart", id)} />
          ))}
        </div>
        {requiredError(Boolean(data.desiredStart)) && <p className="mt-1.5 text-xs text-red-400">{requiredError(Boolean(data.desiredStart))}</p>}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-muted">{labels.urgency}</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {URGENCY_LEVELS.map((id) => (
            <OptionCard key={id} label={labels.urgencyOptions[id]} selected={data.urgency === id} onToggle={() => set("urgency", id)} />
          ))}
        </div>
        {requiredError(Boolean(data.urgency)) && <p className="mt-1.5 text-xs text-red-400">{requiredError(Boolean(data.urgency))}</p>}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-muted">{labels.purchaseIntent}</span>
        <div className="grid grid-cols-2 gap-3">
          {PURCHASE_INTENT_LEVELS.map((id) => (
            <OptionCard key={id} label={labels.purchaseIntentOptions[id]} selected={data.purchaseIntent === id} onToggle={() => set("purchaseIntent", id)} />
          ))}
        </div>
        {requiredError(Boolean(data.purchaseIntent)) && <p className="mt-1.5 text-xs text-red-400">{requiredError(Boolean(data.purchaseIntent))}</p>}
      </div>

      {failure && (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-red-400/30 bg-red-400/5 p-4">
          <p className="text-sm text-red-400">{errorCopy[failure.error]}</p>
          {failure.error !== "validation_error" && (
            <ButtonLink
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="md"
              className="mt-3"
              onClick={() => track("whatsapp_handoff_clicked", { context: "project_inquiry_form_fallback" })}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </ButtonLink>
          )}
        </div>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          labels.submitting
        ) : failure ? (
          <>
            <RotateCcw className="size-4" />
            {labels.submit}
          </>
        ) : (
          labels.submit
        )}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
