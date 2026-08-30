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
}: {
  title: string;
  subtitle: string;
  options: { id: string; label: string }[];
  selected: string[];
  multi: boolean;
  onChange: (next: string[]) => void;
  columns?: 2 | 3;
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
        className={cn("mt-8 grid grid-cols-1 gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
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
