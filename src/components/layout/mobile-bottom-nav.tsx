"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BookMarked, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

interface Props {
  session: Session;
}

export function MobileBottomNav({ session }: Props) {
  const pathname = usePathname();
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user?.role ?? "");

  const items = [
    { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
    { href: "/books", label: "Bücher", icon: BookOpen },
    { href: "/my-loans", label: "Ausleihen", icon: BookMarked },
    ...(isStaff ? [{ href: "/admin", label: "Verwaltung", icon: Shield }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F2F2F7] safe-area-inset-bottom">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-[#007AFF]" : "text-[#8E8E93]"
              )}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
