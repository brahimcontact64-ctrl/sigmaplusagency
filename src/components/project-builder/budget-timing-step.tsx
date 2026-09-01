"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { OptionCard } from "./option-card";
import { CurrencySwitcher } from "./currency-switcher";
import { PRIMARY_TIMELINE_IDS } from "@/config/project-builder-flow";
import type { ProjectTimeline } from "@/domain/project-request";
import type { CurrencyCode } from "@/lib/money";

/**
 * Step 3 — "Budget & timing" (Project Builder v2 §1). Combines what
 * used to be two separate mandatory screens into one compact,
 * mobile-comfortable step. Both sub-sections use a 2-column mobile
 * grid (short labels — currency amounts and timing phrases both read
 * fine at half width) rather than the old full-width single-column
 * option-grid, to keep this step visually light on a phone.
 */
export function BudgetTimingStep({
  title,
  subtitle,
  timelineLabel,
  timelineOptions,
  timeline,
  onChangeTimeline,
  budgetLabel,
  budgetOptions,
  budgetRange,
  onChangeBudgetRange,
  currency,
  onChangeCurrency,
  currencyLabel,
  currencyHint,
}: {
  title: string;
  subtitle: string;
  timelineLabel: string;
  timelineOptions: Record<ProjectTimeline, string>;
  timeline?: ProjectTimeline;
  onChangeTimeline: (v: ProjectTimeline) => void;
  budgetLabel: string;
  budgetOptions: { id: string; label: string }[];
  budgetRange?: string;
  onChangeBudgetRange: (v: string) => void;
  currency: CurrencyCode;
  onChangeCurrency: (v: CurrencyCode) => void;
  currencyLabel: string;
  currencyHint: string;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-6 sm:mt-8">
        <span className="mb-2 block text-sm font-medium text-muted">{timelineLabel}</span>
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_TIMELINE_IDS.map((id) => (
            <OptionCard key={id} label={timelineOptions[id]} selected={timeline === id} onToggle={() => onChangeTimeline(id)} />
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted">{budgetLabel}</span>
          <CurrencySwitcher value={currency} onChange={onChangeCurrency} label={currencyLabel} />
        </div>
        <p className="mb-2 text-xs text-muted">{currencyHint}</p>
        <div className="grid grid-cols-2 gap-3">
          {budgetOptions.map((opt) => (
            <OptionCard
              key={opt.id}
              label={opt.label}
              selected={budgetRange === opt.id}
              onToggle={() => onChangeBudgetRange(opt.id)}
              className={opt.id === "not-sure" ? "col-span-2" : undefined}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
