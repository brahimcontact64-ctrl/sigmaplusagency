"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/observability/error-reporter";

/**
 * Admin-tree error boundary (Phase 10 §26) — no next-intl dependency
 * (Admin is intentionally English-only, outside next-intl routing
 * entirely, per the master plan). Never exposes a stack trace, only a
 * correlation id an OWNER/ADMIN could search platform logs for.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { component: "admin-error-boundary" });
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-400/10 text-red-400">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">An unexpected error occurred loading this page. Try again, or go back to the dashboard.</p>
      {error.digest && <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-foreground hover:bg-primary-bright"
        >
          Try again
        </button>
        <Link href="/admin" className="rounded-full border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
