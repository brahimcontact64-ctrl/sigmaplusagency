"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getConsentPreferences, setConsentPreferences } from "@/lib/consent/consent-store";

/**
 * Restrained consent UI (Phase 9 §30) — Accept / Reject optional /
 * Manage, no dark patterns (no pre-ticked analytics box, no
 * disproportionate visual weight on "Accept", no repeated nagging once
 * a choice is recorded). Essential site functionality (Contact,
 * Project Builder, AI Consultant, WhatsApp, CRM persistence) works
 * identically whether analytics is accepted or rejected — this banner
 * only gates the optional `track()` network call, never a feature.
 *
 * This is a restrained, honest implementation, not a certified legal
 * compliance product — which regulatory regime applies depends on the
 * launch market and requires its own legal review (Phase 9 §29).
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only cookie read, not a render cascade
    setVisible(getConsentPreferences() === null);
  }, []);

  if (!visible) return null;

  function acceptAll() {
    setConsentPreferences({ analytics: true, marketing: false });
    setVisible(false);
  }

  function rejectOptional() {
    setConsentPreferences({ analytics: false, marketing: false });
    setVisible(false);
  }

  function saveManaged() {
    setConsentPreferences({ analytics: analyticsChecked, marketing: false });
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label={t("manageTitle")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 p-4 backdrop-blur sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className="text-sm text-muted">{managing ? t("manageDescription") : t("message")}</p>

        {managing && (
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" checked disabled className="size-4" />
              {t("essentialLabel")}
            </label>
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={(e) => setAnalyticsChecked(e.target.checked)}
                className="size-4"
              />
              {t("analyticsLabel")}
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {managing ? (
            <Button type="button" size="md" onClick={saveManaged}>
              {t("save")}
            </Button>
          ) : (
            <>
              <Button type="button" size="md" onClick={acceptAll}>
                {t("accept")}
              </Button>
              <Button type="button" variant="outline" size="md" onClick={rejectOptional}>
                {t("rejectOptional")}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setManaging(true)}>
                {t("manage")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
