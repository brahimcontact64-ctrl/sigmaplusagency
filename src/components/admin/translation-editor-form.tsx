"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveTranslationAction,
  publishArticleAction,
  changeArticleStatusAction,
  changeArticleSlugAction,
} from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";
import type { ArticleTranslation, ContentStatus } from "@/domain/article";

export function TranslationEditorForm({ articleId, translation }: { articleId: string; translation: ArticleTranslation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [publishProblems, setPublishProblems] = useState<string[] | null>(null);

  const [title, setTitle] = useState(translation.title);
  const [description, setDescription] = useState(translation.description);
  const [excerpt, setExcerpt] = useState(translation.excerpt);
  const [content, setContent] = useState(translation.content);
  const [seoTitle, setSeoTitle] = useState(translation.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(translation.seoDescription ?? "");
  const [ogImage, setOgImage] = useState(translation.ogImage ?? "");
  const [slug, setSlug] = useState(translation.slug);
  const [slugError, setSlugError] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setPublishProblems(null);
    startTransition(async () => {
      const result = await saveTranslationAction(translation.id, articleId, {
        title,
        description,
        excerpt,
        content,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        ogImage: ogImage || undefined,
      });
      setStatus(result.success ? "saved" : "error");
      router.refresh();
    });
  }

  function handleSlugChange() {
    if (slug === translation.slug) return;
    setSlugError(null);
    startTransition(async () => {
      const result = await changeArticleSlugAction(translation.id, articleId, slug);
      if (!result.success) {
        setSlug(translation.slug);
        setSlugError(result.error === "slug_taken" ? "That slug is already used in this locale." : "Could not change the slug.");
        return;
      }
      router.refresh();
    });
  }

  function handlePublish() {
    setPublishProblems(null);
    startTransition(async () => {
      const result = await publishArticleAction(translation.id, articleId);
      if (!result.success) {
        setPublishProblems(result.problems ?? ["Could not publish."]);
        return;
      }
      router.refresh();
    });
  }

  function handleStatus(next: Exclude<ContentStatus, "PUBLISHED">) {
    startTransition(async () => {
      await changeArticleStatusAction(translation.id, articleId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="md" disabled={pending || translation.status === "PUBLISHED"} onClick={handlePublish}>
          Publish
        </Button>
        {translation.status === "PUBLISHED" ? (
          <Button type="button" variant="outline" size="md" disabled={pending} onClick={() => handleStatus("DRAFT")}>
            Unpublish to draft
          </Button>
        ) : (
          <Button type="button" variant="outline" size="md" disabled={pending} onClick={() => handleStatus("REVIEW")}>
            Mark for review
          </Button>
        )}
        <Button type="button" variant="ghost" size="md" disabled={pending} onClick={() => handleStatus("ARCHIVED")}>
          Archive
        </Button>
        {translation.status === "PUBLISHED" && (
          <Link
            href={`/${translation.locale}/insights/${translation.slug}`}
            target="_blank"
            className="text-sm font-medium text-primary-bright hover:underline"
          >
            View live ↗
          </Link>
        )}
        <Link href={`/admin/content/${articleId}/${translation.locale}/preview`} className="text-sm font-medium text-muted hover:text-foreground">
          Preview (auth-only)
        </Link>
      </div>

      {publishProblems && (
        <ul className="list-inside list-disc rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {publishProblems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={handleSlugChange} className={inputClass} />
        </div>
        {slugError && <span className="text-sm text-red-400">{slugError}</span>}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></Field>
        <Field label="Description (meta description)"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} /></Field>
        <Field label="Excerpt (index/card summary)"><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} /></Field>
        <Field label="Body (Markdown)"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className={`${inputClass} font-mono`} /></Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title override (optional)"><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} /></Field>
          <Field label="SEO description override (optional)"><input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="OG image URL (optional)"><input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className={inputClass} /></Field>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          {status === "saved" && <span className="text-sm text-emerald-400">Saved.</span>}
          {status === "error" && <span className="text-sm text-red-400">Could not save.</span>}
        </div>
      </form>
    </div>
  );
}

const inputClass = "rounded-lg border border-border bg-void px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
