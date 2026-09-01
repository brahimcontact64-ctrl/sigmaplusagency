"use client";

import { cn } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/money";

/**
 * Discreet manual override (Phase 11 §7) — only the two currencies
 * this codebase actually has explicit budget bands for today (see
 * src/config/budget-ranges.ts). Extending to a third currency means
 * adding its bands there and one more entry to this list, nothing
 * structural. Automatic country-based detection (§5) still decides
 * the *default*; this only ever changes what's already showing.
 */
const AVAILABLE_CURRENCIES: CurrencyCode[] = ["EUR", "DZD"];

export function CurrencySwitcher({
  value,
  onChange,
  label,
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1" role="group" aria-label={label}>
      {AVAILABLE_CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={value === code}
          onClick={() => onChange(code)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            value === code ? "bg-primary-bright text-void" : "text-muted hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
