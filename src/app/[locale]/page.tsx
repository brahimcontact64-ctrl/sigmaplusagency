import { getTranslations, setRequestLocale } from "next-intl/server";
import { Rocket, ArrowRight, MessageCircle, Mail, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
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
  const contact = await getTranslations("contact");

  const serviceItems = services.raw("items") as { title: string; description: string }[];
  const projects = work.raw("projects") as { name: string; description: string }[];

  const heroWhatsappUrl = buildWhatsAppUrl(
    `${hero("headline")} — ${hero("ctaWhatsapp")}`,
  );
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
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[-10%] mx-auto h-105 max-w-3xl rounded-full bg-primary/20 blur-[120px]"
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary-bright">
              {hero("eyebrow")}
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight sm:text-6xl">
              {hero("headline")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              {hero("subheadline")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink href="#contact" size="lg" className="w-full sm:w-auto">
                <Rocket className="size-5" />
                {hero("ctaPrimary")}
              </ButtonLink>
              <ButtonLink href="#work" variant="outline" size="lg" className="w-full sm:w-auto">
                {hero("ctaSecondary")}
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink
                href={heroWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
                className="w-full sm:w-auto"
              >
                <MessageCircle className="size-5" />
                {hero("ctaWhatsapp")}
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">{services("title")}</h2>
              <p className="mt-3 text-muted">{services("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {serviceItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary-bright"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Work */}
        <section id="work" className="border-y border-border bg-surface/40 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">{work("title")}</h2>
              <p className="mt-3 text-muted">{work("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="rounded-2xl border border-border bg-graphite p-8"
                >
                  <h3 className="text-xl font-bold">{project.name}</h3>
                  <p className="mt-3 text-sm text-muted">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{contact("title")}</h2>
            <p className="mt-3 text-muted">{contact("subtitle")}</p>

            <ButtonLink
              href={contactWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
              className="mt-8"
            >
              <MessageCircle className="size-5" />
              {contact("whatsapp")}
            </ButtonLink>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted sm:flex-row sm:gap-8">
              <span className="flex items-center gap-2">
                <Phone className="size-4" />
                <span dir="ltr">{siteConfig.contactPhone}</span>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="size-4" />
                <span dir="ltr">{siteConfig.contactEmail}</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
