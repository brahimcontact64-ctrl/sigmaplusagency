"use client";

import { useState, useTransition } from "react";
import { updateSettingAction } from "@/lib/actions/admin-settings";
import { Button } from "@/components/ui/button";

/** Generic canonical-id -> admin-facing-label editor, used for both budget ranges and lead sources — the IDs are fixed (never edited), only the display label is. */
export function SettingsLabelMapForm({
  settingKey,
  ids,
  initial,
}: {
  settingKey: string;
  ids: readonly string[];
  initial?: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(ids.map((id) => [id, initial?.[id] ?? ""])),
  );
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    const nonEmpty = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim().length > 0));
    startTransition(async () => {
      const result = await updateSettingAction(settingKey, nonEmpty);
      setStatus(result.success ? "saved" : "error");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {ids.map((id) => (
          <div key={id} className="flex flex-col gap-1">
            <label className="font-mono text-xs text-muted">{id}</label>
            <input
              value={values[id] ?? ""}
              placeholder={id}
              onChange={(e) => setValues({ ...values, [id]: e.target.value })}
              className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {status === "saved" && <span className="text-sm text-emerald-400">Saved.</span>}
        {status === "error" && <span className="text-sm text-red-400">Could not save.</span>}
      </div>
    </form>
  );
}
