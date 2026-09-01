"use client";

import { motion } from "motion/react";

export function StepIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const progress = (current / total) * 100;

  return (
    <div className="mb-6 sm:mb-8">
      <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        <motion.div
          className="h-full rounded-full bg-primary-bright"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
