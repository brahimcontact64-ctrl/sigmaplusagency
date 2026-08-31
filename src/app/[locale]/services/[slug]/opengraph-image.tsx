import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import { getServiceBySlug, getServiceContent } from "@/content/services";
import type { Locale } from "@/i18n/routing";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const id = getServiceBySlug(locale, slug);
  const content = id ? getServiceContent(locale, id) : null;
  return renderOgImage({ locale, eyebrow: "SIGMA+", title: content?.title });
}
