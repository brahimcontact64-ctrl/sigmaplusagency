import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { getCrmService } from "@/lib/services/crm-service";
import { getAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { requireActor } from "@/lib/auth/dal";
import { ANALYTICS_VIEWER_ROLES } from "@/domain/admin-user";
import { StatusBadge } from "@/components/admin/status-badge";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { LeadNoteForm } from "@/components/admin/lead-note-form";
import { EmptyState } from "@/components/ui/empty-state";
import { AiConsultationSection } from "@/components/admin/ai-consultation-section";
import { DealForm } from "@/components/admin/deal-form";
import { formatDateTime, activityLabel } from "@/lib/admin/format";
import { formatBudgetAmount } from "@/config/budget-ranges";
import type { ProjectRequest } from "@/domain/project-request";

/**
 * Phase 11 §6 — shows the real captured currency/amount range when
 * present, so an OWNER/ADMIN can tell a DZD budget apart from a EUR
 * one without parsing the id. Rows created before this existed have
 * no `budgetCurrency` and fall back to just the stable id — never
 * guessed as a currency it wasn't actually shown in.
 */
function formatBudgetField(pr: ProjectRequest): string {
  if (!pr.budgetCurrency) return pr.budgetRange;
  const min = pr.budgetMinAmount !== undefined ? formatBudgetAmount(pr.budgetMinAmount, pr.budgetCurrency, "en-US") : undefined;
  const max = pr.budgetMaxAmount !== undefined ? formatBudgetAmount(pr.budgetMaxAmount, pr.budgetCurrency, "en-US") : undefined;
  const range = min && max ? `${min} – ${max}` : (min ?? max);
  return range ? `${pr.budgetRange} (${range})` : pr.budgetRange;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getCrmService().getLeadDetail(id);
  return { title: detail ? `${detail.lead.publicReference} — SIGMA+ Admin` : "Lead not found — SIGMA+ Admin" };
}

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, actor] = await Promise.all([getCrmService().getLeadDetail(id), requireActor()]);
  if (!detail) notFound();

  const { lead, projectRequests, activities, notes } = detail;
  const canExport = ANALYTICS_VIEWER_ROLES.includes(actor.role);

  const aiConversation = await getAiConversationRepository().findByLeadId(lead.id);
  const aiMessages = aiConversation ? await getAiConversationRepository().listMessages(aiConversation.id) : [];

  const attribution = [
    ["Landing page", lead.landingPage],
    ["Referrer", lead.referrer],
    ["UTM source", lead.utmSource],
    ["UTM medium", lead.utmMedium],
    ["UTM campaign", lead.utmCampaign],
    ["UTM content", lead.utmContent],
    ["UTM term", lead.utmTerm],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-semibold text-foreground">{lead.publicReference}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted">{lead.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <Link
              href={`/admin/leads/${lead.id}/export`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary-bright hover:text-primary-bright"
            >
              <Download className="size-3.5" />
              Export data (JSON)
            </Link>
          )}
          <LeadStatusSelect leadId={lead.id} status={lead.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Identity">
          <Field label="Name" value={lead.name} />
          <Field label="Company" value={lead.company} />
          <Field label="Country" value={lead.country} />
          <Field label="Language" value={lead.language.toUpperCase()} />
          <Field label="Source" value={lead.source} />
        </Section>

        <Section title="Contact information">
          <Field label="Email" value={lead.email} />
          <Field label="Phone" value={lead.phone} />
          <Field label="Preferred contact" value={lead.preferredContactMethod} />
        </Section>

        <Section title="Attribution">
          {attribution.length > 0 ? (
            attribution.map(([label, value]) => <Field key={label} label={label} value={value} />)
          ) : (
            <p className="text-sm text-muted">No attribution captured for this lead.</p>
          )}
        </Section>

        <Section title="Metadata">
          <Field label="Created" value={formatDateTime(lead.createdAt)} />
          <Field label="Last updated" value={formatDateTime(lead.updatedAt)} />
          {lead.wonAt && <Field label="Won at" value={formatDateTime(lead.wonAt)} />}
          <Field label="Internal ID" value={lead.id} mono />
        </Section>

        <Section title="Deal">
          <DealForm lead={lead} />
        </Section>
      </div>

      <Section title={`Project requests (${projectRequests.length})`}>
        {projectRequests.length === 0 ? (
          <p className="text-sm text-muted">No structured project request submitted yet — this lead came from the contact form only.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {projectRequests.map((pr) => (
              <div key={pr.id} className="rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-muted">
                  <span>{formatDateTime(pr.createdAt)}</span>
                  <span className="uppercase">{pr.locale}</span>
                </div>
                {pr.message && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-muted">Idea / project description</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{pr.message}</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project type" value={pr.projectType} />
                  <Field label="Business state" value={pr.businessState} />
                  <Field label="Timeline" value={pr.timeline} />
                  <Field label="Budget range" value={formatBudgetField(pr)} />
                  <Field label="Current website" value={pr.currentWebsite} />
                  {/*
                    Project Builder v2 — goals/capabilities/platforms are
                    no longer collected in the primary flow, so an empty
                    array is now the normal case for a short-form
                    request, not a data-loading bug. `Field` silently
                    hides an empty value everywhere else in this page,
                    which would make that ambiguous here — explicitly
                    say "Not provided yet" so it reads as "not asked",
                    distinct from a lead that supplied these via the
                    optional qualification step or the AI Consultant.
                  */}
                  <FieldOrNote label="Goals" values={pr.goals} note="Not provided yet — short-form request." />
                  <FieldOrNote label="Capabilities" values={pr.capabilities} note="Not provided yet — short-form request." />
                  <FieldOrNote label="Platforms" values={pr.platforms} note="Not provided yet — short-form request." />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted">Structured brief</div>
                  <dl className="mt-1 flex flex-col gap-1 text-sm">
                    <Field label="Business context" value={pr.structuredBrief.businessContext} />
                    {pr.structuredBrief.openQuestions.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted">Open questions</div>
                        <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                          {pr.structuredBrief.openQuestions.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {aiConversation && <AiConsultationSection conversation={aiConversation} messages={aiMessages} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Activity timeline">
          {activities.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ol className="flex flex-col gap-3 border-s border-border ps-4">
              {activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <div className="text-foreground">{activityLabel(activity.type, activity.metadata)}</div>
                  <div className="text-xs text-muted">{formatDateTime(activity.createdAt)}</div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Internal notes">
          <LeadNoteForm leadId={lead.id} />
          {notes.length > 0 && (
            <ol className="mt-4 flex flex-col gap-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-lg bg-graphite/60 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-foreground">{note.note}</p>
                  <div className="mt-1.5 text-xs text-muted">
                    {note.authorName} · {formatDateTime(note.createdAt)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-foreground" : "text-sm text-foreground"}>{value}</dd>
    </div>
  );
}

/** Like `Field`, but for a list value that's *expected* to sometimes be empty (Project Builder v2 — see the call site above) — shows an explicit note instead of silently disappearing, so "not asked" reads distinctly from a rendering bug. */
function FieldOrNote({ label, values, note }: { label: string; values: string[]; note: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={values.length > 0 ? "text-sm text-foreground" : "text-sm italic text-muted"}>
        {values.length > 0 ? values.join(", ") : note}
      </dd>
    </div>
  );
}
