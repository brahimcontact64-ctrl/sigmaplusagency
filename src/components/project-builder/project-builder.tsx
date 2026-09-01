"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { OptionGridStep } from "./option-grid-step";
import { IdeaStep } from "./idea-step";
import { BudgetTimingStep } from "./budget-timing-step";
import { ContactStep } from "./contact-step";
import { ResultScreen } from "./result-screen";
import { STEP_IDS, EMPTY_FORM_DATA, type BuilderFormData, type StepId } from "./types";
import { saveDraft, loadDraft, clearDraft } from "@/lib/project-builder-draft";
import { getClientAttribution } from "@/lib/attribution";
import { track } from "@/lib/integrations/analytics";
import { getOrCreateAnalyticsSessionId } from "@/lib/analytics/session-id";
import { submitProjectBuilder } from "@/lib/actions/project-builder";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { persistShownCurrency, setCurrencyOverride } from "@/lib/pricing/currency-cookie-client";
import { PRIMARY_PROJECT_TYPE_IDS } from "@/config/project-builder-flow";
import { isStepValid } from "@/lib/project-builder/step-validity";
import type { ProjectBuilderResult } from "@/domain/project-builder";
import type { Locale } from "@/i18n/routing";
import type { CurrencyCode } from "@/lib/money";
import type { BusinessState, ProjectTimeline } from "@/domain/project-request";
import { BUDGET_RANGES, formatBudgetRangeLabel } from "@/config/budget-ranges";

/**
 * Maps the internal step id to the non-PII, stable identifier used in
 * analytics (Project Builder v2 §7) — deliberately a separate, small
 * dictionary rather than reusing STEP_IDS values directly, so the
 * analytics dimension stays stable even if an internal step id is ever
 * renamed for code-clarity reasons.
 */
const ANALYTICS_STEP_ID: Record<StepId, string> = {
  whatToBuild: "project_type",
  idea: "idea",
  budgetTiming: "budget_timing",
  contact: "contact",
};

