import type { Locale } from "@/i18n/routing";
import type { ServiceId, LocalizedServiceContentMap } from "@/domain/service";
import { SERVICE_IDS } from "@/domain/service";
import { matchesSlug } from "@/lib/slug";
import { servicesFr } from "./fr";
import { servicesEn } from "./en";
import { servicesAr } from "./ar";
import { servicesDe } from "./de";
import { servicesMeta } from "./meta";

const byLocale: Record<Locale, LocalizedServiceContentMap> = {
  fr: servicesFr,
  en: servicesEn,
  ar: servicesAr,
  de: servicesDe,
};

export function getAllServiceIds(): readonly ServiceId[] {
  return SERVICE_IDS;
}

export function getServiceContent(locale: Locale, id: ServiceId) {
  return byLocale[locale][id];
}

export function getServiceMeta(id: ServiceId) {
  return servicesMeta[id];
}

export function getServiceBySlug(locale: Locale, slug: string): ServiceId | undefined {
  const map = byLocale[locale];
  return SERVICE_IDS.find((id) => matchesSlug(map[id].slug, slug));
}

export function getServiceSlug(locale: Locale, id: ServiceId): string {
  return byLocale[locale][id].slug;
}

export { servicesMeta };
