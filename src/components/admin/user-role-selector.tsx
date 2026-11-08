"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface School {
  id: string;
  name: string;
}

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
  currentSchoolId: string | null;
  memberSchoolIds: string[];
  /** Admin darf Rollen inkl. Admin und Schulhäuser ändern; Bibliothekare nur Benutzer/Bibliothekar */
  isAdmin: boolean;
  schools: School[];
  /** «row»: alles auf einer Zeile für die Tabelle; «stack»: untereinander für Karten */
  layout?: "row" | "stack";
  /** Nur Rollenauswahl oder nur Schulhaus-Chips rendern (Tabelle hat eigene Spalten) */
  part?: "all" | "role" | "schools";
}

const roles = [
  { value: "USER", label: "Benutzer" },
  { value: "LIBRARIAN", label: "Bibliothekar" },
  { value: "ADMIN", label: "Admin" },
];

// Rollen tragen dieselben Farben wie das Badge, damit die Auswahl als
// Zustand lesbar bleibt und nicht als Formularfeld wirkt.
const roleTone: Record<string, string> = {
  USER: "bg-[var(--surface-secondary)] text-[var(--foreground-secondary)]",
  LIBRARIAN: "bg-[#E1F0FF] text-[#007AFF]",
  ADMIN: "bg-[#F3E8FF] text-[#AF52DE]",
};

export function UserRoleSelector({
  userId,
  currentRole,
  currentSchoolId,
  memberSchoolIds,
  isAdmin,
  schools,
  layout = "stack",
  part = "all",
}: UserRoleSelectorProps) {
  const [loading, setLoading] = React.useState(false);
  const [selectedSchools, setSelectedSchools] = React.useState<string[]>(memberSchoolIds);
  const { addToast } = useToast();
  const router = useRouter();

  const patch = async (data: { role?: string; schoolIds?: string[] }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(err.error ?? "Fehler beim Aktualisieren", "error");
        return;
      }
      addToast("Gespeichert", "success");
      router.refresh();
    } catch {
      addToast("Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (schoolId: string) => {
    const next = selectedSchools.includes(schoolId)
      ? selectedSchools.filter((id) => id !== schoolId)
      : [...selectedSchools, schoolId];
    setSelectedSchools(next);
    patch({ schoolIds: next });
  };

  const availableRoles = isAdmin ? roles : roles.filter((r) => r.value !== "ADMIN");

  const roleSelect = (
    <div className="relative inline-flex">
      <select
        value={currentRole}
        onChange={(e) => patch({ role: e.target.value })}
        disabled={loading}
        title="Rolle ändern"
        className={cn(
          "appearance-none cursor-pointer rounded-full border-0 pl-2.5 pr-6 py-1 text-[12px] font-semibold",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 disabled:opacity-50 disabled:cursor-default",
          roleTone[currentRole] ?? roleTone.USER
        )}
      >
        {availableRoles.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
        {!isAdmin && currentRole === "ADMIN" && <option value="ADMIN">Admin</option>}
      </select>
      <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-2 top-1/2 -mt-[5px] h-[10px] w-[10px] opacity-60">
        <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  const schoolChips = schools.length > 0 && (
    <div className={cn("flex flex-wrap gap-1", layout === "stack" && "mt-1")}>
      {schools.map((s) => {
        const isMember = selectedSchools.includes(s.id);
        const isActive = currentSchoolId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSchool(s.id)}
            disabled={loading || !isAdmin}
            aria-pressed={isMember}
            title={
              !isAdmin
                ? s.name
                : isActive
                  ? `${s.name} — aktives Schulhaus`
                  : isMember
                    ? `${s.name} — zugeordnet, klicken zum Entfernen`
                    : `${s.name} — klicken zum Zuordnen`
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-medium",
              "transition-[background-color,color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]",
              "disabled:cursor-default disabled:opacity-60",
              isMember
                ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                : "text-[var(--foreground-tertiary)] hover:bg-[var(--surface-secondary)]",
              isActive && "ring-1 ring-inset ring-[#007AFF]/50 text-[#007AFF]"
            )}
          >
            {isMember && <Check size={11} className={isActive ? "text-[#007AFF]" : "opacity-60"} />}
            {/* «Schulhaus » ist bei jedem Eintrag gleich — den Namen verkürzen */}
            {s.name.replace(/^Schulhaus\s+/, "")}
          </button>
        );
      })}
    </div>
  );

  if (part === "role") return roleSelect;
  if (part === "schools") return <>{schoolChips}</>;

  return (
    <div className={cn("flex gap-2", layout === "row" ? "flex-row items-center flex-wrap" : "flex-col")}>
      {roleSelect}
      {schoolChips}
    </div>
  );
}