export function ProjectBuilder({ initialCurrency = "EUR" }: { initialCurrency?: CurrencyCode }) {
  const t = useTranslations("projectBuilder");
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const fromAiHandoff = searchParams.get("from") === "ai";

  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<BuilderFormData>(EMPTY_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProjectBuilderResult | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  // Server-resolved on first render (Phase 11 §5/§8 — the same value
  // the server used, so there's nothing for the client to "correct"
  // after hydration). A manual switch in the budget step updates this
  // client-side only; it never triggers a server round trip.
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const hasStarted = useRef(false);
  const hasCompleted = useRef(false);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const isFirstStepRender = useRef(true);

  const stepId = STEP_IDS[stepIndex]!;
  const totalSteps = STEP_IDS.length;

  // Records whatever currency actually ended up shown (server-derived
  // or later manually switched) as the "last known" value — backs
  // priority tier 3 in currency-preference.ts the next time a fresh
  // geo signal isn't available. Never marks it as an override; only
  // handleCurrencyChange below does that.
  useEffect(() => {
    persistShownCurrency(currency);
  }, [currency]);

  function handleCurrencyChange(next: CurrencyCode) {
    setCurrency(next);
    setCurrencyOverride(next);
  }

  // Structural fix for the sticky-header-clips-step-content bug
  // (Phase 11 §1): every step change re-anchors scroll to the start of
  // the new step's content, offset by the site header's real current
  // height via `scroll-mt-(--site-header-height)` on the target
  // element (see header-client.tsx, which keeps that CSS variable in
  // sync via ResizeObserver) — never a hardcoded per-page margin. The
  // very first render uses an immediate jump rather than a smooth
  // scroll so restoring a mid-flow draft doesn't animate the page on
  // load. `scrollIntoView`'s explicit `behavior` option is honored by
  // browsers even over a reduced-motion CSS override, so
  // prefers-reduced-motion is checked directly here too.
  useEffect(() => {
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = isFirstStepRender.current || prefersReducedMotion ? "auto" : "smooth";
    isFirstStepRender.current = false;
    stepContentRef.current?.scrollIntoView({ behavior, block: "start" });
    track("project_builder_step_viewed", { builderStep: ANALYTICS_STEP_ID[stepId], builderStepIndex: stepIndex });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepId is derived from stepIndex; including it would be redundant, not a missing dependency
  }, [stepIndex]);

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

    // A one-time AI-consultant handoff (see /ai-consultant) takes
    // priority over any stale localStorage draft — arriving here via
    // "Continue with Project Builder" is a deliberate action and
    // shouldn't be silently overridden by unrelated earlier browsing.
    // The prefill never touches the URL or a server round trip: it's
    // read once from sessionStorage (same-origin, same-tab only) and
    // immediately cleared so a page refresh falls back to normal draft
    // behavior instead of re-applying it.
    let appliedAiHandoff = false;
    if (fromAiHandoff) {
      try {
        const raw = window.sessionStorage.getItem("sigma_ai_handoff");
        if (raw) {
          const prefill = JSON.parse(raw) as Partial<BuilderFormData>;
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only sessionStorage read, not a render cascade
          setData((prev) => ({ ...prev, ...prefill }));
          window.sessionStorage.removeItem("sigma_ai_handoff");
          setDraftNotice(false);
          appliedAiHandoff = true;
        }
      } catch {
        // malformed/tampered sessionStorage value — ignore and fall through to normal draft restore
      }
    }

    if (!appliedAiHandoff) {
      const restored = restoreDraft();
      if (restored) {
        const { draft, restoredIndex } = restored;
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
          message: draft.message ?? prev.message,
        }));
        if (restoredIndex !== null) setStepIndex(restoredIndex);
        setDraftNotice(true);
      }
    }
    track("project_builder_viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: only the initial URL param value should ever trigger this, not later navigation changes
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
      message: data.message,
      stepIndex,
    });
  }, [
    data.projectType,
    data.goals,
    data.capabilities,
    data.platforms,
    data.businessState,
    data.currentWebsite,
    data.timeline,
    data.budgetRange,
    data.message,
    stepIndex,
  ]);

  useEffect(() => {
    function handleUnload() {
      if (hasStarted.current && !hasCompleted.current) {
        track("project_builder_abandoned", { builderStep: ANALYTICS_STEP_ID[stepId] });
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
    track("project_builder_step_completed", { builderStep: ANALYTICS_STEP_ID[stepId], builderStepIndex: stepIndex });
    setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    if (!isStepValid("contact", data) || submitting) return;
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
      budgetCurrency: currency,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || undefined,
      country: data.country || undefined,
      preferredContactMethod: data.preferredContactMethod,
      message: data.message,
      locale,
      ...getClientAttribution(),
    }, getOrCreateAnalyticsSessionId());
    setSubmitting(false);
    setResult(res);

    if (res.success) {
      hasCompleted.current = true;
      clearDraft();
      track("project_builder_step_completed", { builderStep: ANALYTICS_STEP_ID.contact, builderStepIndex: stepIndex });
      track("project_builder_completed");
      track("proposal_requested");
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

  // Currency-aware budget labels (Phase 11 §6) — replaces the old
  // static per-locale `budget` translation map, which hardcoded EUR
  // regardless of the visitor's currency. `formatBudgetRangeLabel`
  // does the amount formatting; the phrasing itself ("Under {amount}",
  // etc.) still comes entirely from messages/*.json, translator-owned.
  const budgetOptions = BUDGET_RANGES.map((range) => ({
    id: range.id,
    label: formatBudgetRangeLabel(range, currency, locale, (key, values) => t(`budgetTemplates.${key}` as never, values as never)),
  }));

  const isLastStep = stepId === "contact";

  return (
    <div>
      {/*
        The whole step region — progress bar included — is the scroll
        target, not just the inner content, so advancing/going back
        never leaves the progress bar scrolled out of view above the
        header while the new step's own heading is visible (or vice
        versa). `scroll-mt-(--site-header-height)` reads the same CSS
        variable header-client.tsx keeps in sync with the sticky
        header's real, current (unscrolled vs. scrolled) height — never
        a hardcoded pixel margin.
      */}
      <div ref={stepContentRef} className="scroll-mt-(--site-header-height)">
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
              options={optionsFor("whatToBuild", PRIMARY_PROJECT_TYPE_IDS)}
              selected={data.projectType ? [data.projectType] : []}
              multi={false}
              onChange={([v]) => patch({ projectType: v as BuilderFormData["projectType"] })}
              columns={3}
              mobileColumns={2}
            />
          )}
          {stepId === "idea" && (
            <IdeaStep
              title={t("steps.idea.title")}
              subtitle={t("steps.idea.subtitle")}
              placeholder={t("steps.idea.placeholder")}
              helper={t("steps.idea.helper")}
              message={data.message}
              onChangeMessage={(v) => patch({ message: v })}
              businessStateLabel={t("steps.idea.businessStateLabel")}
              businessStateOptions={t.raw("businessState") as Record<BusinessState, string>}
              businessState={data.businessState}
              onChangeBusinessState={(v) => patch({ businessState: v })}
              currentWebsiteLabel={t("steps.businessState.currentWebsiteLabel")}
              currentWebsite={data.currentWebsite}
              onChangeWebsite={(v) => patch({ currentWebsite: v })}
            />
          )}
          {stepId === "budgetTiming" && (
            <BudgetTimingStep
              title={t("steps.budgetTiming.title")}
              subtitle={t("steps.budgetTiming.subtitle")}
              timelineLabel={t("steps.budgetTiming.timelineLabel")}
              timelineOptions={t.raw("timeline") as Record<ProjectTimeline, string>}
              timeline={data.timeline}
              onChangeTimeline={(v) => patch({ timeline: v })}
              budgetLabel={t("steps.budgetTiming.budgetLabel")}
              budgetOptions={budgetOptions}
              budgetRange={data.budgetRange}
              onChangeBudgetRange={(v) => patch({ budgetRange: v })}
              currency={currency}
              onChangeCurrency={handleCurrencyChange}
              currencyLabel={t("currencySwitcher.label")}
              currencyHint={t("currencySwitcher.hint", { currency })}
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
        </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between sm:mt-10">
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

        {isLastStep ? (
          <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting || !isStepValid(stepId, data)}>
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
