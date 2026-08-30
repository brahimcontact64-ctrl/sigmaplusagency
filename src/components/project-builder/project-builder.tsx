"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { OptionGridStep } from "./option-grid-step";
import { BusinessStateStep } from "./business-state-step";
import { ContactStep } from "./contact-step";
import { MessageStep } from "./message-step";
import { SummaryStep, type SummarySection } from "./summary-step";
import { ResultScreen } from "./result-screen";
import { STEP_IDS, EMPTY_FORM_DATA, type BuilderFormData, type StepId } from "./types";
import { saveDraft, loadDraft, clearDraft } from "@/lib/project-builder-draft";
import { getClientAttribution } from "@/lib/attribution";
import { track } from "@/lib/integrations/analytics";
import { submitProjectBuilder } from "@/lib/actions/project-builder";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { ProjectBuilderResult } from "@/domain/project-builder";
import type { Locale } from "@/i18n/routing";
import {
  PROJECT_TYPES,
  PROJECT_GOALS,
  PROJECT_CAPABILITIES,
  PROJECT_PLATFORMS,
  PROJECT_TIMELINES,
} from "@/domain/project-request";
import { BUDGET_RANGES } from "@/config/budget-ranges";

const REQUIRED_NAME_MIN = 2;

function isStepValid(stepId: StepId, data: BuilderFormData): boolean {
  switch (stepId) {
    case "whatToBuild":
      return !!data.projectType;
    case "goals":
      return data.goals.length > 0;
    case "capabilities":
      return true; // optional
    case "platforms":
      return data.platforms.length > 0;
    case "businessState":
      return !!data.businessState;
    case "timeline":
      return !!data.timeline;
    case "budget":
      return !!data.budgetRange;
    case "contact":
      return data.name.trim().length >= REQUIRED_NAME_MIN && /\S+@\S+\.\S+/.test(data.email);
    case "message":
      return true; // optional
    case "summary":
      return true;
  }
}

