import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Admin is its own top-level route tree (sibling to [locale]), deliberately
// outside next-intl's routing — see src/proxy.ts. It gets its own root
// layout (html/body) and is excluded from search engines: auth already
// keeps it inaccessible, this just keeps it out of any index too.
export const metadata: Metadata = {
  title: "SIGMA+ Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-void text-foreground">{children}</body>
    </html>
  );
}
