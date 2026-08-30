"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import type { QualificationState, QualificationFieldKey } from "@/domain/ai-qualification";
import { cn } from "@/lib/utils";

const SCALAR_FIELD_LABELS: Partial<Record<QualificationFieldKey, string>> = {
  projectType: "Project type",
  businessState: "Business state",
  businessName: "Business name",
  existingWebsite: "Current website",
  timeline: "Timeline",
  budgetRange: "Budget range",
  country: "Country",
  preferredContactMethod: "Preferred contact",
};

const LIST_FIELD_LABELS: Partial<Record<QualificationFieldKey, string>> = {
  goals: "Goals",
  capabilities: "Capabilities",
  platforms: "Platforms",
  existingTools: "Existing tools",
};

/**
 * Shows what SIGMA AI currently understands, distinguishing an AI
 * guess from something the client has actually confirmed — never lets
 * a client mistake the AI's inference for a fact it verified with them
 * (master plan Phase 6 §9). Editing a scalar field immediately treats
 * it as confirmed, since the client just told us directly.
 */
export function QualificationCard({
  state,
  onFieldEdit,
  onConfirmAll,
  confirmed,
}: {
  state: QualificationState;
  onFieldEdit: (key: QualificationFieldKey, value: string) => void;
  onConfirmAll: () => void;
  confirmed: boolean;
}) {
  const hasAnyField = Object.keys(SCALAR_FIELD_LABELS).concat(Object.keys(LIST_FIELD_LABELS)).some((key) => state[key as QualificationFieldKey]);

  if (!hasAnyField) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        SIGMA AI is still getting to know your project — keep chatting and this will fill in.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">What SIGMA AI understands</h2>
        {confirmed && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <Check className="size-3.5" /> Confirmed
          </span>
        )}
      </div>

      <dl className="flex flex-col gap-2">
        {(Object.keys(SCALAR_FIELD_LABELS) as QualificationFieldKey[]).map((key) => {
          const field = state[key];
          if (!field) return null;
          return (
            <FieldRow
              key={key}
              label={SCALAR_FIELD_LABELS[key]!}
              value={String(field.value)}
              confidence={field.confidence}
              onEdit={(value) => onFieldEdit(key, value)}
            />
          );
        })}
        {(Object.keys(LIST_FIELD_LABELS) as QualificationFieldKey[]).map((key) => {
          const field = state[key];
          if (!field || !Array.isArray(field.value) || field.value.length === 0) return null;
          return (
            <div key={key} className="flex items-start justify-between gap-3 text-sm">
              <dt className="shrink-0 text-muted">{LIST_FIELD_LABELS[key]}</dt>
              <dd className="text-right text-foreground">{(field.value as string[]).join(", ")}</dd>
            </div>
          );
        })}
      </dl>

      {state.openQuestions.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-xs font-medium text-muted">Still open</p>
          <ul className="list-inside list-disc text-sm text-foreground">
            {state.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {!confirmed && (
        <button
          type="button"
          onClick={onConfirmAll}
          className="mt-1 self-start rounded-lg border border-primary-bright/40 px-3 py-1.5 text-xs font-semibold text-primary-bright hover:bg-primary/10"
        >
          This looks right, confirm
        </button>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  confidence,
  onEdit,
}: {
  label: string;
  value: string;
  confidence: "INFERRED" | "USER_CONFIRMED";
  onEdit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <dt className="w-28 shrink-0 text-muted">{label}</dt>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEdit(draft);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-border bg-void px-2 py-1 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
        />
        <button
          type="button"
          onClick={() => {
            onEdit(draft);
            setEditing(false);
          }}
          className="shrink-0 text-primary-bright"
          aria-label="Save"
        >
          <Check className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right text-foreground">
        <span className={cn(confidence === "INFERRED" && "italic text-muted")}>{value}</span>
        {confidence === "INFERRED" && <span className="text-[10px] uppercase tracking-wide text-muted/70">AI guess</span>}
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${label}`} className="text-muted hover:text-primary-bright">
          <Pencil className="size-3" />
        </button>
      </dd>
    </div>
  );
}
