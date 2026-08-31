import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { ArticleMetaForm } from "@/components/admin/article-meta-form";
import { AddTranslationForm } from "@/components/admin/add-translation-form";
import { formatDateTime } from "@/lib/admin/format";
import { locales } from "@/i18n/routing";
import type { ContentStatus } from "@/domain/article";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleRepository().getArticle(id);
  return { title: article ? `Edit article — SIGMA+ Admin` : "Article not found — SIGMA+ Admin" };
}

export default async function ArticleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getArticleRepository();
  const article = await repo.getArticle(id);
  if (!article) notFound();

  const translations = await repo.getTranslationsForArticle(id);
  const existingLocales = new Set(translations.map((t) => t.locale));
  const availableLocales = locales.filter((l) => !existingLocales.has(l));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Article</h1>
        <p className="mt-1 text-sm text-muted">{article.type} · {article.category}</p>
      </div>

      <Section title="Translations">
        <ul className="flex flex-col divide-y divide-border">
          {translations.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <Link href={`/admin/content/${id}/${t.locale}`} className="font-medium text-foreground hover:text-primary-bright">
                  {t.title || "(untitled)"} <span className="text-xs uppercase text-muted">[{t.locale}]</span>
                </Link>
                <div className="mt-0.5 text-xs text-muted">Updated {formatDateTime(t.updatedAt)}</div>
              </div>
              <StatusBadge status={t.status} />
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <AddTranslationForm articleId={id} availableLocales={availableLocales} />
        </div>
      </Section>

      <Section title="Details">
        <ArticleMetaForm article={article} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const styles: Record<ContentStatus, string> = {
    DRAFT: "bg-muted/20 text-muted",
    REVIEW: "bg-amber-500/15 text-amber-400",
    PUBLISHED: "bg-emerald-500/15 text-emerald-400",
    ARCHIVED: "bg-red-500/15 text-red-400",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}
