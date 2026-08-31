import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import type { Locale } from "@/i18n/routing";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const result = await getArticleRepository().findPublishedBySlug(locale, slug);
  return renderOgImage({ locale, eyebrow: result?.category ?? "SIGMA+", title: result?.translation.title });
}
