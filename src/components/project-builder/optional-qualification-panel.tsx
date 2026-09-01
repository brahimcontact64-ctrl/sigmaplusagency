"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { OptionGridStep } from "./option-grid-step";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { track } from "@/lib/integrations/analytics";
import { submitOptionalQualification } from "@/lib/actions/project-builder-qualification";
import { CAPABILITIES_BY_TYPE, shouldAskPlatforms } from "@/config/project-builder-flow";
import {
  PROJECT_GOALS,
  PROJECT_CAPABILITIES,
  PROJECT_PLATFORMS,
  type ProjectType,
  type ProjectGoal,
  type ProjectCapability,
  type ProjectPlatform,
} from "@/domain/project-request";

function mapOptions(map: Record<string, string>, ids: readonly string[]) {
  return ids.map((id) => ({ id, label: map[id] ?? id }));
}

/**
 * Project Builder v2 §3 — the optional, post-submission progressive
 * qualification entry point. Collapsed to a single CTA by default;
 * expanding it never blocks or repeats the primary submission, which
 * has already succeeded by the time this renders. The capability list
 * is filtered by project type (see CAPABILITIES_BY_TYPE) and platforms
 * are only asked when actually relevant (shouldAskPlatforms) — both
 * adaptive lookups, not a rules engine.
 */
export function OptionalQualificationPanel({
  reference,
  projectRequestId,
  projectType,
}: {
  reference: string;
  projectRequestId: string;
  projectType?: ProjectType;
}) {
  const t = useTranslations("projectBuilder");
  const [expanded, setExpanded] = useState(false);
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [capabilities, setCapabilities] = useState<ProjectCapability[]>([]);
  const [platforms, setPlatforms] = useState<ProjectPlatform[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const capabilityIds = (projectType && CAPABILITIES_BY_TYPE[projectType]) || PROJECT_CAPABILITIES;
  const askPlatforms = shouldAskPlatforms(projectType);

  function handleExpand() {
    setExpanded(true);
    track("optional_qualification_started", projectType ? { projectType } : undefined);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const result = await submitOptionalQualification({ reference, projectRequestId, goals, capabilities, platforms });
    setSubmitting(false);
    if (result.success) {
      setDone(true);
      track("optional_qualification_completed", projectType ? { projectType } : undefined);
    }
  }

  if (done) {
    return (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm text-primary-bright">
        {t("optionalQualification.done")}
      </motion.p>
    );
  }

  if (!expanded) {
    return (
      <motion.div variants={fadeUp} className="mt-6">
        <button
          type="button"
          onClick={handleExpand}
          className="text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("optionalQualification.cta")}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer(0.04)}
      className="mt-8 w-full rounded-2xl border border-border bg-surface p-5 text-left sm:p-6"
    >
      <motion.h2 variants={fadeUp} className="text-lg font-semibold text-foreground">
        {t("optionalQualification.title")}
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-1.5 text-sm text-muted">
        {t("optionalQualification.subtitle")}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-6">
        <OptionGridStep
          title={t("steps.goals.title")}
          subtitle={t("steps.goals.subtitle")}
          options={mapOptions(t.raw("goals"), PROJECT_GOALS)}
          selected={goals}
          multi
          onChange={(v) => setGoals(v as ProjectGoal[])}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6">
        <OptionGridStep
          title={t("steps.capabilities.title")}
          subtitle={t("steps.capabilities.subtitle")}
          options={mapOptions(t.raw("capabilities"), capabilityIds)}
          selected={capabilities}
          multi
          onChange={(v) => setCapabilities(v as ProjectCapability[])}
          columns={3}
        />
      </motion.div>

      {askPlatforms && (
        <motion.div variants={fadeUp} className="mt-6">
          <OptionGridStep
            title={t("steps.platforms.title")}
            subtitle={t("steps.platforms.subtitle")}
            options={mapOptions(t.raw("platforms"), PROJECT_PLATFORMS)}
            selected={platforms}
            multi
            onChange={(v) => setPlatforms(v as ProjectPlatform[])}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="mt-6">
        <Button type="button" size="md" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("optionalQualification.submitting") : t("optionalQualification.submit")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
