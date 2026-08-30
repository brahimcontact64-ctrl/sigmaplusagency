"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { Menu, X, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Nav = {
  services: string;
  work: string;
  about: string;
  contact: string;
  startProject: string;
};

const NAV_LINKS: { key: keyof Nav; href: string }[] = [
  { key: "services", href: "/services" },
  { key: "work", href: "/work" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

export function HeaderClient({
  locale,
  locales,
  nav,
  whatsappHref,
}: {
  locale: string;
  locales: readonly string[];
  nav: Nav;
  whatsappHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  // ButtonLink renders a plain <a>, not the locale-aware <Link/>, so a
  // real cross-page route needs the locale prefix built in manually.
  // "start-project" is a fixed, non-localized top-level segment (see
  // routing notes in the master plan), so this is safe for every locale.
  const startProjectHref = `/${locale}/start-project`;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,padding] duration-300",
        scrolled
          ? "border-b border-border bg-void/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary-bright"
        style={{ scaleX: scrollYProgress }}
      />

      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-6 transition-[height] duration-300",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link href="/" className="text-lg" onClick={() => setMenuOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright"
            >
              {nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher currentLocale={locale} locales={locales} />
          <ButtonLink href={startProjectHref} size="md">
            {nav.startProject}
          </ButtonLink>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center text-foreground lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-14 bottom-0 z-40 bg-void lg:hidden"
          >
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
              className="flex h-full flex-col justify-between px-6 py-10"
            >
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((item) => (
                  <motion.div
                    key={item.key}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between border-b border-border py-4 text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-bright"
                    >
                      {nav[item.key]}
                      <ArrowRight className="size-5 text-muted rtl:rotate-180" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="flex flex-col gap-3"
              >
                <div className="mb-2 flex justify-center">
                  <LanguageSwitcher currentLocale={locale} locales={locales} />
                </div>
                <ButtonLink href={startProjectHref} size="lg" onClick={() => setMenuOpen(false)}>
                  {nav.startProject}
                </ButtonLink>
                <ButtonLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle className="size-5" />
                  WhatsApp
                </ButtonLink>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
