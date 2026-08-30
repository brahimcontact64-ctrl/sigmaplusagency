"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

const LABELS: Record<string, string> = {
  fr: "FR",
  ar: "AR",
  en: "EN",
  de: "DE",
};

export function LanguageSwitcher({
  currentLocale,
  locales,
}: {
  currentLocale: string;
  locales: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-current={locale === currentLocale}
          onClick={() => router.replace(pathname, { locale })}
          className={
            locale === currentLocale
              ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-foreground"
              : "rounded-full px-3 py-1 text-xs font-semibold text-muted hover:text-foreground"
          }
        >
          {LABELS[locale] ?? locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
