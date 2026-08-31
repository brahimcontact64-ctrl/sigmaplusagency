"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLostReasonAction, setDealValueAction } from "@/lib/actions/admin-crm";
import { Button } from "@/components/ui/button";
import { LOST_REASONS } from "@/domain/lead";
import { SUPPORTED_CURRENCIES, formatMoney } from "@/lib/money";
import type { Lead } from "@/domain/lead";

/** Manual CRM input only — never inferred from the Project Builder's budget range (Phase 9 §18/§67: a range is not a contract value, and money is always integer minor units + explicit currency). */
export function DealForm({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [lostReason, setLostReason] = useState(lead.lostReason ?? "");
  const [lostNote, setLostNote] = useState(lead.lostNote ?? "");
  const [amount, setAmount] = useState(lead.dealValueMinorUnits !== undefined ? String(lead.dealValueMinorUnits / 100) : "");
  const [currency, setCurrency] = useState(lead.dealCurrency ?? SUPPORTED_CURRENCIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"lost" | "deal" | null>(null);

  function handleSaveLostReason(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const result = await setLostReasonAction(lead.id, lostReason, lostNote);
      if (!result.success) {
        setError("Could not save the lost reason.");
        return;
      }
      setSaved("lost");
      router.refresh();
    });
  }

  function handleSaveDealValue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid, non-negative amount.");
      return;
    }
    startTransition(async () => {
      const result = await setDealValueAction(lead.id, parsed, currency);
      if (!result.success) {
        setError("Could not save the deal value.");
        return;
      }
      setSaved("deal");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Deal value (manual — never inferred from the Project Builder budget range)</p>
        {lead.dealValueMinorUnits !== undefined && lead.dealCurrency && (
          <p className="mb-2 text-sm text-foreground">Current: {formatMoney(lead.dealValueMinorUnits, lead.dealCurrency as never)}</p>
        )}
        <form onSubmit={handleSaveDealValue} className="flex flex-wrap items-end gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-9 w-32 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9 rounded-lg border border-border bg-void px-2 text-sm text-foreground">
            {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button type="submit" variant="outline" size="md" disabled={pending}>Save</Button>
        </form>
      </div>

      {lead.status === "LOST" && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Lost reason (optional — never required retroactively)</p>
          <form onSubmit={handleSaveLostReason} className="flex flex-col gap-2">
            <select value={lostReason} onChange={(e) => setLostReason(e.target.value)} className="h-9 rounded-lg border border-border bg-void px-2 text-sm text-foreground">
              <option value="">Not set</option>
              {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <textarea
              value={lostNote}
              onChange={(e) => setLostNote(e.target.value)}
              rows={2}
              placeholder="Optional internal note"
              className="rounded-lg border border-border bg-void px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
            />
            <Button type="submit" variant="outline" size="md" disabled={pending || !lostReason} className="self-start">Save</Button>
          </form>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-400">Saved.</p>}
    </div>
  );
}
