"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, LayoutDashboard, BookMarked, Users, Settings,
  LogOut, Shield, BookCopy, ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import * as React from "react";

interface SidebarProps {
  session: Session;
}

const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/books", label: "Bücher", icon: BookOpen },
  { href: "/my-loans", label: "Meine Ausleihen", icon: BookMarked },
];

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Bücher verwalten", icon: BookCopy },
  { href: "/admin/loans", label: "Alle Ausleihen", icon: BookMarked },
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/schools", label: "Schulhäuser", icon: Shield, adminOnly: true },
];

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user?.role ?? "USER");
  const isAdmin = (session.user?.role ?? "USER") === "ADMIN";
  const [adminExpanded, setAdminExpanded] = React.useState(
    pathname.startsWith("/admin")
  );

  return (
    <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#F2F2F7] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#F2F2F7]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#1C1C1E] leading-tight">
              Schulbibliothek
            </p>
            <p className="text-[11px] text-[#8E8E93]">Dietlikon</p>
          </div>
        </div>
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
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider hover:text-[#3A3A3C] transition-colors"
            >
              Verwaltung
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  adminExpanded && "rotate-180"
                )}
              />
            </button>
            {adminExpanded && (
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
                        pathname.startsWith(item.href + "/")
                      }
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#F2F2F7]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F2F2F7] mb-2">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user?.name ?? ""}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[13px] font-semibold">
              {session.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1C1C1E] truncate">
              {session.user?.name ?? "Unbekannt"}
            </p>
            <p className="text-[11px] text-[#8E8E93] truncate">
              {session.user?.email}
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#3A3A3C] hover:bg-[#F2F2F7] transition-colors"
        >
          <Settings size={15} className="text-[#8E8E93]" />
          Einstellungen
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#FF3B30] hover:bg-[#FFF0EF] transition-colors"
        >
          <LogOut size={15} />
          Abmelden
        </button>
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
          : "text-[#3A3A3C] hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
      )}
    >
      <Icon
        size={17}
        className={active ? "text-white" : "text-[#8E8E93]"}
      />
      {label}
    </Link>
  );
}
