"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getConsentPreferences } from "@/lib/consent/consent-store";

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

/**
 * Optional GA4 **outbound** client adapter (Phase 9 §28) — deliberately
 * distinct from Phase 8's inbound GA4 *reporting* adapter in
 * `src/lib/seo/adapters/analytics-reporting.ts`, which reads data back
 * via a service account and has nothing to do with this script. No
 * `NEXT_PUBLIC_GA4_MEASUREMENT_ID` → renders nothing, and the site
 * works identically either way. When configured, it only loads after
 * the visitor has accepted the optional MARKETING/analytics consent
 * category (see `consent-banner.tsx`) — never before.
 */
export function Ga4Outbound() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only cookie read, not a render cascade
    setAllowed(getConsentPreferences()?.analytics === true);
  }, []);

  if (!GA4_MEASUREMENT_ID || !allowed) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
