"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { addDays } from "date-fns";

interface ExtendLoanButtonProps {
  loanId: string;
  dueDate: Date | string;
  extensions: number;
  isOverdue: boolean;
}

export function ExtendLoanButton({ loanId, dueDate, extensions, isOverdue }: ExtendLoanButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const alreadyExtended = extensions >= 1;
  const disabled = alreadyExtended || isOverdue;

  const newDueDate = formatDate(addDays(new Date(dueDate), 14));

  const handleExtend = async () => {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 4000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "selfExtend" }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(data.error ?? "Fehler beim Verlängern", "error");
        return;
      }

      addToast(`Ausleihe verlängert bis ${newDueDate}`, "success");
      router.refresh();
    } catch {
      addToast("Fehler beim Verlängern", "error");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  if (disabled) {
    return (
      <span className="text-[11px] text-[#C7C7CC] flex-shrink-0">
        {alreadyExtended ? "Bereits verlängert" : "Nicht verlängerbar"}
      </span>
    );
  }

  return (
    <Button
      variant={confirmed ? "secondary" : "ghost"}
      size="sm"
      onClick={handleExtend}
      loading={loading}
      className="flex-shrink-0 text-[#007AFF]"
    >
      <CalendarPlus size={14} />
      {confirmed ? `Bis ${newDueDate}?` : "+14 Tage"}
    </Button>
  );
}
