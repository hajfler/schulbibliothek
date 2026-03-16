"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function TriggerRemindersButton() {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const trigger = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reminders/trigger", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error ?? "Fehler", "error");
        return;
      }
      addToast(
        `${data.sent} Erinnerung${data.sent !== 1 ? "en" : ""} gesendet${data.failed > 0 ? ` (${data.failed} fehlgeschlagen)` : ""}`,
        data.failed > 0 ? "error" : "success"
      );
    } catch {
      addToast("Fehler beim Auslösen", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0071E3] transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      Jetzt senden
    </button>
  );
}
