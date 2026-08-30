"use client";

import { motion, AnimatePresence } from "motion/react";
import { OptionCard } from "./option-card";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { BUSINESS_STATES, type BusinessState } from "@/domain/project-request";

export function BusinessStateStep({
  title,
  subtitle,
  currentWebsiteLabel,
  labels,
  value,
  currentWebsite,
  onChangeValue,
  onChangeWebsite,
}: {
  title: string;
  subtitle: string;
  currentWebsiteLabel: string;
  labels: Record<BusinessState, string>;
  value?: BusinessState;
  currentWebsite: string;
  onChangeValue: (v: BusinessState) => void;
  onChangeWebsite: (v: string) => void;
}) {
  const showWebsiteField = value === "existing-business" || value === "existing-product-to-improve";

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUSINESS_STATES.map((id) => (
          <OptionCard key={id} label={labels[id]} selected={value === id} onToggle={() => onChangeValue(id)} />
        ))}
      </motion.div>

      <AnimatePresence>
        {showWebsiteField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-medium text-muted">{currentWebsiteLabel}</span>
              <input
                value={currentWebsite}
                onChange={(e) => onChangeWebsite(e.target.value)}
                className="w-full rounded-xl border border-border bg-void px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary-bright"
                placeholder="example.com"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
