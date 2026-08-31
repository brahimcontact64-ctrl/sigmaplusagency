import { getTranslations } from "next-intl/server";
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import type { Locale } from "@/i18n/routing";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;
export const alt = "SIGMA+ Agency";

export default async function Image({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  return renderOgImage({ locale, eyebrow: t("eyebrow"), title: t("headlineLine1") });
}
