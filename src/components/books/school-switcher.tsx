"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface School {
  id: string;
  name: string;
}

export function SchoolSwitcher({
  schools,
  activeSchoolId,
}: {
  schools: School[];
  activeSchoolId: string | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  if (schools.length <= 1) return null;

  const switchSchool = async (schoolId: string) => {
    if (schoolId === activeSchoolId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/active-school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });
      if (!res.ok) {
        addToast("Fehler beim Wechseln", "error");
        return;
      }
      router.refresh();
    } catch {
      addToast("Fehler beim Wechseln", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide">
        Schulhaus:
      </span>
      <div className="flex gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1">
        {schools.map((s) => (
          <button
            key={s.id}
            onClick={() => switchSchool(s.id)}
            disabled={loading}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-50",
              activeSchoolId === s.id
                ? "bg-[#007AFF] text-white shadow-sm"
                : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
