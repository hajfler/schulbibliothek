"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar } from "lucide-react";
import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";

const LOAN_DURATION_OPTIONS = [
  { days: 7, label: "1 Woche" },
  { days: 14, label: "2 Wochen" },
  { days: 21, label: "3 Wochen" },
  { days: 28, label: "4 Wochen" },
  { days: 42, label: "6 Wochen" },
];

interface LoanModalProps {
  book: { id: string; title: string; author: string };
}

export function LoanModal({ book }: LoanModalProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDays, setSelectedDays] = React.useState(14);
  const [customDate, setCustomDate] = React.useState("");
  const [useCustom, setUseCustom] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const dueDate = useCustom
    ? customDate
      ? new Date(customDate)
      : null
    : addDays(new Date(), selectedDays);

  const handleBorrow = async () => {
    if (!dueDate) return;
    setLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          dueDate: dueDate.toISOString(),
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error ?? "Fehler beim Ausleihen", "error");
        return;
      }

      addToast(`"${book.title}" erfolgreich ausgeliehen`, "success");
      setOpen(false);
      router.refresh();
    } catch {
      addToast("Fehler beim Ausleihen", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold py-3.5 rounded-xl transition-all duration-150 active:scale-[0.97] shadow-sm text-[15px] flex items-center justify-center gap-2"
      >
        <BookOpen size={18} />
        Jetzt ausleihen
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buch ausleihen"
      >
        <div className="p-6 space-y-6">
          {/* Book info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F2F2F7]">
            <div className="w-10 h-10 bg-[#E1F0FF] rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-[#007AFF]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1C1C1E]">{book.title}</p>
              <p className="text-[13px] text-[#8E8E93]">{book.author}</p>
            </div>
          </div>

          {/* Duration selector */}
          <div>
            <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-3">
              Ausleih-Dauer
            </label>

            {/* Preset buttons */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {LOAN_DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => { setSelectedDays(opt.days); setUseCustom(false); }}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    !useCustom && selectedDays === opt.days
                      ? "bg-[#007AFF] text-white shadow-sm"
                      : "bg-[#F2F2F7] text-[#3A3A3C] hover:bg-[#E5E5EA]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom date */}
            <div>
              <button
                onClick={() => setUseCustom(!useCustom)}
                className={`flex items-center gap-2 text-[13px] font-medium px-3 py-2 rounded-lg transition-colors ${
                  useCustom ? "text-[#007AFF] bg-[#E1F0FF]" : "text-[#8E8E93] hover:bg-[#F2F2F7]"
                }`}
              >
                <Calendar size={14} />
                Eigenes Datum wählen
              </button>
              {useCustom && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                  className="mt-2 w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 text-[15px] text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                />
              )}
            </div>
          </div>

          {/* Due date display */}
          {dueDate && (
            <div className="flex items-center justify-between p-4 bg-[#E1F0FF] rounded-xl">
              <div>
                <p className="text-[12px] text-[#007AFF] font-semibold uppercase tracking-wide">
                  Rückgabe bis
                </p>
                <p className="text-[17px] font-bold text-[#007AFF]">
                  {format(dueDate, "EEEE, d. MMMM yyyy", { locale: de })}
                </p>
              </div>
              <Calendar size={24} className="text-[#007AFF] opacity-60" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-2">
              Notiz (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. für Schulprojekt..."
              rows={2}
              className="w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 text-[14px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleBorrow}
              loading={loading}
              disabled={!dueDate}
            >
              Ausleihen bestätigen
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
