"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle } from "lucide-react";
import { contactFormSchema, type ContactFormInput } from "@/domain/contact";
import { submitContactForm } from "@/lib/actions/contact";
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

export function ContactForm({
  locale,
  labels,
  success,
  errorMessage,
}: {
  locale: Locale;
  labels: FormLabels;
  success: SuccessCopy;
  errorMessage: string;
}) {
  const [result, setResult] = useState<{ success: true; whatsappUrl: string } | { success: false } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { locale },
  });

  async function onSubmit(values: ContactFormInput) {
    const res = await submitContactForm(values);
    setResult(res);
  }

  if (result?.success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-xl font-bold">{success.title}</h2>
        <p className="mt-2 text-sm text-muted">{success.description}</p>
        <ButtonLink
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
          className="mt-6"
        >
          <MessageCircle className="size-5" />
          {success.cta}
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input type="hidden" {...register("locale")} />

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

      {result?.success === false && <p className="text-sm text-red-400">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? labels.submitting : labels.submit}
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
