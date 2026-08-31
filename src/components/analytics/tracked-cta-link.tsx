"use client";

import { ButtonLink, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { track } from "@/lib/integrations/analytics";
import type { AnalyticsProps } from "@/domain/analytics-event";

/**
 * `ButtonLink` isn't a Client Component, so a Server Component page
 * can't hand it an `onClick` directly (a function prop can't cross the
 * server→client boundary to a non-client leaf). This thin client
 * wrapper owns the click handler itself so server pages (service/
 * case-study detail, etc.) can still fire `cta_click` on their primary
 * CTAs.
 */
export function TrackedCtaLink({
  ctaId,
  trackProps,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants> & { ctaId: string; trackProps?: AnalyticsProps }) {
  return (
    <ButtonLink
      {...props}
      onClick={() => track("cta_click", { ctaId, ...trackProps })}
    />
  );
}
