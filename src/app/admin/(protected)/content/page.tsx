import Link from "next/link";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { EmptyState } from "@/components/admin/empty-state";
import { formatDateTime } from "@/lib/admin/format";
import { CONTENT_STATUSES, ARTICLE_CATEGORIES } from "@/domain/article";
import { locales } from "@/i18n/routing";
import type { ContentStatus, ArticleCategory } from "@/domain/article";
import type { Locale } from "@/i18n/routing";

export const metadata = { title: "Content — SIGMA+ Admin" };
const PAGE_SIZE = 20;

function isStatus(v: string): v is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(v);
}
function isCategory(v: string): v is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(v);
}
function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const get = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : undefined);

  const status = get("status");
  const locale = get("locale");
  const category = get("category");
  const search = get("search");
  const page = Math.max(1, Number(get("page") ?? "1") || 1);

  const { items, total } = await getArticleRepository().listForAdmin(
    {
      status: status && isStatus(status) ? status : undefined,
      locale: locale && isLocale(locale) ? locale : undefined,
      category: category && isCategory(category) ? category : undefined,
      search,
    },
    page,
    PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content</h1>
          <p className="mt-1 text-sm text-muted">{total} translation(s) across all articles.</p>
        </div>
        <Link href="/admin/content/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary-bright">
          New article
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-muted">Search</label>
          <input id="search" name="search" defaultValue={search} placeholder="Title, slug…" className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright" />
        </div>
        <FilterSelect name="status" label="Status" defaultValue={status} options={CONTENT_STATUSES as unknown as string[]} />
        <FilterSelect name="locale" label="Locale" defaultValue={locale} options={locales as unknown as string[]} />
        <FilterSelect name="category" label="Category" defaultValue={category} options={ARTICLE_CATEGORIES as unknown as string[]} />
        <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-foreground hover:bg-primary-bright">Apply</button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="No content yet" hint="Create your first article to see it here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Locale</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.translation.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/content/${item.id}/${item.translation.locale}`} className="font-medium text-foreground hover:text-primary-bright">
                        {item.translation.title || "(untitled)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 uppercase text-muted">{item.translation.locale}</td>
                    <td className="px-4 py-3 text-muted">{item.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.translation.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(item.translation.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <PageLink searchParams={raw} page={Math.max(1, page - 1)} disabled={page <= 1} label="Previous" />
              <PageLink searchParams={raw} page={Math.min(totalPages, page + 1)} disabled={page >= totalPages} label="Next" />
            </div>
          </div>
        </>
      )}
    </div>
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

function FilterSelect({ name, label, defaultValue, options }: { name: string; label: string; defaultValue?: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs font-medium text-muted">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue ?? ""} className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PageLink({ searchParams, page, disabled, label }: { searchParams: Record<string, string | string[] | undefined>; page: number; disabled: boolean; label: string }) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && key !== "page") qs.set(key, value);
  }
  qs.set("page", String(page));
  return (
    <Link
      href={`?${qs.toString()}`}
      aria-disabled={disabled}
      className={`rounded-lg border border-border px-3 py-1.5 ${disabled ? "pointer-events-none opacity-40" : "hover:border-primary-bright hover:text-primary-bright"}`}
    >
      {label}
    </Link>
  );
}
