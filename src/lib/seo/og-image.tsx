import { ImageResponse } from "next/og";

/**
 * One shared OG-image renderer for the default site card, service
 * pages, and case-study pages — see docs/SEO_STRATEGY.md "Open Graph
 * images". Programmatic (Satori/`next/og`), not a fake product
 * screenshot — matches the same "text/tag treatment, no photos"
 * philosophy already used for case-study visuals elsewhere in the app.
 *
 * Satori (the renderer behind `next/og`) does not shape Arabic script
 * correctly — rendering Arabic text here would produce visually broken
 * output, worse than no localized text at all. For `locale === "ar"`
 * this renders the brand-only card with no page-specific copy, a
 * deliberate graceful fallback rather than garbled text.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

export function renderOgImage(params: { locale: string; eyebrow?: string; title?: string }) {
  const canRenderText = params.locale !== "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #05070d 0%, #0b0f1a 65%, #171d2c 100%)",
          color: "#f4f6fb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path d="M25 7H9.5L17 16L9.5 25H25" stroke="#5B8CFF" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            <path d="M20.5 13V19M18 16H23" stroke="#22C7D9" strokeWidth="2.25" strokeLinecap="square" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>SIGMA+</div>
        </div>

        {canRenderText && params.eyebrow && (
          <div style={{ display: "flex", marginTop: 48, fontSize: 22, color: "#8b93a7", textTransform: "uppercase", letterSpacing: 4 }}>
            {params.eyebrow}
          </div>
        )}
        {canRenderText && params.title && (
          <div style={{ display: "flex", marginTop: 16, fontSize: 54, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>
            {params.title}
          </div>
        )}
        {!canRenderText && (
          <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: "#8b93a7" }}>Web · Mobile · SaaS · AI · Automation</div>
        )}
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
