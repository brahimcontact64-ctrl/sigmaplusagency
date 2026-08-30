import type { ReactNode } from "react";
import { GridGlow } from "@/components/backgrounds/grid-glow";
import type { BreadcrumbItem } from "./breadcrumbs";
import { Breadcrumbs } from "./breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  locale,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  locale: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:pt-16">
      <GridGlow variant="section" />
      <div className="relative mx-auto max-w-6xl">
        {breadcrumbs && (
          <div className="mb-8">
            <Breadcrumbs items={breadcrumbs} locale={locale} />
          </div>
        )}
        {eyebrow && (
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-bright">{eyebrow}</p>
        )}
        <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg text-muted">{description}</p>}
        {children}
      </div>
    </section>
  );
}
