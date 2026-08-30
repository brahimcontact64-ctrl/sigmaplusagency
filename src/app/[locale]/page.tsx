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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hero = await getTranslations("hero");
  const services = await getTranslations("services");
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

  const serviceItems = services.raw("items") as { title: string; description: string }[];
  const projects = work.raw("projects") as { name: string; tag: string; description: string }[];
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
        <HeroSection hero={heroCopy} whatsappHref={heroWhatsappUrl} />

        <WhatWeBuildSection
          title={services("title")}
          subtitle={services("subtitle")}
          items={serviceItems}
        />

        <WorkSection title={work("title")} subtitle={work("subtitle")} projects={projects} />

        <WhySection title={why("title")} subtitle={why("subtitle")} items={whyItems} />

        <CtaSection
          title={contact("title")}
          subtitle={contact("subtitle")}
          whatsappLabel={contact("whatsapp")}
          whatsappHref={contactWhatsappUrl}
        />
      </main>

      <SiteFooter />
    </>
  );
}
