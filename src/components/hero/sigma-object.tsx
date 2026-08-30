"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SigmaFallback } from "./sigma-fallback";

const SigmaScene = dynamic(() => import("./sigma-scene").then((m) => m.SigmaScene), {
  ssr: false,
  loading: () => <SigmaFallback />,
});

type NavigatorWithHeuristics = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function detectWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Decides, once on the client, whether this visitor gets the full 3D
 * flagship object, a lighter-quality version of it, or the static CSS
 * fallback. Never renders the heavy Three.js chunk unless it has
 * actually decided to — the dynamic import above keeps it out of the
 * initial bundle either way, so the hero's text and CTAs paint first
 * regardless of this decision.
 */
export function SigmaObject() {
  const [mode, setMode] = useState<"pending" | "fallback" | "reduced" | "full">("pending");

  useEffect(() => {
    // One-time client-only capability probe: matchMedia/WebGL/navigator
    // heuristics don't exist during SSR, so this can only run after mount.
    // It reads external browser/device state exactly once (empty deps) —
    // not a derived-state cascade — hence the scoped lint exception below.
    function detectQuality(): "fallback" | "reduced" | "full" {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion || !detectWebgl()) return "fallback";

      const nav = navigator as NavigatorWithHeuristics;
      const weakDevice =
        (nav.hardwareConcurrency ?? 8) <= 2 ||
        (nav.deviceMemory ?? 8) <= 2 ||
        nav.connection?.saveData === true;

      return weakDevice ? "reduced" : "full";
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only client capability read, not a render cascade
    setMode(detectQuality());
  }, []);

  if (mode === "pending") {
    return <SigmaFallback />;
  }

  if (mode === "fallback") {
    return <SigmaFallback />;
  }

  return <SigmaScene quality={mode} />;
}
