"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionCard({
  label,
  selected,
  onToggle,
  className,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright",
        selected
          ? "border-primary-bright bg-primary/10 text-foreground"
          : "border-border bg-surface text-muted hover:border-primary-bright/50 hover:text-foreground",
        className,
      )}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary-bright bg-primary-bright text-void" : "border-border",
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  );
}
