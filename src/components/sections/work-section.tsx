"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionLabel } from "@/components/ui/section-label";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const ACCENTS = ["#5B8CFF", "#22C7D9", "#7C6FFF", "#5B8CFF"];

export type WorkCardData = {
  slug: string;
  name: string;
  tag: string;
  description: string;
};

export function WorkSection({
  title,
  subtitle,
  viewProjectLabel,
  projects,
}: {
  title: string;
  subtitle: string;
  viewProjectLabel: string;
  projects: WorkCardData[];
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
              <motion.div key={project.slug} variants={fadeUp}>
                <Link
                  href={`/work/${project.slug}`}
                  aria-label={`${viewProjectLabel} — ${project.name}`}
                  // Deliberate mobile card composition (Phase 11 §3):
                  // tighter padding/spacing and a smaller decorative
                  // number at small widths, original generous spacing
                  // preserved from `sm:` up. No image-sized space is
                  // reserved — this codebase never uses project imagery.
                  className="group relative block overflow-hidden rounded-2xl border border-border bg-graphite p-5 transition-colors hover:border-[--accent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright sm:p-8"
                  style={{ ["--accent" as string]: accent }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-4 select-none font-mono text-5xl font-bold leading-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1] rtl:-left-3 rtl:right-auto sm:-right-4 sm:-top-6 sm:text-[6rem] rtl:sm:-left-4"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span
                    className="mb-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide sm:mb-4"
                    style={{ borderColor: accent, color: accent }}
                  >
                    {project.tag}
                  </span>

                  <h3 className="relative text-xl font-bold">{project.name}</h3>
                  <p className="relative mt-2 max-w-sm text-sm text-muted sm:mt-3">{project.description}</p>

                  {/* Always visible on touch devices (no hover state to reveal it) — fades in on hover only where hover actually exists. */}
                  <span className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-primary-bright sm:mt-5 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
                    {viewProjectLabel}
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
