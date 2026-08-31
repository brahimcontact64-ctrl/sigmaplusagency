import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MotionConfig } from "motion/react";
import "../globals.css";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { isProductionDeployment } from "@/lib/deployment";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";
import { Ga4Outbound } from "@/components/analytics/ga4-outbound";
import { ConsentBanner } from "@/components/consent/consent-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION is optional — only emitted when
  // the owner has actually been given a verification token by Google
  // Search Console. No placeholder/fake token is ever set.
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteConfig.url),
    title: t("title"),
    description: t("description"),
    alternates: buildFixedPathAlternates(locale, ""),
    // Phase 10 §8-9: a preview/dev deployment must never present itself
    // as indexable — this is the site-wide default every page inherits
    // unless it explicitly overrides `robots` (none currently do).
    ...(isProductionDeployment() ? {} : { robots: { index: false, follow: false } }),
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteConfig.url}/${locale}`,
      siteName: siteConfig.name,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = rtlLocales.has(locale as Locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-foreground">
        <NextIntlClientProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
          <PageViewTracker />
          <WebVitalsReporter />
          <Ga4Outbound />
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
