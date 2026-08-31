"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { track } from "@/lib/integrations/analytics";
import { classifyPageType } from "@/lib/analytics/page-type";
import type { Locale } from "@/i18n/routing";

/**
 * Mounted once in the [locale] layout — fires `page_view` on the
 * initial load and on every client-side route change (App Router
 * navigations don't trigger a full reload, so this can't just be a
 * server-side event). Deliberately outside the [locale] tree's admin
 * routes never mount this layout at all, so Admin traffic is never
 * counted here.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    track("page_view", { locale, pageType: classifyPageType(pathname) });
  }, [pathname, locale]);

  return null;
}
