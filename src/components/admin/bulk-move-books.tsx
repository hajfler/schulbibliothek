"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ArrowRightLeft, X } from "lucide-react";

interface School {
  id: string;
  name: string;
}

interface Props {
  schools: School[];
  selectedIds: string[];
  onClear: () => void;
}

/** Aktionsleiste zum Verschieben ausgewählter Bücher in ein anderes Schulhaus (Trakt). */
export function BulkMoveBooks({ schools, selectedIds, onClear }: Props) {
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState(schools[0]?.id ?? "");
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  if (selectedIds.length === 0 || schools.length < 2) return null;

  const move = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch("/api/books/bulk-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds: selectedIds, schoolId: target }),
      });
      if (!res.ok) {
        addToast("Fehler beim Verschieben", "error");
        return;
      }
      const { moved } = await res.json();
      addToast(`${moved} ${moved === 1 ? "Buch" : "Bücher"} verschoben`, "success");
      setOpen(false);
      onClear();
      router.refresh();
    } catch {
      addToast("Fehler beim Verschieben", "error");
    } finally {
      setLoading(false);
    }
  };

  const targetName = schools.find((s) => s.id === target)?.name ?? "";

  return (
    <>
      <div className="sticky bottom-20 md:bottom-4 z-30 flex items-center justify-between gap-3 bg-[#1C1C1E] text-white rounded-2xl px-4 py-3 shadow-xl">
        <span className="text-[14px] font-medium">
          {selectedIds.length} {selectedIds.length === 1 ? "Buch" : "Bücher"} ausgewählt
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>
            <ArrowRightLeft size={14} />
            In Bibliothek verschieben
          </Button>
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Auswahl aufheben"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Bücher verschieben">
        <div className="p-6 space-y-5">
          <p className="text-[14px] text-[#3A3A3C]">
            {selectedIds.length} {selectedIds.length === 1 ? "Buch wird" : "Bücher werden"} in die gewählte
            Bibliothek verschoben. Eine allfällige Kategorie wird dabei entfernt, da Kategorien pro
            Bibliothek gelten.
          </p>
          <Select
            label="Ziel-Bibliothek"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            options={schools.map((s) => ({ value: s.id, label: s.name }))}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button className="flex-1" loading={loading} onClick={move} disabled={!target}>
              Nach {targetName} verschieben
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