export function ProjectBuilder() {
  const t = useTranslations("projectBuilder");
  const locale = useLocale() as Locale;

  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<BuilderFormData>(EMPTY_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProjectBuilderResult | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const hasStarted = useRef(false);
  const hasCompleted = useRef(false);

  const stepId = STEP_IDS[stepIndex]!;
  const totalSteps = STEP_IDS.length;

  useEffect(() => {
    // One-time client-only read (localStorage isn't available during
    // SSR) — not a derived-state cascade, so the lint exception is
    // scoped to this single call. Same pattern as the Phase 2 3D
    // capability probe in sigma-object.tsx.
    function restoreDraft() {
      const draft = loadDraft();
      if (!draft) return null;

      const restoredIndex =
        typeof draft.stepIndex === "number" && draft.stepIndex < STEP_IDS.length ? draft.stepIndex : null;

      return { draft, restoredIndex };
    }

    const restored = restoreDraft();
    if (restored) {
      const { draft, restoredIndex } = restored;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only localStorage read, not a render cascade
      setData((prev) => ({
        ...prev,
        projectType: (draft.projectType as BuilderFormData["projectType"]) ?? prev.projectType,
        goals: (draft.goals as BuilderFormData["goals"]) ?? prev.goals,
        capabilities: (draft.capabilities as BuilderFormData["capabilities"]) ?? prev.capabilities,
        platforms: (draft.platforms as BuilderFormData["platforms"]) ?? prev.platforms,
        businessState: (draft.businessState as BuilderFormData["businessState"]) ?? prev.businessState,
        currentWebsite: draft.currentWebsite ?? prev.currentWebsite,
        timeline: (draft.timeline as BuilderFormData["timeline"]) ?? prev.timeline,
        budgetRange: draft.budgetRange ?? prev.budgetRange,
      }));
      if (restoredIndex !== null) setStepIndex(restoredIndex);
      setDraftNotice(true);
    }
    track("project_builder_viewed");
  }, []);

  useEffect(() => {
    saveDraft({
      projectType: data.projectType,
      goals: data.goals,
      capabilities: data.capabilities,
      platforms: data.platforms,
      businessState: data.businessState,
      currentWebsite: data.currentWebsite,
      timeline: data.timeline,
      budgetRange: data.budgetRange,
      stepIndex,
    });
  }, [data.projectType, data.goals, data.capabilities, data.platforms, data.businessState, data.currentWebsite, data.timeline, data.budgetRange, stepIndex]);

  useEffect(() => {
    function handleUnload() {
      if (hasStarted.current && !hasCompleted.current) {
        track("project_builder_abandoned", { atStep: stepId });
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [stepId]);

  function patch(update: Partial<BuilderFormData>) {
    if (!hasStarted.current) {
      hasStarted.current = true;
      track("project_builder_started");
    }
    setData((prev) => ({ ...prev, ...update }));
  }

  function goNext() {
    if (!isStepValid(stepId, data)) return;
    track("project_builder_step_completed", { step: stepId, index: stepIndex });
    setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function jumpTo(id: StepId) {
    setStepIndex(STEP_IDS.indexOf(id));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const res = await submitProjectBuilder({
      projectType: data.projectType,
      goals: data.goals,
      capabilities: data.capabilities,
      platforms: data.platforms,
      businessState: data.businessState,
      currentWebsite: data.currentWebsite || undefined,
      timeline: data.timeline,
      budgetRange: data.budgetRange,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      country: data.country || undefined,
      preferredContactMethod: data.preferredContactMethod,
      message: data.message || undefined,
      locale,
      ...getClientAttribution(),
    });
    setSubmitting(false);
    setResult(res);

    if (res.success) {
      hasCompleted.current = true;
      clearDraft();
      track("project_builder_completed");
      track("lead_created", { source: "project_builder" });
    }
  }

  function optionsFor(namespace: string, ids: readonly string[]) {
    const map = t.raw(namespace) as Record<string, string>;
    return ids.map((id) => ({ id, label: map[id] ?? id }));
  }

  const whatsappFallbackUrl = buildWhatsAppUrl();

  if (result) {
    return (
      <ResultScreen
        result={result}
        successCopy={t.raw("success")}
        errorCopy={t.raw("errors")}
        whatsappFallbackUrl={whatsappFallbackUrl}
        retryLabel={t("retry")}
        onRetry={() => setResult(null)}
      />
    );
  }

  const optionLabel = (namespace: string, id?: string) => {
    if (!id) return "";
    const map = t.raw(namespace) as Record<string, string>;
    return map[id] ?? id;
  };

  const summarySections: SummarySection[] = [
    { label: t("summary.projectLabel"), value: optionLabel("whatToBuild", data.projectType), editStep: "whatToBuild" },
    {
      label: t("summary.goalsLabel"),
      value: data.goals.map((g) => optionLabel("goals", g)).join(", "),
      editStep: "goals",
    },
    {
      label: t("summary.capabilitiesLabel"),
      value: data.capabilities.map((c) => optionLabel("capabilities", c)).join(", "),
      editStep: "capabilities",
    },
    {
      label: t("summary.platformsLabel"),
      value: data.platforms.map((p) => optionLabel("platforms", p)).join(", "),
      editStep: "platforms",
    },
    { label: t("summary.businessLabel"), value: optionLabel("businessState", data.businessState), editStep: "businessState" },
    { label: t("summary.timelineLabel"), value: optionLabel("timeline", data.timeline), editStep: "timeline" },
    { label: t("summary.budgetLabel"), value: optionLabel("budget", data.budgetRange), editStep: "budget" },
    {
      label: t("summary.contactLabel"),
      value: [data.name, data.email, data.phone].filter(Boolean).join(" · "),
      editStep: "contact",
    },
    { label: t("summary.messageLabel"), value: data.message, editStep: "message" },
  ];

  return (
    <div>
      <StepIndicator
        current={stepIndex + 1}
        total={totalSteps}
        label={t("nav.stepLabel", { current: stepIndex + 1, total: totalSteps })}
      />

      {draftNotice && (
        <div className="mb-6 rounded-xl border border-primary-bright/30 bg-primary/5 px-4 py-2.5 text-sm text-primary-bright">
          {t("draftRestored")}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepId}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {stepId === "whatToBuild" && (
            <OptionGridStep
              title={t("steps.whatToBuild.title")}
              subtitle={t("steps.whatToBuild.subtitle")}
              options={optionsFor("whatToBuild", PROJECT_TYPES)}
              selected={data.projectType ? [data.projectType] : []}
              multi={false}
              onChange={([v]) => patch({ projectType: v as BuilderFormData["projectType"] })}
              columns={3}
            />
          )}
          {stepId === "goals" && (
            <OptionGridStep
              title={t("steps.goals.title")}
              subtitle={t("steps.goals.subtitle")}
              options={optionsFor("goals", PROJECT_GOALS)}
              selected={data.goals}
              multi
              onChange={(v) => patch({ goals: v as BuilderFormData["goals"] })}
            />
          )}
          {stepId === "capabilities" && (
            <OptionGridStep
              title={t("steps.capabilities.title")}
              subtitle={t("steps.capabilities.subtitle")}
              options={optionsFor("capabilities", PROJECT_CAPABILITIES)}
              selected={data.capabilities}
              multi
              onChange={(v) => patch({ capabilities: v as BuilderFormData["capabilities"] })}
              columns={3}
            />
          )}
          {stepId === "platforms" && (
            <OptionGridStep
              title={t("steps.platforms.title")}
              subtitle={t("steps.platforms.subtitle")}
              options={optionsFor("platforms", PROJECT_PLATFORMS)}
              selected={data.platforms}
              multi
              onChange={(v) => patch({ platforms: v as BuilderFormData["platforms"] })}
              columns={3}
            />
          )}
          {stepId === "businessState" && (
            <BusinessStateStep
              title={t("steps.businessState.title")}
              subtitle={t("steps.businessState.subtitle")}
              currentWebsiteLabel={t("steps.businessState.currentWebsiteLabel")}
              labels={t.raw("businessState")}
              value={data.businessState}
              currentWebsite={data.currentWebsite}
              onChangeValue={(v) => patch({ businessState: v })}
              onChangeWebsite={(v) => patch({ currentWebsite: v })}
            />
          )}
          {stepId === "timeline" && (
            <OptionGridStep
              title={t("steps.timeline.title")}
              subtitle={t("steps.timeline.subtitle")}
              options={optionsFor("timeline", PROJECT_TIMELINES)}
              selected={data.timeline ? [data.timeline] : []}
              multi={false}
              onChange={([v]) => patch({ timeline: v as BuilderFormData["timeline"] })}
            />
          )}
          {stepId === "budget" && (
            <OptionGridStep
              title={t("steps.budget.title")}
              subtitle={t("steps.budget.subtitle")}
              options={optionsFor(
                "budget",
                BUDGET_RANGES.map((r) => r.id),
              )}
              selected={data.budgetRange ? [data.budgetRange] : []}
              multi={false}
              onChange={([v]) => patch({ budgetRange: v })}
            />
          )}
          {stepId === "contact" && (
            <ContactStep
              title={t("steps.contact.title")}
              subtitle={t("steps.contact.subtitle")}
              labels={t.raw("contact")}
              data={data}
              onChange={patch}
              errors={{}}
            />
          )}
          {stepId === "message" && (
            <MessageStep
              title={t("steps.message.title")}
              subtitle={t("steps.message.subtitle")}
              placeholder={t("steps.message.placeholder")}
              value={data.message}
              onChange={(v) => patch({ message: v })}
            />
          )}
          {stepId === "summary" && (
            <SummaryStep
              title={t("summary.title")}
              subtitle={t("summary.subtitle")}
              sections={summarySections}
              editLabel={t("nav.edit")}
              privacyNote={t("summary.privacyNote")}
              onEdit={jumpTo}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={goBack}
          disabled={stepIndex === 0}
          className={stepIndex === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("nav.back")}
        </Button>

        {stepId === "summary" ? (
          <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("summary.submitting") : t("summary.submit")}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={goNext} disabled={!isStepValid(stepId, data)}>
            {t("nav.next")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}
