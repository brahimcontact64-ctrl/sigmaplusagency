"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeLeadStatusAction } from "@/lib/actions/admin-crm";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/lead";
import { cn } from "@/lib/utils";

export function LeadStatusSelect({ leadId, status, compact }: { leadId: string; status: LeadStatus; compact?: boolean }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(newStatus: string) {
    const previous = value;
    setValue(newStatus as LeadStatus);
    setError(null);
    startTransition(async () => {
      const result = await changeLeadStatusAction(leadId, newStatus);
      if (!result.success) {
        setValue(previous);
        setError(result.error === "forbidden" ? "You don't have permission to do that." : "Update failed.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "rounded-lg border border-border bg-void text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright disabled:opacity-60",
          compact ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm",
        )}
        aria-label="Lead status"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
