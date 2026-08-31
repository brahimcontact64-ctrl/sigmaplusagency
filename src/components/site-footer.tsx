import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/wordmark";
import { Link } from "@/i18n/navigation";
import { getEffectiveSiteConfig } from "@/lib/effective-config";

const FOOTER_LINKS: { key: "services" | "work" | "insights" | "about" | "contact"; href: string }[] = [
  { key: "services", href: "/services" },
  { key: "work", href: "/work" },
  { key: "insights", href: "/insights" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

/** A compact link list reinforces internal linking depth (see docs/SEO_STRATEGY.md "Internal linking") — every commercial page was already one click from the header nav, this just adds a second path from every page on the site. */
export async function SiteFooter() {
  const [t, tNav] = await Promise.all([getTranslations("footer"), getTranslations("nav")]);
  const year = new Date().getFullYear();
  const config = await getEffectiveSiteConfig();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Wordmark className="text-foreground" />
          <p className="mt-2">{t("tagline")}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.key} href={item.href} className="transition-colors hover:text-foreground">
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        <p>
          © {year} {config.legalName} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
