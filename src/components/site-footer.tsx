import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/lib/site-config";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Wordmark className="text-foreground" />
          <p className="mt-2">{t("tagline")}</p>
        </div>
        <p>
          © {year} {siteConfig.legalName} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
