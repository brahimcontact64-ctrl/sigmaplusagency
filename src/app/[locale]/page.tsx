import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { WhatWeBuildSection } from "@/components/sections/what-we-build-section";
import { WorkSection } from "@/components/sections/work-section";
import { WhySection } from "@/components/sections/why-section";
import { CtaSection } from "@/components/sections/cta-section";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site-config";
import { getServiceContent } from "@/content/services";
import { getAllProjectIds, getCaseStudyContent } from "@/content/case-studies";
import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "@/domain/service";

const HOMEPAGE_SERVICE_IDS: ServiceId[] = [
  "web-development",
  "mobile-applications",
  "ecommerce",
  "saas-platforms",
  "ai-agents",
  "seo-growth",
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hero = await getTranslations("hero");
  const services = await getTranslations("services");
  const servicesPage = await getTranslations("servicesPage");
  const work = await getTranslations("work");
  const why = await getTranslations("why");
  const contact = await getTranslations("contact");

  const heroCopy = {
    eyebrow: hero("eyebrow"),
    headlineLine1: hero("headlineLine1"),
    headlineLine2: hero("headlineLine2"),
    subheadline: hero("subheadline"),
    ctaPrimary: hero("ctaPrimary"),
    ctaWhatsapp: hero("ctaWhatsapp"),
    ctaWork: hero("ctaWork"),
  };

  const serviceItems = HOMEPAGE_SERVICE_IDS.map((id) => {
    const content = getServiceContent(locale, id);
    return { slug: content.slug, title: content.title, description: content.positioning };
  });

  const projectItems = getAllProjectIds().map((id) => {
    const content = getCaseStudyContent(locale, id);
    return { slug: content.slug, name: content.name, tag: content.tag, description: content.summary };
  });

  const whyItems = why.raw("items") as { title: string; description: string }[];

  const heroWhatsappUrl = buildWhatsAppUrl(`${hero("headlineLine1")} ${hero("headlineLine2")}`);
  const contactWhatsappUrl = buildWhatsAppUrl(contact("title"));

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.legalName,
    url: siteConfig.url,
    email: siteConfig.contactEmail,
    telephone: siteConfig.contactPhone,
    areaServed: ["DZ", "FR", "DE", "AE"],
    availableLanguage: ["fr", "ar", "en", "de"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <SiteHeader locale={locale} />

      <main className="flex-1">
        <HeroSection hero={heroCopy} whatsappHref={heroWhatsappUrl} startProjectHref={`/${locale}/start-project`} />

        <WhatWeBuildSection
          title={services("title")}
          subtitle={services("subtitle")}
          seeAllLabel={servicesPage("seeAll")}
          items={serviceItems}
        />

        <WorkSection
          title={work("title")}
          subtitle={work("subtitle")}
          viewProjectLabel={work("viewProject")}
          projects={projectItems}
        />

        <WhySection title={why("title")} subtitle={why("subtitle")} items={whyItems} />

        <CtaSection
          title={contact("title")}
          subtitle={contact("subtitle")}
          whatsappLabel={contact("whatsapp")}
          whatsappHref={contactWhatsappUrl}
          startProjectLabel={hero("ctaPrimary")}
          startProjectHref={`/${locale}/start-project`}
        />
      </main>

      <SiteFooter />
    </>
  );
}
