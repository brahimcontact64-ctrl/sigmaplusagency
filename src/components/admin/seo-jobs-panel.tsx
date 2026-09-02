"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runSeoJobAction } from "@/lib/actions/admin-seo";
import { Button } from "@/components/ui/button";
import { SEO_JOB_TYPES, type SeoJobType } from "@/domain/seo-job";

const JOB_LABELS: Record<SeoJobType, string> = {
  DAILY_TECHNICAL_AUDIT: "Daily technical audit",
  DAILY_SEARCH_CONSOLE_SYNC: "Daily Search Console sync",
  DAILY_ANALYTICS_SYNC: "Daily GA4 analytics sync",
  WEEKLY_PAGESPEED_AUDIT: "Weekly PageSpeed audit",
  WEEKLY_KEYWORD_ANALYSIS: "Weekly keyword analysis",
  WEEKLY_SEO_OPPORTUNITY_ANALYSIS: "Weekly SEO opportunity analysis",
  WEEKLY_CONTENT_DECAY_ANALYSIS: "Weekly content decay analysis",
  WEEKLY_EXECUTIVE_REPORT: "Weekly executive report",
};

/**
 * Manual "Run now" trigger for every SEO job (Phase 12) — goes through
 * the same dispatch/lock/history mechanism the cron endpoint uses (see
 * runSeoJobAction), so a manual run here shows up in the job history
 * exactly like a scheduled one, tagged MANUAL instead of CRON.
 */
export function SeoJobsPanel() {
  const [pendingJob, setPendingJob] = useState<SeoJobType | null>(null);
  const [lastResult, setLastResult] = useState<{ job: SeoJobType; message: string } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function run(jobType: SeoJobType) {
    setPendingJob(jobType);
    startTransition(async () => {
      const result = await runSeoJobAction(jobType);
      setPendingJob(null);
      if (!result.success) {
        setLastResult({ job: jobType, message: `Failed to trigger: ${result.error}` });
        return;
      }
      const dispatch = result.dispatch;
      if (dispatch && !dispatch.dispatched) {
        setLastResult({ job: jobType, message: `Already running since ${new Date(dispatch.runningSince).toLocaleTimeString()}` });
      } else if (dispatch) {
        setLastResult({ job: jobType, message: `${dispatch.status} — run ${dispatch.runId.slice(0, 8)}` });
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {SEO_JOB_TYPES.map((jobType) => (
        <div key={jobType} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-void px-4 py-2.5">
          <span className="text-sm text-foreground">{JOB_LABELS[jobType]}</span>
          <div className="flex items-center gap-3">
            {lastResult?.job === jobType && <span className="text-xs text-muted">{lastResult.message}</span>}
            <Button type="button" variant="outline" size="md" disabled={pendingJob === jobType} onClick={() => run(jobType)}>
              {pendingJob === jobType ? "Running…" : "Run now"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
