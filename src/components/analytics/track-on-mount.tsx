"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/integrations/analytics";
import type { AnalyticsEventName, AnalyticsProps } from "@/domain/analytics-event";

/**
 * Fires one analytics event on mount — the bridge for Server Component
 * pages (service/case-study/article detail pages) that want a
 * content-specific "*_viewed" event but can't call the client-only
 * `track()` themselves. Renders nothing.
 */
export function TrackOnMount({ event, props }: { event: AnalyticsEventName; props?: AnalyticsProps }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount only, not on every prop identity change
  }, []);

  return null;
}
