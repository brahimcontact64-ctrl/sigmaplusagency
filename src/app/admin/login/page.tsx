import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { SigmaMark } from "@/components/brand/sigma-mark";

export const metadata: Metadata = { title: "Sign in — SIGMA+ Admin" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  const { passwordChanged } = await searchParams;

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <SigmaMark className="h-9 w-9 text-primary-bright" />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">SIGMA+ Admin</h1>
            <p className="text-sm text-muted">Internal access only.</p>
          </div>
        </div>
        {passwordChanged === "1" && (
          <p className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center text-sm text-emerald-400">
            Password updated. Sign in with your new password.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
