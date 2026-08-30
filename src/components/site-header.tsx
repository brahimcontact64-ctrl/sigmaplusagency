import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SIGMA<span className="text-primary-bright">+</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <Link href="/#services" className="hover:text-foreground transition-colors">
            {t("services")}
          </Link>
          <Link href="/#work" className="hover:text-foreground transition-colors">
            {t("work")}
          </Link>
          <Link href="/#contact" className="hover:text-foreground transition-colors">
            {t("contact")}
          </Link>
        </nav>

        <LanguageSwitcher currentLocale={locale} locales={routing.locales} />
      </div>
    </header>
  );
}
