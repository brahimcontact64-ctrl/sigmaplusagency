import { cn } from "@/lib/utils";
import { SigmaMark } from "./sigma-mark";

export function Wordmark({
  className,
  showMark = true,
}: {
  className?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      {showMark && <SigmaMark className="size-[1em]" />}
      <span>
        SIGMA<span className="text-primary-bright">+</span>
      </span>
    </span>
  );
}
