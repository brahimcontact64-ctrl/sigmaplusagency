"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { ButtonLink, Button } from "@/components/ui/button";
import { reportError } from "@/lib/observability/error-reporter";

/**
 * Segment error boundary (Phase 10 §26) — catches a rendering error
 * anywhere under `[locale]` and shows a branded, friendly message
 * instead of Next's default unstyled fallback. Must be a Client
 * Component (React error boundaries only work client-side); renders
 * inside the locale layout's `NextIntlClientProvider`, so translated
 * copy is safe to use here. Never shows the raw error message or a
 * stack trace — only a short correlation id an admin could search
 * platform logs for.
 */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  const locale = useLocale();

  useEffect(() => {
    reportError(error, { component: "locale-error-boundary" });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-400/10 text-red-400">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 max-w-md text-muted">{t("description")}</p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted">
          {t("referenceLabel")}: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" onClick={reset}>
          {t("retry")}
        </Button>
        <ButtonLink href={`/${locale}`} variant="outline" size="lg">
          {t("home")}
        </ButtonLink>
      </div>
    </div>
  );
}
