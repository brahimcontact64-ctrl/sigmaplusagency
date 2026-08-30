"use client";

import { motion } from "motion/react";
import { SectionLabel } from "@/components/ui/section-label";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const ACCENTS = ["#5B8CFF", "#22C7D9", "#7C6FFF", "#5B8CFF"];

export function WorkSection({
  title,
  subtitle,
  projects,
}: {
  title: string;
  subtitle: string;
  projects: { name: string; tag: string; description: string }[];
}) {
  return (
    <section id="work" className="border-y border-border bg-surface/40 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer()}
          className="mb-14 max-w-2xl"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel index="02" />
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
          variants={staggerContainer(0.1)}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {projects.map((project, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <motion.div
                key={project.name}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-border bg-graphite p-8 transition-colors hover:border-[--accent]"
                style={{ ["--accent" as string]: accent }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-4 -top-6 select-none font-mono text-[6rem] font-bold leading-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span
                  className="mb-4 inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ borderColor: accent, color: accent }}
                >
                  {project.tag}
                </span>

                <h3 className="relative text-xl font-bold">{project.name}</h3>
                <p className="relative mt-3 max-w-sm text-sm text-muted">{project.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
