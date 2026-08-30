"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { PreferredContactMethod } from "@/domain/lead";
import { PREFERRED_CONTACT_METHODS } from "@/domain/lead";
import type { BuilderFormData } from "./types";

const inputClass =
  "w-full rounded-xl border border-border bg-void px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-bright";

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
    phone: string;
    company: string;
    country: string;
    preferredContactMethod: string;
    preferredContactOptions: Record<PreferredContactMethod, string>;
  };
  data: Pick<BuilderFormData, "name" | "email" | "phone" | "company" | "country" | "preferredContactMethod">;
  onChange: (patch: Partial<BuilderFormData>) => void;
  errors: Partial<Record<"name" | "email", string>>;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.email}</span>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClass}
            autoComplete="email"
          />
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.phone}</span>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={inputClass}
            autoComplete="tel"
          />
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

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.country}</span>
          <input
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className={inputClass}
            autoComplete="country-name"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">{labels.preferredContactMethod}</span>
          <select
            value={data.preferredContactMethod ?? ""}
            onChange={(e) => onChange({ preferredContactMethod: e.target.value as PreferredContactMethod })}
            className={inputClass}
          >
            <option value="" disabled>
              —
            </option>
            {PREFERRED_CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {labels.preferredContactOptions[m]}
              </option>
            ))}
          </select>
        </label>
      </motion.div>
    </motion.div>
  );
}
