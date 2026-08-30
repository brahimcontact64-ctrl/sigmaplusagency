"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  compact,
}: {
  href: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
        compact ? "px-2 py-2" : "px-3 py-2.5",
        isActive ? "bg-graphite text-primary-bright" : "text-muted hover:bg-graphite hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
