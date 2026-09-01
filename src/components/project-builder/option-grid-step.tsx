"use client";

import { motion } from "motion/react";
import { OptionCard } from "./option-card";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function OptionGridStep({
  title,
  subtitle,
  options,
  selected,
  multi,
  onChange,
  columns = 2,
  mobileColumns = 1,
}: {
  title: string;
  subtitle: string;
  options: { id: string; label: string }[];
  selected: string[];
  multi: boolean;
  onChange: (next: string[]) => void;
  columns?: 2 | 3;
  /** Compact 2-column mobile grid for short-label option sets (e.g. the 6 broad project-type cards) — defaults to a single column, unchanged from before. */
  mobileColumns?: 1 | 2;
}) {
  function toggle(id: string) {
    if (multi) {
      onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    } else {
      onChange([id]);
    }
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.div
        variants={fadeUp}
        className={cn(
          "mt-6 grid gap-3 sm:mt-8",
          mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1",
          columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            selected={selected.includes(opt.id)}
            onToggle={() => toggle(opt.id)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
