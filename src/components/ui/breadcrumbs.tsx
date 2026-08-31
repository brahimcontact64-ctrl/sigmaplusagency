import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { buildCanonicalUrl } from "@/lib/seo/site-url";
import { buildBreadcrumbListSchema, withSchemaContext } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/json-ld";
import type { Locale } from "@/i18n/routing";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** The single source for breadcrumbs, visual and JSON-LD alike — see docs/SEO_STRATEGY.md "Breadcrumbs": the two are built from the exact same `items` array so they can never drift apart. */
export function Breadcrumbs({ items, locale }: { items: BreadcrumbItem[]; locale: Locale }) {
  const jsonLd = withSchemaContext(
    buildBreadcrumbListSchema(
      items.map((item) => ({
        name: item.label,
        url: item.href ? buildCanonicalUrl(locale, item.href) : undefined,
      })),
    ),
  );

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
