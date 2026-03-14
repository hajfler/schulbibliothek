"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Building2, Plus, Users, BookOpen, Edit2 } from "lucide-react";

interface School {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  color: string | null;
  _count: { users: number; books: number };
}

interface SchoolManagerProps {
  initialSchools: School[];
}

const SCHOOL_COLORS = [
  "#007AFF", "#34C759", "#FF9500", "#FF3B30",
  "#AF52DE", "#5AC8FA", "#FF2D55", "#A2845E",
];

export function SchoolManager({ initialSchools }: SchoolManagerProps) {
  const [schools, setSchools] = React.useState(initialSchools);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [color, setColor] = React.useState("#007AFF");
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name || !slug) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, address, color }),
      });
      if (!res.ok) {
        addToast("Fehler beim Erstellen", "error");
        return;
      }
      const school = await res.json();
      setSchools((prev) => [...prev, { ...school, _count: { users: 0, books: 0 } }]);
      addToast("Schulhaus erstellt", "success");
      setCreateOpen(false);
      setName(""); setSlug(""); setDescription(""); setAddress("");
      router.refresh();
    } catch {
      addToast("Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Schulhaus hinzufügen
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <div key={school.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: school.color ?? "#007AFF" }}
              >
                <Building2 size={22} className="text-white" />
              </div>
            </div>
            <h3 className="text-[17px] font-bold text-[#1C1C1E]">{school.name}</h3>
            <p className="text-[13px] text-[#8E8E93] mt-0.5">{school.slug}</p>
            {school.description && (
              <p className="text-[13px] text-[#3A3A3C] mt-2">{school.description}</p>
            )}
            {school.address && (
              <p className="text-[12px] text-[#8E8E93] mt-1">{school.address}</p>
            )}
            <div className="flex gap-4 mt-4 pt-4 border-t border-[#F2F2F7]">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-[#8E8E93]" />
                <span className="text-[13px] text-[#3A3A3C]">{school._count.users} Benutzer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#8E8E93]" />
                <span className="text-[13px] text-[#3A3A3C]">{school._count.books} Bücher</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schulhaus erstellen">
        <div className="p-6 space-y-5">
          <Input
            label="Name *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
            }}
            placeholder="z.B. Schulhaus Dorf"
          />
          <Input
            label="Slug *"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="schulhaus-dorf"
            hint="Eindeutiger Bezeichner (nur Kleinbuchstaben, Zahlen, Bindestriche)"
          />
          <Input
            label="Adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Musterstrasse 1, 8305 Dietlikon"
          />
          <Input
            label="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung"
          />
          <div>
            <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-3">
              Farbe
            </label>
            <div className="flex gap-2">
              {SCHOOL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button className="flex-1" loading={loading} onClick={handleCreate} disabled={!name || !slug}>
              Erstellen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
