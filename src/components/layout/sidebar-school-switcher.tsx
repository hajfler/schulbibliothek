"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export interface SchoolOption {
  id: string;
  name: string;
}

interface Props {
  schools: SchoolOption[];
  activeSchoolId: string | null;
}

/**
 * Wechsel des aktiven Schulhauses am Fuss der Navigation (wie im LMI).
 * Sichtbar, sobald mehr als ein Schulhaus zugeordnet ist. Rolle und aktives
 * Schulhaus werden serverseitig pro Anfrage gelesen, ein refresh() genügt.
 */
export function SidebarSchoolSwitcher({ schools, activeSchoolId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const active = schools.find((s) => s.id === activeSchoolId) ?? schools[0];

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (schools.length < 2) return null;

  const select = async (schoolId: string) => {
    if (schoolId === activeSchoolId) {
      setOpen(false);
      return;
    }
    setPendingId(schoolId);
    try {
      const res = await fetch("/api/user/active-school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });
      if (!res.ok) {
        addToast("Schulhaus konnte nicht gewechselt werden", "error");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      addToast("Schulhaus konnte nicht gewechselt werden", "error");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative px-3 mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium",
          "bg-[var(--surface-secondary)] text-[var(--foreground)] hover:opacity-90 transition-opacity"
        )}
      >
        <Building2 size={15} className="text-[var(--foreground-tertiary)] flex-shrink-0" />
        <span className="flex-1 min-w-0 truncate text-left">{active?.name ?? "Schulhaus"}</span>
        <ChevronDown size={14} className="chevron text-[var(--foreground-tertiary)]" data-open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          data-motion="modal"
          className="absolute left-3 right-3 bottom-full mb-1 z-40 rounded-xl border border-[var(--separator)] bg-[var(--surface)] shadow-lg overflow-hidden"
        >
          {schools.map((s) => {
            const isActive = s.id === activeSchoolId;
            const isPending = pendingId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => select(s.id)}
                disabled={pendingId !== null}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors",
                  isActive ? "text-[#007AFF] font-semibold" : "text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                )}
              >
                <span className="flex-1 truncate">{s.name}</span>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : isActive && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
