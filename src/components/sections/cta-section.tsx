"use client";

import { motion } from "motion/react";
import { MessageCircle, Mail, Phone, Rocket } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { GridGlow } from "@/components/backgrounds/grid-glow";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

export function CtaSection({
  title,
  subtitle,
  whatsappLabel,
  whatsappHref,
  startProjectLabel,
  startProjectHref,
  contactPhone,
  contactEmail,
}: {
  title: string;
  subtitle: string;
  whatsappLabel: string;
  whatsappHref: string;
  startProjectLabel: string;
  startProjectHref: string;
  contactPhone: string;
  contactEmail: string;
}) {
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-20 sm:py-28">
      <GridGlow variant="section" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={staggerContainer()}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.div variants={fadeUp} className="flex justify-center">
          <SectionLabel index="04" />
        </motion.div>
        <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
          {title}
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-muted">
          {subtitle}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href={startProjectHref} size="lg">
            <Rocket className="size-5" />
            {startProjectLabel}
          </ButtonLink>
          <ButtonLink
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
          >
            <MessageCircle className="size-5" />
            {whatsappLabel}
          </ButtonLink>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted sm:flex-row sm:gap-8"
        >
          <span className="flex items-center gap-2">
            <Phone className="size-4" />
            <span dir="ltr">{contactPhone}</span>
          </span>
          <span className="flex items-center gap-2">
            <Mail className="size-4" />
            <span dir="ltr">{contactEmail}</span>
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
