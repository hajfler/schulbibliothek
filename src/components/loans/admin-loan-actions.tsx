"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MoreHorizontal, RotateCcw, CalendarDays, AlertTriangle, Mail } from "lucide-react";
import { addDays, format } from "date-fns";

interface AdminLoanActionsProps {
  loanId: string;
  status: string;
  userEmail: string;
  bookTitle: string;
  currentDueDate: string;
}

export function AdminLoanActions({
  loanId, status, userEmail, bookTitle, currentDueDate,
}: AdminLoanActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [extendOpen, setExtendOpen] = React.useState(false);
  const [newDueDate, setNewDueDate] = React.useState(
    format(addDays(new Date(currentDueDate), 7), "yyyy-MM-dd")
  );
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const action = async (body: object) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        addToast("Fehler beim Ausführen der Aktion", "error");
        return;
      }
      addToast("Erfolgreich aktualisiert", "success");
      setOpen(false);
      setExtendOpen(false);
      router.refresh();
    } catch {
      addToast("Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  const isActive = ["ACTIVE", "OVERDUE"].includes(status);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ausleihe verwalten" size="sm">
        <div className="p-5 space-y-2">
          {isActive && (
            <>
              <ActionButton
                icon={<RotateCcw size={16} />}
                label="Als zurückgegeben markieren"
                onClick={() => action({ action: "return" })}
                loading={loading}
              />
              <ActionButton
                icon={<CalendarDays size={16} />}
                label="Rückgabefrist verlängern"
                onClick={() => { setOpen(false); setExtendOpen(true); }}
              />
              <ActionButton
                icon={<AlertTriangle size={16} />}
                label="Als verloren markieren"
                onClick={() => action({ action: "markLost" })}
                loading={loading}
                variant="danger"
              />
            </>
          )}
          <ActionButton
            icon={<Mail size={16} />}
            label="Benutzer per E-Mail kontaktieren"
            onClick={() => {
              window.open(
                `mailto:${userEmail}?subject=Schulbibliothek: ${encodeURIComponent(bookTitle)}`
              );
              setOpen(false);
            }}
          />
        </div>
      </Modal>

      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Rückgabefrist verlängern"
        size="sm"
      >
        <div className="p-5 space-y-5">
          <div>
            <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-2">
              Neues Rückgabedatum
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
              className="w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 text-[15px] text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setExtendOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              loading={loading}
              onClick={() => action({ action: "extend", dueDate: newDueDate })}
            >
              Verlängern
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ActionButton({
  icon, label, onClick, loading, variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
        variant === "danger"
          ? "text-[#FF3B30] hover:bg-[#FFF0EF]"
          : "text-[#1C1C1E] hover:bg-[#F2F2F7]"
      } disabled:opacity-50`}
    >
      <span className={variant === "danger" ? "text-[#FF3B30]" : "text-[#8E8E93]"}>
        {icon}
      </span>
      {label}
    </button>
  );
}
