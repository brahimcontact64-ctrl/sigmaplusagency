"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary (Phase 10 §26) — only triggers when the
 * error happens in the ROOT layout itself (rare: a failure inside
 * `[locale]/layout.tsx` before `error.tsx` in that segment can even
 * mount). Deliberately has zero dependency on next-intl, site content,
 * or Tailwind's runtime — whatever broke the root layout could be
 * exactly the thing this page also depends on, so this stays maximally
 * self-contained: inline styles, no translations, no external
 * component imports. It must render its own `<html>`/`<body>` since it
 * replaces the entire document.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#05070d",
          color: "#f4f6fb",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#9aa3b2", maxWidth: 420, margin: 0 }}>
          An unexpected error occurred. Please try again shortly.
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9aa3b2", margin: 0 }}>Reference: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.65rem 1.5rem",
            borderRadius: "9999px",
            border: "none",
            background: "#3B82F6",
            color: "#05070d",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
