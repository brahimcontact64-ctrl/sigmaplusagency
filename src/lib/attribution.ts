export type ClientAttribution = {
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

/**
 * Read once, client-side, at the point a form is submitted — not
 * stored in any tracking cookie. Only what's useful for attributing a
 * lead to a channel; nothing invasive.
 */
export function getClientAttribution(): ClientAttribution {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    landingPage: window.location.href.slice(0, 500),
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
  };
}
