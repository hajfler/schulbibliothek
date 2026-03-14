"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface ReturnBookButtonProps {
  loanId: string;
  bookTitle: string;
}

export function ReturnBookButton({ loanId, bookTitle }: ReturnBookButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleReturn = async () => {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });

      if (!res.ok) {
        addToast("Fehler beim Zurückgeben", "error");
        return;
      }

      addToast(`"${bookTitle}" zurückgegeben`, "success");
      router.refresh();
    } catch {
      addToast("Fehler beim Zurückgeben", "error");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <Button
      variant={confirmed ? "danger" : "secondary"}
      size="sm"
      onClick={handleReturn}
      loading={loading}
      className="flex-shrink-0"
    >
      <RotateCcw size={14} />
      {confirmed ? "Bestätigen?" : "Zurückgeben"}
    </Button>
  );
}
