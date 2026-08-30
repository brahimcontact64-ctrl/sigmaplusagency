"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function MessageStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
      <motion.h1 variants={fadeUp} className="text-2xl font-bold sm:text-3xl">
        {title}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-muted">
        {subtitle}
      </motion.p>

      <motion.textarea
        variants={fadeUp}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={7}
        maxLength={2000}
        className="mt-8 w-full rounded-xl border border-border bg-void px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-bright"
      />
      <motion.p variants={fadeUp} className="mt-1.5 text-right text-xs text-muted">
        {value.length}/2000
      </motion.p>
    </motion.div>
  );
}
