import { cn } from "@/lib/utils";

/**
 * The SIGMA+ symbol: a stylized Σ (sigma) built from three straight
 * strokes — the same angular geometry echoed by the flagship 3D object
 * and the "+" motif — with the cross sitting in the open mouth of the
 * sigma. Pure vector, no external assets, legible down to 16px (favicon).
 */
export function SigmaMark({
  className,
  variant = "electric",
}: {
  className?: string;
  variant?: "electric" | "mono";
}) {
  const strokeId = variant === "electric" ? "sigma-mark-gradient" : undefined;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      role="img"
      aria-label="SIGMA+"
    >
      {variant === "electric" && (
        <defs>
          <linearGradient id="sigma-mark-gradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5B8CFF" />
            <stop offset="100%" stopColor="#22C7D9" />
          </linearGradient>
        </defs>
      )}
      {/* Sigma stroke */}
      <path
        d="M25 7H9.5L17 16L9.5 25H25"
        stroke={strokeId ? `url(#${strokeId})` : "currentColor"}
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Plus, sitting in the sigma's open right-hand pocket */}
      <path
        d="M20.5 13V19M18 16H23"
        stroke={strokeId ? `url(#${strokeId})` : "currentColor"}
        strokeWidth="2.25"
        strokeLinecap="square"
      />
    </svg>
  );
}
