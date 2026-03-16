"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Props {
  bookId: string;
  reservationId: string | null; // null = not yet reserved
}

export function ReserveButton({ bookId, reservationId }: Props) {
  const [loading, setLoading] = useState(false);
  const [resId, setResId] = useState<string | null>(reservationId);
  const { addToast } = useToast();
  const router = useRouter();

  const reserve = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (!res.ok) {
        const data = await res.json();
        addToast(data.error ?? "Fehler beim Reservieren", "error");
        return;
      }
      const data = await res.json();
      setResId(data.id);
      addToast("Reserviert! Du wirst benachrichtigt, wenn das Buch verfügbar ist.", "success");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!resId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${resId}`, { method: "DELETE" });
      if (!res.ok) {
        addToast("Fehler beim Stornieren", "error");
        return;
      }
      setResId(null);
      addToast("Reservierung storniert", "success");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (resId) {
    return (
      <button
        onClick={cancel}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-[#FF9500] text-[#FF9500] font-semibold py-3 rounded-xl hover:bg-[#FFF5E6] transition-colors text-[15px] disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <BellOff size={16} />}
        Reservierung stornieren
      </button>
    );
  }

  return (
    <button
      onClick={reserve}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border border-[#007AFF] text-[#007AFF] font-semibold py-3 rounded-xl hover:bg-[#EBF5FF] transition-colors text-[15px] disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
      Benachrichtigen wenn verfügbar
    </button>
  );
}
