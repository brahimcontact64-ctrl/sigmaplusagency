import { notFound } from "next/navigation";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { ArticleBody } from "@/components/content/article-body";
import { locales, type Locale } from "@/i18n/routing";

export const metadata = { title: "Preview — SIGMA+ Admin", robots: { index: false, follow: false } };

/**
 * Auth-only preview (Phase 8 §13) — reachable only through the admin
 * layout's `requireActor()`, no separate token system. Never indexable
 * (inherits the admin root layout's noindex, restated here too), and
 * shows the translation regardless of status so a DRAFT can genuinely
 * be reviewed before publishing.
 */
export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();

  const translations = await getArticleRepository().getTranslationsForArticle(id);
  const translation = translations.find((t) => t.locale === (locale as Locale));
  if (!translation) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
        Preview only — status: {translation.status}. This page is never public or indexable.
      </div>
      <h1 className="text-3xl font-bold text-foreground">{translation.title}</h1>
      <p className="mt-3 text-muted">{translation.excerpt}</p>
      <div className="mt-8">
        <ArticleBody content={translation.content} />
      </div>
    </div>
  );
}
