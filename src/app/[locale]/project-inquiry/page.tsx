import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { ProjectInquiryForm } from "@/components/project-inquiry/project-inquiry-form";
import { BUDGET_RANGES, formatBudgetRangeLabel } from "@/config/budget-ranges";
import { siteConfig } from "@/lib/site-config";
import { getEffectiveSiteConfig, getEffectiveWhatsAppUrl } from "@/lib/effective-config";
import { resolveCurrencyPreference } from "@/lib/pricing/currency-preference";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";
import type { ProjectTimeline } from "@/domain/project-request";
import type { InquiryService, UrgencyLevel, PurchaseIntentLevel } from "@/domain/project-inquiry";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projectInquiry" });

  return {
    title: `${t("title")} — ${siteConfig.name}`,
    description: t("subtitle"),
    alternates: buildFixedPathAlternates(locale, "/project-inquiry"),
  };
}

export default async function ProjectInquiryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projectInquiry");
  const tBuilder = await getTranslations("projectBuilder");
  const tBreadcrumbs = await getTranslations("breadcrumbs");

  const form = t.raw("form") as {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    serviceOptions: Record<InquiryService, string>;
    projectDescription: string;
    projectDescriptionHint: string;
    budget: string;
    desiredStart: string;
    urgency: string;
    urgencyOptions: Record<UrgencyLevel, string>;
    purchaseIntent: string;
    purchaseIntentOptions: Record<PurchaseIntentLevel, string>;
    submit: string;
    submitting: string;
    requiredError: string;
  };
  const successCopy = t.raw("success") as { title: string; description: string; cta: string };
  const errorsCopy = t.raw("errors") as {
    validation_error: string;
    rate_limited: string;
    db_unavailable: string;
    maintenance: string;
    unexpected: string;
  };

  const timelineLabels = tBuilder.raw("timeline") as Record<ProjectTimeline, string>;

  // Reusing Project Builder's own translated budget-band phrasing
  // (Phase 11 §5) rather than duplicating it — this is the same
  // BUDGET_RANGES config, currency-resolved the same way.
  const currency = await resolveCurrencyPreference();
  const budgetOptions = BUDGET_RANGES.map((range) => ({
    id: range.id,
    label: formatBudgetRangeLabel(range, currency, locale, (key, values) => tBuilder(`budgetTemplates.${key}` as never, values as never)),
  }));

  const effectiveConfig = await getEffectiveSiteConfig();
  const whatsappUrl = await getEffectiveWhatsAppUrl();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          title={t("title")}
          description={t("subtitle")}
          breadcrumbs={[{ label: tBreadcrumbs("home"), href: "/" }, { label: t("title") }]}
        />

        <div className="mx-auto max-w-4xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ProjectInquiryForm
                locale={locale}
                labels={form}
                success={successCopy}
                errors={errorsCopy}
                timelineLabels={timelineLabels}
                budgetOptions={budgetOptions}
                currencyLabel={tBuilder("currencySwitcher.label")}
                currencyHint={tBuilder("currencySwitcher.hint", { currency })}
                whatsappFallbackUrl={whatsappUrl}
                initialCurrency={currency}
              />
            </div>

            <aside className="space-y-4 lg:col-span-2">
              <ButtonLink
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
                className="w-full justify-center"
              >
                <MessageCircle className="size-5" />
                {t("whatsappAlternative")}
              </ButtonLink>

              <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span dir="ltr">{effectiveConfig.contactPhone}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Mail className="size-4" />
                  <span dir="ltr">{effectiveConfig.contactEmail}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
