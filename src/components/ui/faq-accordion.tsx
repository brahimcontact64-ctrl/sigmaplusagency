import { ChevronDown } from "lucide-react";

export type FaqEntry = { question: string; answer: string };

/**
 * Native <details>/<summary> — keyboard and screen-reader accessible by
 * default, no client JS needed for open/close state.
 */
export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="divide-y divide-border rounded-2xl border border-border">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {items.map((item) => (
        <details key={item.question} className="group p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:content-none">
            {item.question}
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
