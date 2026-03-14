"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
  isAdmin: boolean;
}

const roles = [
  { value: "USER", label: "Benutzer" },
  { value: "LIBRARIAN", label: "Bibliothekar" },
  { value: "ADMIN", label: "Admin" },
];

export function UserRoleSelector({ userId, currentRole, isAdmin }: UserRoleSelectorProps) {
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleChange = async (newRole: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        addToast("Fehler beim Aktualisieren der Rolle", "error");
        return;
      }
      addToast("Rolle aktualisiert", "success");
      router.refresh();
    } catch {
      addToast("Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = isAdmin ? roles : roles.filter((r) => r.value !== "ADMIN");

  return (
    <select
      value={currentRole}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="bg-[#F2F2F7] border-0 rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 disabled:opacity-50"
    >
      {availableRoles.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
