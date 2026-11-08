"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, LayoutDashboard, BookMarked, Users,
  LogOut, Shield, BookCopy, ChevronDown, Tags, Upload,
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

export function Sidebar({ session, schools, activeSchoolId }: SidebarProps) {
  const pathname = usePathname();
  const role = session.user?.role ?? "USER";
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(role);
  const isAdmin = role === "ADMIN";
  const [adminExpanded, setAdminExpanded] = React.useState(pathname.startsWith("/admin"));
  const chip = roleChip[role];

  return (
    <aside className="w-[240px] flex-shrink-0 bg-[var(--surface)] border-r border-[var(--separator-opaque)] flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--separator-opaque)]">
        <img src="/logo.svg" alt="Schule Dietlikon" className="h-7 w-auto logo-light-mode" />
        <img src="/logo-dark.svg" alt="Schule Dietlikon" className="h-7 w-auto logo-dark-mode" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
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

        {isStaff && (
          <div className="mt-6">
            <button
              onClick={() => setAdminExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-[var(--foreground-tertiary)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
            >
              Verwaltung
              <ChevronDown size={14} className="chevron" data-open={adminExpanded} />
            </button>
            <div className="collapsible" data-open={adminExpanded}>
              <div>
                <div className="space-y-0.5 mt-1">
                  {adminItems
                    .filter((item) => !item.adminOnly || isAdmin)
                    .map((item) => (
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
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Fuss: Schulhaus, Rolle, Benutzer, Erscheinungsbild, Abmelden, Version */}
      <div className="py-4 border-t border-[var(--separator-opaque)]">
        <SidebarSchoolSwitcher schools={schools} activeSchoolId={activeSchoolId} />
        <div className="px-3">
          {chip && (
            <div className="px-3 py-1 mb-2">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", chip.className)}>
                {chip.label}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface-secondary)] mb-2">
            {session.user?.image ? (
              <img src={session.user.image} alt={session.user?.name ?? ""} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[13px] font-semibold">
                {session.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">{session.user?.name ?? "Unbekannt"}</p>
              <p className="text-[11px] text-[var(--foreground-tertiary)] truncate">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex justify-between items-center px-3 py-1 mb-1">
            <span className="text-[11px] text-[var(--foreground-tertiary)]">Erscheinungsbild</span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#FF3B30] hover:bg-[var(--red-surface-hover)] transition-colors"
          >
            <LogOut size={15} />
            Abmelden
          </button>
          <VersionBadge />
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
