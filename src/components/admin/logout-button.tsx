"use client";

import { logoutAction } from "@/lib/actions/admin-auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        Log out
      </button>
    </form>
  );
}
