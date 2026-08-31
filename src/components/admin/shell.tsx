import Link from "next/link";
import { SigmaMark } from "@/components/brand/sigma-mark";
import { LogoutButton } from "./logout-button";
import { NavLink } from "./nav-link";
import type { AdminActor } from "@/domain/admin-user";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/project-requests", label: "Project Requests" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ actor, children }: { actor: AdminActor; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
          <SigmaMark className="h-6 w-6" />
          <span className="text-sm font-semibold text-foreground">SIGMA+ Admin</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <nav className="flex gap-3 overflow-x-auto md:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} compact>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{actor.name}</div>
              <div className="text-xs text-muted">{actor.role}</div>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
