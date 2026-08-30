import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getEffectiveWhatsAppUrl } from "@/lib/effective-config";
import { HeaderClient } from "./header-client";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const hero = await getTranslations("hero");

  const nav = {
    services: t("services"),
    work: t("work"),
    about: t("about"),
    contact: t("contact"),
    startProject: t("startProject"),
    aiConsultant: t("aiConsultant"),
  };

  const whatsappHref = await getEffectiveWhatsAppUrl(hero("ctaWhatsapp"));

  return (
    <HeaderClient
      locale={locale}
      locales={routing.locales}
      nav={nav}
      whatsappHref={whatsappHref}
    />
  );
}
