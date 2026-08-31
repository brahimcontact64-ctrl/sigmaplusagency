"use client";

import { useState, useTransition } from "react";
import { updateArticleMetaAction } from "@/lib/actions/admin-content-meta";
import { Button } from "@/components/ui/button";
import { ARTICLE_TYPES, ARTICLE_CATEGORIES, type Article } from "@/domain/article";
import { SERVICE_IDS } from "@/domain/service";
import { PROJECT_IDS } from "@/domain/case-study";

export function ArticleMetaForm({ article }: { article: Article }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [type, setType] = useState(article.type);
  const [category, setCategory] = useState(article.category);
  const [tags, setTags] = useState(article.tags.join(", "));
  const [featured, setFeatured] = useState(article.featured);
  const [relatedServices, setRelatedServices] = useState<string[]>(article.relatedServices);
  const [relatedCaseStudies, setRelatedCaseStudies] = useState<string[]>(article.relatedCaseStudies);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const result = await updateArticleMetaAction(article.id, {
        type,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        featured,
        relatedServices,
        relatedCaseStudies,
      });
      setSaved(result.success);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass}>
            {ARTICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={selectClass}>
            {ARTICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Tags (comma-separated, editorial/filtering only)">
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured on the Insights index
      </label>

      <Field label="Related services">
        <div className="flex flex-wrap gap-2">
          {SERVICE_IDS.map((id) => (
            <Chip key={id} active={relatedServices.includes(id)} onClick={() => toggle(relatedServices, setRelatedServices, id)}>{id}</Chip>
          ))}
        </div>
      </Field>
      <Field label="Related case studies">
        <div className="flex flex-wrap gap-2">
          {PROJECT_IDS.map((id) => (
            <Chip key={id} active={relatedCaseStudies.includes(id)} onClick={() => toggle(relatedCaseStudies, setRelatedCaseStudies, id)}>{id}</Chip>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
        {saved && <span className="text-sm text-emerald-400">Saved.</span>}
      </div>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-primary-bright bg-primary/10 text-primary-bright" : "border-border text-muted hover:text-foreground"}`}
    >
      {children}
    </button>
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
