"use client";

import * as React from "react";
import { Mail, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ContactBorrowerModalProps {
  loanId: string;
  borrowerName: string;
  borrowerEmail: string;
  bookTitle: string;
}

export function ContactBorrowerModal({
  loanId,
  borrowerName,
  borrowerEmail,
  bookTitle,
}: ContactBorrowerModalProps) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        addToast(`E-Mail an ${borrowerName} gesendet`, "success");
        setOpen(false);
        setMessage("");
      } else {
        const err = await res.json();
        addToast(err.error ?? "Fehler beim Senden", "error");
      }
    } catch {
      addToast("Fehler beim Senden", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[12px] text-[#007AFF] font-medium hover:underline"
        title={`E-Mail an ${borrowerEmail}`}
      >
        <Mail size={13} />
        Kontaktieren
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
                  Nachricht senden
                </h3>
                <p className="text-[13px] text-[#8E8E93] mt-0.5">
                  An: {borrowerName} · {borrowerEmail}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#F2F2F7] rounded-xl px-4 py-3">
              <p className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-wide">Betreff</p>
              <p className="text-[13px] text-[#3A3A3C] mt-0.5">
                Nachricht zur Ausleihe: &ldquo;{bookTitle}&rdquo;
              </p>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#3A3A3C] block mb-2">
                Nachricht
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Deine Nachricht..."
                className="w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 text-[14px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-[14px] font-medium text-[#3A3A3C] bg-[#F2F2F7] hover:bg-[#E5E5EA]"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-[#007AFF] hover:bg-[#0071E3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Senden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
