import { requireActor } from "@/lib/auth/dal";
import { getSettingsService } from "@/lib/services/settings-service";
import { getCrmService } from "@/lib/services/crm-service";
import { SettingsCompanyForm } from "@/components/admin/settings-company-form";
import { SettingsLabelMapForm } from "@/components/admin/settings-label-map-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { formatDateTime } from "@/lib/admin/format";
import { SETTINGS_EDITOR_ROLES } from "@/domain/admin-user";
import { BUDGET_RANGE_IDS } from "@/config/budget-ranges";
import { LEAD_SOURCES } from "@/domain/lead";

export const metadata = { title: "Settings — SIGMA+ Admin" };

export default async function AdminSettingsPage() {
  const actor = await requireActor();
  const canEdit = SETTINGS_EDITOR_ROLES.includes(actor.role);
  const settings = await getSettingsService().getAll();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Company identity feeds the public site (see below). Budget/source labels remain CRM-internal for now — see the master plan.
        </p>
        {!canEdit && <p className="mt-2 text-sm text-amber-400">Your role ({actor.role}) can view but not edit settings.</p>}
      </div>

      <Section title="Account security" hint="Applies only to your own account.">
        <ChangePasswordForm />
      </Section>

      <Section title="Company identity" hint="Feeds the public site's header, footer, and WhatsApp links (falls back to environment variables when unset).">
        {canEdit ? (
          <SettingsCompanyForm initial={settings.company_identity} />
        ) : (
          <ReadOnlyDump value={settings.company_identity} />
        )}
      </Section>

      <Section title="Budget range labels" hint="Overrides the display label shown in the CRM for each canonical budget range ID.">
        {canEdit ? (
          <SettingsLabelMapForm settingKey="budget_range_labels" ids={BUDGET_RANGE_IDS} initial={settings.budget_range_labels} />
        ) : (
          <ReadOnlyDump value={settings.budget_range_labels} />
        )}
      </Section>

      <Section title="Lead source labels" hint="Overrides the display label shown in the CRM for each canonical lead source.">
        {canEdit ? (
          <SettingsLabelMapForm settingKey="lead_source_labels" ids={LEAD_SOURCES} initial={settings.lead_source_labels} />
        ) : (
          <ReadOnlyDump value={settings.lead_source_labels} />
        )}
      </Section>

      {actor.role === "OWNER" && <RecentAdminActivity />}
    </div>
  );
}

async function RecentAdminActivity() {
  const entries = await getCrmService().getRecentAuditLog(20);
  return (
    <Section title="Recent admin activity" hint="Security-sensitive actions only (logins, status changes, notes, settings). Owner-only.">
      {entries.length === 0 ? (
        <p className="text-sm text-muted">No recorded activity yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-foreground">
                {entry.action} <span className="text-muted">by {entry.actorEmail}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {hint && <p className="mt-1 mb-4 text-xs text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function ReadOnlyDump({ value }: { value?: Record<string, string> }) {
  if (!value || Object.keys(value).length === 0) return <p className="text-sm text-muted">Not configured yet.</p>;
  return (
    <dl className="grid gap-1.5 text-sm sm:grid-cols-2">
      {Object.entries(value).map(([key, val]) => (
        <div key={key} className="flex justify-between gap-3 rounded-lg bg-graphite/60 px-3 py-2">
          <dt className="text-muted">{key}</dt>
          <dd className="text-foreground">{val}</dd>
        </div>
      ))}
    </dl>
  );
}
