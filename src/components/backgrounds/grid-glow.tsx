/**
 * Reusable premium background layer: a technical grid, a soft blue glow,
 * and a hairline noise texture — all CSS/SVG, zero image requests, cheap
 * enough to sit behind any section without a GPU cost. Purely decorative
 * (aria-hidden) so it never adds accessibility noise.
 */
export function GridGlow({
  variant = "hero",
}: {
  variant?: "hero" | "section";
}) {
  const glowOpacity = variant === "hero" ? 0.35 : 0.18;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* technical grid */}
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-border) 70%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-border) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* soft electric-blue glow */}
      <div
        className="absolute left-1/2 top-[-20%] h-[560px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          opacity: glowOpacity,
          background:
            "radial-gradient(closest-side, var(--color-primary), transparent 70%)",
        }}
      />
      <div
        className="absolute right-[-10%] top-[10%] h-[360px] w-[360px] rounded-full blur-[120px]"
        style={{
          opacity: glowOpacity * 0.7,
          background:
            "radial-gradient(closest-side, var(--color-cyan), transparent 70%)",
        }}
      />

      {/* hairline noise, kept extremely subtle */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="sigma-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sigma-noise)" />
      </svg>
    </div>
  );
}
