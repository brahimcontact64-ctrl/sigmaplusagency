"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArticleAction } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";
import { ARTICLE_TYPES, ARTICLE_CATEGORIES } from "@/domain/article";
import { locales } from "@/i18n/routing";

export function ArticleCreateForm({ defaultAuthor }: { defaultAuthor: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>(ARTICLE_TYPES[0]);
  const [category, setCategory] = useState<string>(ARTICLE_CATEGORIES[0]);
  const [author, setAuthor] = useState(defaultAuthor);
  const [locale, setLocale] = useState<string>(locales[0]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createArticleAction({
        article: { type, category, author, tags: [], featured: false, relatedServices: [], relatedCaseStudies: [] },
        translation: { locale, slug, title, description, excerpt, content: "" },
      });
      if (!result.success) {
        setError(result.error === "slug_taken" ? "That slug is already used in this locale." : "Could not create the article.");
        return;
      }
      router.push(`/admin/content/${result.articleId}/${locale}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {ARTICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            {ARTICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Author">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
        </Field>
        <Field label="First locale">
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={selectClass}>
            {locales.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
      </Field>
      <Field label="Slug">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="how-to-plan-a-business-website" required />
      </Field>
      <Field label="Description (meta description)">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
      </Field>
      <Field label="Excerpt (index/card summary)">
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
      </Field>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}

const inputClass = "rounded-lg border border-border bg-void px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright";
const selectClass = `${inputClass} h-10`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
