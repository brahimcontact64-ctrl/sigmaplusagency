"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLeadNoteAction } from "@/lib/actions/admin-crm";
import { Button } from "@/components/ui/button";

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const note = String(formData.get("note") ?? "").trim();
    if (!note) return;
    setError(null);
    startTransition(async () => {
      const result = await addLeadNoteAction(leadId, note);
      if (!result.success) {
        setError(result.error === "forbidden" ? "You don't have permission to do that." : "Could not save the note.");
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="note" className="sr-only">
        Internal note
      </label>
      <textarea
        id="note"
        name="note"
        rows={3}
        maxLength={2000}
        required
        placeholder="Add an internal note — visible to the admin team only."
        className="rounded-lg border border-border bg-void px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
      />
      {error && (
        <span role="alert" className="text-sm text-red-400">
          {error}
        </span>
      )}
      <Button type="submit" variant="outline" size="md" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
