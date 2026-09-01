"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { BuilderFormData } from "./types";

const inputClass =
  "w-full rounded-xl border border-border bg-void px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-bright";

/**
 * Step 4 — "Contact" (Project Builder v2 §1). Only 3 fields: name and
 * phone/WhatsApp are required, email is required at the persistence
 * layer too (see the note on `email` in domain/project-builder.ts for
 * why — the spec asked for it to be optional, but `leads.email` is a
 * NOT NULL column and making it truly optional needs a migration this
 * task deliberately did not create) with lightweight, reassuring
 * copy rather than a scary asterisk. Company is kept as the one
 * optional extra (spec explicitly allows it "if visually lightweight").
 * Country and preferred-contact-method are dropped from this screen
 * entirely — still accepted by the schema/BuilderFormData (so an AI
 * Consultant handoff that set them keeps working), just not asked here.
 */
export function ContactStep({
  title,
  subtitle,
  labels,
  data,
  onChange,
  errors,
}: {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    email: string;
    emailHint: string;
    phone: string;
    company: string;
  };
  data: Pick<BuilderFormData, "name" | "email" | "phone" | "company">;
  onChange: (patch: Partial<BuilderFormData>) => void;
  errors: Partial<Record<"name" | "email" | "phone", string>>;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.name}</span>
          <input
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={inputClass}
            autoComplete="name"
          />
          {errors.name && <span className="mt-1 block text-xs text-red-400">{errors.name}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.phone}</span>
          <input
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={inputClass}
            autoComplete="tel"
          />
          {errors.phone && <span className="mt-1 block text-xs text-red-400">{errors.phone}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.email}</span>
          <input
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClass}
            autoComplete="email"
          />
          <span className="mt-1 block text-xs text-muted">{labels.emailHint}</span>
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.company}</span>
          <input
            value={data.company}
            onChange={(e) => onChange({ company: e.target.value })}
            className={inputClass}
            autoComplete="organization"
          />
        </label>
      </motion.div>
    </motion.div>
  );
}
