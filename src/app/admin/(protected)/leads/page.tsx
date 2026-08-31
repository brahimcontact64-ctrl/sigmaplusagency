import Link from "next/link";
import { getCrmService } from "@/lib/services/crm-service";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { LEAD_STATUSES, LEAD_SOURCES, isValidLeadStatus, type LeadSource } from "@/domain/lead";
import { PROJECT_TYPES } from "@/domain/project-request";
import { locales } from "@/i18n/routing";
import type { LeadListSort } from "@/lib/repositories/crm-repository";

export const metadata = { title: "Leads — SIGMA+ Admin" };

const PAGE_SIZE = 20;

function isValidSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

function buildQuery(params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const get = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : undefined);

  const search = get("search");
  const status = get("status");
  const source = get("source");
  const projectType = get("projectType");
  const language = get("language");
  const page = Math.max(1, Number(get("page") ?? "1") || 1);

  const sort: LeadListSort = { field: "createdAt", direction: "desc" };

  const result = await getCrmService().listLeads(
    {
      search,
      status: status && isValidLeadStatus(status) ? status : undefined,
      source: source && isValidSource(source) ? source : undefined,
      projectType: projectType || undefined,
      language: language || undefined,
    },
    sort,
    page,
    PAGE_SIZE,
  );

  const currentParams = { search, status, source, projectType, language, page: String(page) };
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
        <p className="text-sm text-muted">{result.total} total</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-muted">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Reference, name, email, phone, company…"
            className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
          />
        </div>

        <FilterSelect name="status" label="Status" defaultValue={status} options={LEAD_STATUSES as unknown as string[]} />
        <FilterSelect name="source" label="Source" defaultValue={source} options={LEAD_SOURCES as unknown as string[]} />
        <FilterSelect name="projectType" label="Project type" defaultValue={projectType} options={PROJECT_TYPES as unknown as string[]} />
        <FilterSelect name="language" label="Language" defaultValue={language} options={locales as unknown as string[]} />

        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-foreground hover:bg-primary-bright"
        >
          Apply
        </button>
        {(search || status || source || projectType || language) && (
          <Link href="/admin/leads" className="h-10 rounded-lg px-3 text-sm text-muted underline-offset-2 hover:underline">
            Clear
          </Link>
        )}
        <Link
          href={`/admin/leads/export${buildQuery(currentParams, { page: undefined })}`}
          className="ml-auto h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-primary-bright hover:text-primary-bright"
        >
          Export CSV
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="No leads match this filter"
          hint={result.total === 0 ? "No leads yet — new submissions will show up here." : "Try widening or clearing the filters."}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      <Link href={`/admin/leads/${lead.id}`} className="hover:text-primary-bright">
                        {lead.publicReference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{lead.name}</td>
                    <td className="px-4 py-3 text-muted">{lead.company ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{lead.latestProjectType ?? "—"}</td>
                    <td className="px-4 py-3 text-muted uppercase">{lead.language}</td>
                    <td className="px-4 py-3 text-muted">{lead.source}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(lead.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {lead.lastActivityAt ? formatRelative(lead.lastActivityAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={buildQuery(currentParams, { page: String(Math.max(1, page - 1)) })}
                aria-disabled={page <= 1}
                className={`rounded-lg border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-primary-bright hover:text-primary-bright"}`}
              >
                Previous
              </Link>
              <Link
                href={buildQuery(currentParams, { page: String(Math.min(totalPages, page + 1)) })}
                aria-disabled={page >= totalPages}
                className={`rounded-lg border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-primary-bright hover:text-primary-bright"}`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-lg border border-border bg-void px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
