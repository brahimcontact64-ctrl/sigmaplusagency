import { notFound } from "next/navigation";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { TranslationEditorForm } from "@/components/admin/translation-editor-form";
import { locales, type Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) return {};
  const translations = await getArticleRepository().getTranslationsForArticle(id);
  const translation = translations.find((t) => t.locale === locale);
  return { title: translation ? `${translation.title || "Untitled"} — SIGMA+ Admin` : "Not found — SIGMA+ Admin" };
}

export default async function ArticleTranslationEditPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();

  const translations = await getArticleRepository().getTranslationsForArticle(id);
  const translation = translations.find((t) => t.locale === (locale as Locale));
  if (!translation) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{translation.title || "Untitled"}</h1>
        <p className="mt-1 text-sm text-muted uppercase">{translation.locale} · {translation.status}</p>
      </div>
      <TranslationEditorForm articleId={id} translation={translation} />
    </div>
  );
}
