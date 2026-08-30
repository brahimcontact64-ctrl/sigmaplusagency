"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type LeadCaptureValues = { name: string; email: string; phone: string; company: string };

export function LeadCaptureForm({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (values: LeadCaptureValues) => void;
  submitting: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState<LeadCaptureValues>({ name: "", email: "", phone: "", company: "" });

  const canSubmit = values.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(values.email);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-primary-bright/30 bg-primary/5 p-4"
    >
      <p className="text-sm font-medium text-foreground">Share your details and we&apos;ll follow up with a proposal.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          required
          placeholder="Your name"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
          className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
        />
        <input
          placeholder="Company (optional)"
          value={values.company}
          onChange={(e) => setValues({ ...values, company: e.target.value })}
          className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" size="md" disabled={!canSubmit || submitting} className="self-start">
        {submitting ? "Sending…" : "Send my details"}
      </Button>
      <p className="text-xs text-muted">We only use this to follow up about your project — never shared or sold.</p>
    </form>
  );
}
