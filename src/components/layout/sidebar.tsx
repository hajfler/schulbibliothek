"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, LayoutDashboard, BookMarked, Users,
  LogOut, Shield, BookCopy, Tags, Upload,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import * as React from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VersionBadge } from "@/components/ui/version-badge";
import { SidebarSchoolSwitcher, type SchoolOption } from "./sidebar-school-switcher";

interface SidebarProps {
  session: Session;
  schools: SchoolOption[];
  activeSchoolId: string | null;
}

const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/books", label: "Bücher", icon: BookOpen },
  { href: "/my-loans", label: "Meine Ausleihen", icon: BookMarked },
];

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Bücher verwalten", icon: BookCopy },
  { href: "/admin/categories", label: "Kategorien", icon: Tags },
  { href: "/admin/loans", label: "Alle Ausleihen", icon: BookMarked },
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/import", label: "Benutzer importieren", icon: Upload, adminOnly: true },
  { href: "/admin/schools", label: "Schulhäuser", icon: Shield, adminOnly: true },
];

const roleChip: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "text-[#AF52DE] bg-[#F3E8FF]" },
  LIBRARIAN: { label: "Bibliothekar", className: "text-[#007AFF] bg-[#E1F0FF]" },
};

type TabId = "main" | "admin" | "account";

export function Sidebar({ session, schools, activeSchoolId }: SidebarProps) {
  const pathname = usePathname();
  const role = session.user?.role ?? "USER";
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(role);
  const isAdmin = role === "ADMIN";
  const chip = roleChip[role];

  // Das Register folgt der Seite: unter /admin liegt «Verwaltung» vorn, sonst
  // «Ausleihe». Eine Wahl von Hand gilt, bis zur nächsten Seite gewechselt wird.
  const pathTab: TabId = isStaff && pathname.startsWith("/admin") ? "admin" : "main";
  const [picked, setPicked] = React.useState<{ path: string; tab: TabId } | null>(null);
  const tab = picked && picked.path === pathname ? picked.tab : pathTab;
  const selectTab = (next: TabId) => setPicked({ path: pathname, tab: next });

  const visibleAdminItems = adminItems.filter((item) => !item.adminOnly || isAdmin);

  const tabs: { id: TabId; label: string }[] = [
    { id: "main", label: "Ausleihe" },
    ...(isStaff ? [{ id: "admin" as const, label: "Verwaltung" }] : []),
    { id: "account", label: "Konto" },
  ];

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === tab);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next.id);
    document.getElementById(`sidebar-tab-${next.id}`)?.focus();
  };

  const avatar = session.user?.image ? (
    <img
      src={session.user.image}
      alt={session.user?.name ?? ""}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0">
      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
    </div>
  );

  return (
    <aside className="w-[240px] flex-shrink-0 bg-[var(--surface)] border-r border-[var(--separator-opaque)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5">
        <img src="/logo.svg" alt="Schule Dietlikon" className="h-7 w-auto logo-light-mode" />
        <img src="/logo-dark.svg" alt="Schule Dietlikon" className="h-7 w-auto logo-dark-mode" />
      </div>

      {/* Register */}
      <div
        role="tablist"
        aria-label="Navigation"
        onKeyDown={onTabKeyDown}
        className="flex items-end gap-1 px-2.5 border-b border-[var(--separator)]"
      >
        {tabs.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              id={`sidebar-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="sidebar-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(t.id)}
              className="sidebar-tab"
              data-selected={selected}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Inhalt des gewählten Registers */}
      <nav
        id="sidebar-panel"
        role="tabpanel"
        aria-labelledby={`sidebar-tab-${tab}`}
        className="flex-1 min-h-0 px-3 py-3 overflow-y-auto"
      >
        <div key={tab} className="sidebar-tab-panel">
          {tab === "main" && (
            <div className="space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href || pathname.startsWith(item.href + "/")}
                />
              ))}
            </div>
          )}

          {tab === "admin" && (
            <div className="space-y-0.5">
              {visibleAdminItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
                  }
                />
              ))}
            </div>
          )}

          {tab === "account" && (
            <div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface-secondary)] mb-2">
                {avatar}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">
                    {session.user?.name ?? "Unbekannt"}
                  </p>
                  <p className="text-[11px] text-[var(--foreground-tertiary)] truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              {chip && (
                <div className="px-3 py-1 mb-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", chip.className)}>
                    {chip.label}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center px-3 py-1 mb-1">
                <span className="text-[11px] text-[var(--foreground-tertiary)]">Erscheinungsbild</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[#FF3B30] hover:bg-[var(--red-surface-hover)] transition-colors"
              >
                <LogOut size={17} />
                Abmelden
              </button>
              <VersionBadge />
            </div>
          )}
        </div>
      </nav>

      {/* Fuss: Schulhaus und Konto in einer Zeile */}
      <div className="py-3 border-t border-[var(--separator-opaque)]">
        <SidebarSchoolSwitcher schools={schools} activeSchoolId={activeSchoolId} />
        <div className="px-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => selectTab("account")}
            title="Konto und Einstellungen"
            className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left hover:bg-[var(--surface-secondary)] transition-colors"
          >
            {avatar}
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[var(--foreground)] truncate">
                {session.user?.name ?? "Unbekannt"}
              </span>
              <span className="block text-[11px] text-[var(--foreground-tertiary)] truncate">
                {chip?.label ?? "Lehrperson"}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Abmelden"
            aria-label="Abmelden"
            className="p-2 rounded-lg text-[#FF3B30] hover:bg-[var(--red-surface-hover)] transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150",
        active
          ? "bg-[#007AFF] text-white shadow-sm"
          : "text-[var(--foreground-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon size={17} className={active ? "text-white" : "text-[var(--foreground-tertiary)]"} />
      {label}
    </Link>
  );
}
