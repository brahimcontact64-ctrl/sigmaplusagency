"use client";

import { motion } from "motion/react";
import { Pencil } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { StepId } from "./types";

export type SummarySection = {
  label: string;
  value: string;
  editStep: StepId;
};

export function SummaryStep({
  title,
  subtitle,
  sections,
  editLabel,
  privacyNote,
  onEdit,
}: {
  title: string;
  subtitle: string;
  sections: SummarySection[];
  editLabel: string;
  privacyNote: string;
  onEdit: (step: StepId) => void;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {sections.map((section) => (
          <div key={section.label} className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{section.label}</p>
              <p className="mt-1 text-sm text-foreground">{section.value || "—"}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(section.editStep)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-primary-bright hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright"
            >
              <Pencil className="size-3" />
              {editLabel}
            </button>
          </div>
        ))}
      </motion.div>

      <motion.p variants={fadeUp} className="mt-6 text-xs text-muted">
        {privacyNote}
      </motion.p>
    </motion.div>
  );
}
