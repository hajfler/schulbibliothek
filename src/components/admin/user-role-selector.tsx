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
  memberSchoolIds: string[];
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
  memberSchoolIds,
  isAdmin,
  schools,
}: UserRoleSelectorProps) {
  const [loading, setLoading] = React.useState(false);
  const [selectedSchools, setSelectedSchools] = React.useState<string[]>(memberSchoolIds);
  const { addToast } = useToast();
  const router = useRouter();

  const patch = async (data: { role?: string; schoolId?: string | null; schoolIds?: string[] }) => {
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

  const toggleSchool = (schoolId: string) => {
    const next = selectedSchools.includes(schoolId)
      ? selectedSchools.filter((id) => id !== schoolId)
      : [...selectedSchools, schoolId];
    setSelectedSchools(next);
    patch({ schoolIds: next });
  };

  const availableRoles = isAdmin ? roles : roles.filter((r) => r.value !== "ADMIN");

  return (
    <div className="flex flex-col gap-2.5 min-w-[160px]">
      {/* Role selector */}
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

      {/* School memberships (admin only) */}
      {isAdmin && schools.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide">
            Schulhäuser
          </p>
          {schools.map((s) => {
            const isMember = selectedSchools.includes(s.id);
            const isActive = currentSchoolId === s.id;
            return (
              <label
                key={s.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={isMember}
                  onChange={() => toggleSchool(s.id)}
                  disabled={loading}
                  className="w-3.5 h-3.5 rounded accent-[#007AFF]"
                />
                <span className={`text-[12px] font-medium ${isMember ? "text-[#1C1C1E]" : "text-[#C7C7CC]"}`}>
                  {s.name}
                  {isActive && (
                    <span className="ml-1 text-[10px] text-[#007AFF]">(aktiv)</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
