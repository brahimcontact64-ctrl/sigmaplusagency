"use client";

import { motion } from "motion/react";
import { Globe2, Smartphone, ShoppingCart, Layers, Bot, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionLabel } from "@/components/ui/section-label";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const ICONS = [Globe2, Smartphone, ShoppingCart, Layers, Bot, TrendingUp];

export type ServiceCardData = {
  slug: string;
  title: string;
  description: string;
};

export function WhatWeBuildSection({
  title,
  subtitle,
  seeAllLabel,
  items,
}: {
  title: string;
  subtitle: string;
  seeAllLabel: string;
  items: ServiceCardData[];
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
              <motion.div key={item.slug} variants={fadeUp}>
                <Link
                  href={`/services/${item.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-graphite text-primary-bright transition-colors group-hover:border-primary-bright">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                  <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-bright opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {seeAllLabel}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
