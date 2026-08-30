import { ButtonLink } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Honest fallback per master plan Phase 6 §6/§37 — shown whenever the
 * AI provider isn't configured or a request fails outright. The rest
 * of the site (Project Builder, Contact, WhatsApp) is unaffected
 * either way, and this state says so rather than pretending to chat.
 */
export function UnavailableNotice({ locale, message }: { locale: string; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center">
      <p className="text-base font-medium text-foreground">
        {message ?? "SIGMA AI is temporarily unavailable."}
      </p>
      <p className="max-w-sm text-sm text-muted">
        You can still start your project or reach the team directly — nothing about this affects the rest of the site.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/${locale}/start-project`} size="md">
          Use the Project Builder
        </ButtonLink>
        <ButtonLink href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="md">
          WhatsApp us
        </ButtonLink>
        <ButtonLink href={`/${locale}/contact`} variant="outline" size="md">
          Contact page
        </ButtonLink>
      </div>
    </div>
  );
}
