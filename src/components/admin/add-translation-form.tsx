"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTranslationAction } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

export function AddTranslationForm({ articleId, availableLocales }: { articleId: string; availableLocales: Locale[] }) {
  const router = useRouter();
  const [locale, setLocale] = useState(availableLocales[0]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (availableLocales.length === 0) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addTranslationAction(articleId, { locale, slug, title, description: "", excerpt: "", content: "" });
      if (!result.success) {
        setError(result.error === "slug_taken" ? "That slug is already used in this locale." : "Could not add the translation.");
        return;
      }
      router.push(`/admin/content/${articleId}/${locale}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted">Locale</label>
        <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground">
          {availableLocales.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>
      <div className="flex min-w-[180px] flex-col gap-1">
        <label className="text-xs font-medium text-muted">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground" />
      </div>
      <div className="flex min-w-[180px] flex-col gap-1">
        <label className="text-xs font-medium text-muted">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Adding…" : "Add translation"}</Button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
