"use client";

import { motion } from "motion/react";
import { MessageCircle, RotateCcw, ArrowRight, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ButtonLink, Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { track } from "@/lib/integrations/analytics";
import { OptionalQualificationPanel } from "./optional-qualification-panel";
import type { ProjectBuilderResult } from "@/domain/project-builder";

function handleWhatsAppClick() {
  track("whatsapp_handoff_clicked", { context: "project_builder" });
}

function handleAiClick() {
  track("cta_click", { ctaId: "result_ai_consultant", context: "project_builder_success" });
}

type ErrorCopy = {
  validation_error: string;
  rate_limited: string;
  db_unavailable: string;
  maintenance: string;
  unexpected: string;
};

export function ResultScreen({
  result,
  successCopy,
  errorCopy,
  whatsappFallbackUrl,
  retryLabel,
  onRetry,
}: {
  result: ProjectBuilderResult;
  successCopy: { title: string; description: string; cta: string; backHome: string; viewWork: string; aiCta: string };
  errorCopy: ErrorCopy;
  whatsappFallbackUrl: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  if (result.success) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.06)}
        role="status"
        aria-live="polite"
        className="text-center"
      >
        <motion.div variants={fadeUp} className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary-bright">
          <CheckCircle2 className="size-7" />
        </motion.div>
        <motion.h1 variants={fadeUp} className="mt-6 text-2xl font-bold sm:text-3xl">
          {successCopy.title}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 font-mono text-sm text-primary-bright">
          {result.reference}
        </motion.p>
        <motion.p variants={fadeUp} className="mx-auto mt-2 max-w-md text-muted">
          {successCopy.description}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href={whatsappFallbackUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" onClick={handleWhatsAppClick}>
            <MessageCircle className="size-5" />
            {successCopy.cta}
          </ButtonLink>
          <Link
            href="/ai-consultant"
            onClick={handleAiClick}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            <Sparkles className="size-4" />
            {successCopy.aiCta}
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="mx-auto flex justify-center">
          <OptionalQualificationPanel
            reference={result.reference}
            projectRequestId={result.projectRequestId}
            projectType={result.projectType}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            {successCopy.viewWork}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            {successCopy.backHome}
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div role="alert" aria-live="assertive" className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-400/10 text-red-400">
        <AlertTriangle className="size-7" />
      </div>
      <p className="mx-auto mt-6 max-w-md text-foreground">{errorCopy[result.error]}</p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" onClick={onRetry}>
          <RotateCcw className="size-5" />
          {retryLabel}
        </Button>
        <ButtonLink href={whatsappFallbackUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" onClick={handleWhatsAppClick}>
          <MessageCircle className="size-5" />
          WhatsApp
        </ButtonLink>
      </div>
    </div>
  );
}
