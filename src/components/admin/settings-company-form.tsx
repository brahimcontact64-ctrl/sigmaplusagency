"use client";

import { useState, useTransition } from "react";
import { updateSettingAction } from "@/lib/actions/admin-settings";
import { Button } from "@/components/ui/button";
import type { CompanyIdentitySetting } from "@/domain/settings";

const DEFAULTS: CompanyIdentitySetting = {
  companyName: "",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
};

export function SettingsCompanyForm({ initial }: { initial?: CompanyIdentitySetting }) {
  const [values, setValues] = useState<CompanyIdentitySetting>(initial ?? DEFAULTS);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await updateSettingAction("company_identity", values);
      setStatus(result.success ? "saved" : "error");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField label="Company name" value={values.companyName} onChange={(v) => setValues({ ...values, companyName: v })} />
      <TextField label="Contact email" value={values.contactEmail} onChange={(v) => setValues({ ...values, contactEmail: v })} type="email" />
      <TextField label="Contact phone" value={values.contactPhone} onChange={(v) => setValues({ ...values, contactPhone: v })} />
      <TextField label="WhatsApp number" value={values.whatsappNumber} onChange={(v) => setValues({ ...values, whatsappNumber: v })} />
      <div className="flex items-center gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {status === "saved" && <span className="text-sm text-emerald-400">Saved.</span>}
        {status === "error" && <span className="text-sm text-red-400">Could not save. Check the values.</span>}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
      />
    </div>
  );
}
