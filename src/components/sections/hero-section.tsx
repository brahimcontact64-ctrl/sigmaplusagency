"use client";

import { motion } from "motion/react";
import { ArrowRight, MessageCircle, Rocket } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { HeroVisual } from "@/components/hero/hero-visual";
import { GridGlow } from "@/components/backgrounds/grid-glow";
import { fadeUp, staggerContainer } from "@/lib/motion";

type HeroCopy = {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  subheadline: string;
  ctaPrimary: string;
  ctaWhatsapp: string;
  ctaWork: string;
};

export function HeroSection({
  hero,
  whatsappHref,
  startProjectHref,
}: {
  hero: HeroCopy;
  whatsappHref: string;
  startProjectHref: string;
}) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-24 sm:pt-20">
      <GridGlow variant="hero" />

      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12"
      >
        <div className="lg:col-span-7">
          <motion.p
            variants={fadeUp}
            className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary-bright"
          >
            {hero.eyebrow}
          </motion.p>

          <h1 className="text-balance font-bold leading-[1.05] text-[clamp(2.25rem,4.5vw+1rem,4.5rem)]">
            <motion.span variants={fadeUp} className="block">
              {hero.headlineLine1}
            </motion.span>
            <motion.span variants={fadeUp} className="block text-primary-bright">
              {hero.headlineLine2}
            </motion.span>
          </h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-muted">
            {hero.subheadline}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink href={startProjectHref} size="lg" className="justify-center">
              <Rocket className="size-5" />
              {hero.ctaPrimary}
            </ButtonLink>
            <ButtonLink
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
              className="justify-center"
            >
              <MessageCircle className="size-5" />
              {hero.ctaWhatsapp}
            </ButtonLink>
          </motion.div>

          <motion.div variants={fadeUp}>
            <a
              href="#work"
              className="group mt-8 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright"
            >
              {hero.ctaWork}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="lg:col-span-5">
          <HeroVisual />
        </motion.div>
      </motion.div>
    </section>
  );
}
