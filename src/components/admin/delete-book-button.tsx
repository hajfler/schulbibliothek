"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function DeleteBookButton({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        addToast(err.error === "Cannot delete book with active loans"
          ? "Buch kann nicht gelöscht werden — es gibt aktive Ausleihen"
          : "Fehler beim Löschen", "error");
        setConfirming(false);
        return;
      }
      addToast("Buch gelöscht", "success");
      router.refresh();
    } catch {
      addToast("Fehler beim Löschen", "error");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1 bg-[#FF3B30] text-white text-[12px] font-semibold rounded-lg hover:bg-[#D70015] transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Löschen"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-2.5 py-1 bg-[#F2F2F7] text-[#3A3A3C] text-[12px] font-medium rounded-lg hover:bg-[#E5E5EA] transition-colors"
        >
          Abbruch
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`"${bookTitle}" löschen`}
      className="p-2 rounded-lg hover:bg-[#FFE9E9] text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
    >
      <Trash2 size={15} />
    </button>
  );
}
