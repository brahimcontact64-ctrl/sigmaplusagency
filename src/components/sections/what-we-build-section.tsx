"use client";

import { motion } from "motion/react";
import { Globe2, Smartphone, ShoppingCart, Layers, Bot, TrendingUp } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const ICONS = [Globe2, Smartphone, ShoppingCart, Layers, Bot, TrendingUp];

export function WhatWeBuildSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { title: string; description: string }[];
}) {
  return (
    <section id="services" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer()}
          className="mb-14 max-w-2xl"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel index="01" />
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
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Globe2;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary-bright"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-graphite text-primary-bright transition-colors group-hover:border-primary-bright">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
