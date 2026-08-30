import { SigmaMark } from "@/components/brand/sigma-mark";

/**
 * Static, CSS-only stand-in for the 3D scene. Rendered immediately
 * (no client JS required) and swapped for the real scene once it's
 * eligible and loaded — so the hero never waits on WebGL for its
 * first paint, and reduced-motion / low-power / no-WebGL visitors get
 * a real, considered visual rather than a blank box.
 */
export function SigmaFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full opacity-70 blur-2xl motion-safe:animate-[spin_16s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 90deg, var(--color-primary), var(--color-cyan), var(--color-violet), var(--color-primary))",
        }}
      />
      <div className="absolute inset-8 rounded-full border border-border bg-void/60 backdrop-blur-sm" />
      <SigmaMark className="relative size-24 text-foreground drop-shadow-[0_0_30px_var(--color-primary)] sm:size-32" />
    </div>
  );
}
