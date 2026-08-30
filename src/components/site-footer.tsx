import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/wordmark";
import { getEffectiveSiteConfig } from "@/lib/effective-config";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  const config = await getEffectiveSiteConfig();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Wordmark className="text-foreground" />
          <p className="mt-2">{t("tagline")}</p>
        </div>
        <p>
          © {year} {config.legalName} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
