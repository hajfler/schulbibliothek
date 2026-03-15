"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface School {
  id: string;
  name: string;
}

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
  currentSchoolId: string | null;
  isAdmin: boolean;
  schools: School[];
}

const roles = [
  { value: "USER", label: "Benutzer" },
  { value: "LIBRARIAN", label: "Bibliothekar" },
  { value: "ADMIN", label: "Admin" },
];

const selectClass =
  "bg-[#F2F2F7] border-0 rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 disabled:opacity-50";

export function UserRoleSelector({
  userId,
  currentRole,
  currentSchoolId,
  isAdmin,
  schools,
}: UserRoleSelectorProps) {
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const patch = async (data: { role?: string; schoolId?: string | null }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });
      if (!res.ok) {
        addToast("Fehler beim Aktualisieren", "error");
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

  const availableRoles = isAdmin ? roles : roles.filter((r) => r.value !== "ADMIN");

  return (
    <div className="flex flex-col gap-2">
      <select
        value={currentRole}
        onChange={(e) => patch({ role: e.target.value })}
        disabled={loading}
        className={selectClass}
      >
        {availableRoles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {isAdmin && schools.length > 0 && (
        <select
          value={currentSchoolId ?? ""}
          onChange={(e) => patch({ schoolId: e.target.value || null })}
          disabled={loading}
          className={selectClass}
        >
          <option value="">Kein Schulhaus</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
