"use client";

import { motion } from "motion/react";
import { Compass, Palette, Code2, Bot, TrendingUp } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ICONS = [Compass, Palette, Code2, Bot, TrendingUp];

export function WhySection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section id="why" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer()}
          className="mb-14 max-w-2xl"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel index="03" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            {title}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-muted">
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer(0.08)}
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5"
        >
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Compass;
            const isLastOdd = i === items.length - 1 && items.length % 2 === 1;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className={cn("bg-surface p-6", isLastOdd && "sm:col-span-2 lg:col-span-1")}
              >
                <Icon className="size-5 text-primary-bright" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
