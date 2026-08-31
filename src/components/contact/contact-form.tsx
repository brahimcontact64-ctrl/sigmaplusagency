"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, RotateCcw } from "lucide-react";
import { contactFormSchema, type ContactFormInput, type ContactFormResult } from "@/domain/contact";
import { submitContactForm } from "@/lib/actions/contact";
import { getClientAttribution } from "@/lib/attribution";
import { track } from "@/lib/integrations/analytics";
import { getOrCreateAnalyticsSessionId } from "@/lib/analytics/session-id";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { Button, ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

type FormLabels = {
  name: string;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
  submit: string;
  submitting: string;
  projectTypeOptions: string[];
  budgetOptions: string[];
};

type SuccessCopy = { title: string; description: string; cta: string };

type ErrorCopy = {
  validation_error: string;
  rate_limited: string;
  db_unavailable: string;
  unexpected: string;
};

export function ContactForm({
  locale,
  labels,
  success,
  errors: errorCopy,
  whatsappFallbackUrl,
}: {
  locale: Locale;
  labels: FormLabels;
  success: SuccessCopy;
  errors: ErrorCopy;
  whatsappFallbackUrl: string;
}) {
  const [result, setResult] = useState<ContactFormResult | null>(null);
  const hasStarted = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { locale },
  });

  function trackStartOnce() {
    if (hasStarted.current) return;
    hasStarted.current = true;
    track("contact_form_started");
  }

  async function onSubmit(values: ContactFormInput) {
    const res = await submitContactForm({ ...values, ...getClientAttribution() }, getOrCreateAnalyticsSessionId());
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
          onClick={() => track("whatsapp_handoff_clicked", { context: "contact_form" })}
        >
          <MessageCircle className="size-5" />
          {success.cta}
        </ButtonLink>
      </div>
    );
  }

  const failure = result?.success === false ? result : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocus={trackStartOnce} className="space-y-5" noValidate>
      <input type="hidden" {...register("locale")} />
      {/* Honeypot: hidden from real users via CSS, not type="hidden" (some bots skip those). Never rendered visibly, never focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input {...register(HONEYPOT_FIELD_NAME)} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={labels.name} error={errors.name?.message}>
          <input {...register("name")} className={inputClass} autoComplete="name" />
        </Field>
        <Field label={labels.company} error={errors.company?.message}>
          <input {...register("company")} className={inputClass} autoComplete="organization" />
        </Field>
        <Field label={labels.email} error={errors.email?.message}>
          <input {...register("email")} type="email" className={inputClass} autoComplete="email" />
        </Field>
        <Field label={labels.phone} error={errors.phone?.message}>
          <input {...register("phone")} type="tel" className={inputClass} autoComplete="tel" />
        </Field>
        <Field label={labels.projectType} error={errors.projectType?.message}>
          <select {...register("projectType")} className={inputClass} defaultValue="">
            <option value="" disabled>
              —
            </option>
            {labels.projectTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label={labels.budget} error={errors.budget?.message}>
          <select {...register("budget")} className={inputClass} defaultValue="">
            <option value="" disabled>
              —
            </option>
            {labels.budgetOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={labels.timeline} error={errors.timeline?.message}>
        <input {...register("timeline")} className={inputClass} />
      </Field>

      <Field label={labels.message} error={errors.message?.message}>
        <textarea {...register("message")} rows={5} className={inputClass} />
      </Field>

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
              onClick={() => track("whatsapp_handoff_clicked", { context: "contact_form_fallback" })}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </ButtonLink>
          )}
        </div>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
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

const inputClass =
  "w-full rounded-xl border border-border bg-void px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-bright";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
