"use client";

import { AnimatePresence, motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { OptionCard } from "./option-card";
import { PRIMARY_BUSINESS_STATE_IDS } from "@/config/project-builder-flow";
import type { BusinessState } from "@/domain/project-request";

const MAX_LENGTH = 2000;

/**
 * Step 2 — "Tell us about your idea" (Project Builder v2 §1). One large
 * textarea is the primary control; the old mandatory
 * goals/capabilities/platforms screens are gone from this flow entirely
 * (see src/config/project-builder-flow.ts for where those canonical
 * IDs still live). A compact 2-option business-state selector is
 * folded into this same step rather than getting its own screen, with
 * the "current website" field appearing only when relevant — the same
 * conditional behavior the old dedicated step had.
 */
export function IdeaStep({
  title,
  subtitle,
  placeholder,
  helper,
  message,
  onChangeMessage,
  businessStateLabel,
  businessStateOptions,
  businessState,
  onChangeBusinessState,
  currentWebsiteLabel,
  currentWebsite,
  onChangeWebsite,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  helper: string;
  message: string;
  onChangeMessage: (v: string) => void;
  businessStateLabel: string;
  businessStateOptions: Record<BusinessState, string>;
  businessState?: BusinessState;
  onChangeBusinessState: (v: BusinessState) => void;
  currentWebsiteLabel: string;
  currentWebsite: string;
  onChangeWebsite: (v: string) => void;
}) {
  const showWebsiteField = businessState === "existing-business";

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.textarea
        variants={fadeUp}
        value={message}
        onChange={(e) => onChangeMessage(e.target.value)}
        placeholder={placeholder}
        rows={6}
        maxLength={MAX_LENGTH}
        className="mt-6 w-full rounded-xl border border-border bg-void px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-bright sm:mt-8"
      />
      <motion.div variants={fadeUp} className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{helper}</span>
        <span className="shrink-0">
          {message.length}/{MAX_LENGTH}
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6">
        <span className="mb-2 block text-sm font-medium text-muted">{businessStateLabel}</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRIMARY_BUSINESS_STATE_IDS.map((id) => (
            <OptionCard
              key={id}
              label={businessStateOptions[id]}
              selected={businessState === id}
              onToggle={() => onChangeBusinessState(id)}
            />
          ))}
        </div>
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
            <label className="mt-4 block">
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
