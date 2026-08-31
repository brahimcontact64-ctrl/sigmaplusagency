type LegalSection = { heading: string; body: string };

/**
 * Shared body for the Privacy Policy and Terms pages (Phase 10 §55).
 * The draft-notice banner is not decorative — it's the honest,
 * required disclaimer that this is general information, not
 * lawyer-reviewed legal copy. Never remove it without an actual legal
 * review replacing it (see docs/LAUNCH_CHECKLIST.md).
 */
export function LegalPageBody({
  intro,
  sections,
  draftNotice,
  lastUpdatedLabel,
  lastUpdatedValue,
}: {
  intro: string;
  sections: LegalSection[];
  draftNotice: string;
  lastUpdatedLabel: string;
  lastUpdatedValue: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div role="note" className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
        {draftNotice}
      </div>

      <p className="text-sm text-muted">
        {lastUpdatedLabel}: {lastUpdatedValue}
      </p>

      <p className="mt-4 text-lg text-muted">{intro}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold">{section.heading}</h2>
            <p className="mt-2 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
