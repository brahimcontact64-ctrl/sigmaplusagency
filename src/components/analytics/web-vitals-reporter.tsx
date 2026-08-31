"use client";

import { useReportWebVitals } from "next/web-vitals";
import { track } from "@/lib/integrations/analytics";
import { classifyPageType } from "@/lib/analytics/page-type";

const TRACKED_METRICS = new Set(["LCP", "CLS", "INP"]);

/**
 * Real User Monitoring for Core Web Vitals (Phase 9 §41-42) — only the
 * three metrics the analytics schema actually models (LCP/CLS/INP;
 * see `analyticsPropsSchema`'s `metric` enum), and only safe
 * dimensions (metric/value/rating/pageType/locale/deviceClass — no
 * identity, no full/sensitive URL). Consent-gated the same as every
 * other `track()` call. Until real user data has accumulated, this is
 * architecture, not a field-CWV claim — see
 * docs/ANALYTICS_MEASUREMENT_PLAN.md.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!TRACKED_METRICS.has(metric.name)) return;
    track("web_vital", {
      metric: metric.name as "LCP" | "CLS" | "INP",
      value: metric.value,
      rating: metric.rating,
      pageType: classifyPageType(window.location.pathname),
    });
  });

  return null;
}
