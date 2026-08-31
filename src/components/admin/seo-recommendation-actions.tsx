"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveSeoRecommendationAction, rejectSeoRecommendationAction } from "@/lib/actions/admin-seo";

export function SeoRecommendationActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: (id: string) => Promise<{ success: boolean }>) {
    startTransition(async () => {
      await action(id);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => handle(approveSeoRecommendationAction)}
        className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => handle(rejectSeoRecommendationAction)}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
