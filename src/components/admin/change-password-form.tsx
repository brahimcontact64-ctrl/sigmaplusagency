"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/admin-auth";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-3">
      <PasswordField id="currentPassword" label="Current password" autoComplete="current-password" />
      <PasswordField id="newPassword" label="New password" autoComplete="new-password" hint="At least 12 characters, with a letter and a number." />
      <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" />

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="outline" size="md" disabled={pending} className="self-start">
        {pending ? "Updating…" : "Change password"}
      </Button>
      <p className="text-xs text-muted">You&apos;ll be signed out and asked to log in again with the new password.</p>
    </form>
  );
}

function PasswordField({ id, label, autoComplete, hint }: { id: string; label: string; autoComplete: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        required
        autoComplete={autoComplete}
        className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
