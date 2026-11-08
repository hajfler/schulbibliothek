"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users, CheckCircle, AlertCircle, Cloud, Loader2, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface GraphGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
}

interface PreviewMember {
  email: string;
  name: string | null;
  exists: boolean;
  /** Anzahl gewählter Schulhäuser, die dem Benutzer noch fehlen */
  missingSchools: number;
}

interface School {
  id: string;
  name: string;
  color: string | null;
}

interface Preview {
  total: number;
  disabled: number;
  members: PreviewMember[];
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string; email?: string }[];
  total: number;
}

interface ApiError {
  error: string;
  hint?: string;
}

/** Import von Benutzern direkt aus einer Entra-/Teams-Gruppe über Microsoft Graph, mit Schulhaus-Zuordnung. */
export function ImportFromGraph({ schools }: { schools: School[] }) {
  const { addToast } = useToast();
  const [schoolIds, setSchoolIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("Lehrpersonen");
  const [groups, setGroups] = React.useState<GraphGroup[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<GraphGroup | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [apiError, setApiError] = React.useState<ApiError | null>(null);

  const runSearch = async () => {
    setSearching(true);
    setApiError(null);
    setGroups(null);
    setSelected(null);
    setPreview(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/import/graph/groups?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) {
        setApiError(data);
        return;
      }
      setGroups(data);
    } catch {
      setApiError({ error: "Verbindung fehlgeschlagen" });
    } finally {
      setSearching(false);
    }
  };

  const loadPreview = async (group: GraphGroup, ids: string[] = schoolIds) => {
    setSelected(group);
    setPreview(null);
    setResult(null);
    setApiError(null);
    if (ids.length === 0) return;
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/import/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, schoolIds: ids, preview: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data);
        return;
      }
      setPreview(data);
    } catch {
      setApiError({ error: "Verbindung fehlgeschlagen" });
    } finally {
      setPreviewing(false);
    }
  };

  const toggleSchool = (id: string) => {
    const next = schoolIds.includes(id) ? schoolIds.filter((s) => s !== id) : [...schoolIds, id];
    setSchoolIds(next);
    if (selected) loadPreview(selected, next);
  };

  const runImport = async () => {
    if (!selected || schoolIds.length === 0) return;
    setImporting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/admin/import/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selected.id, schoolIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data);
        return;
      }
      setResult(data);
      addToast(
        data.created + data.updated > 0
          ? `${data.created} neu, ${data.updated} ergänzt`
          : "Keine Änderungen",
        data.created + data.updated > 0 ? "success" : "info"
      );
      // Vorschau aktualisieren: alle sind jetzt vorhanden und vollständig zugeordnet
      setPreview((p) => (p ? { ...p, members: p.members.map((m) => ({ ...m, exists: true, missingSchools: 0 })) } : p));
    } catch {
      setApiError({ error: "Verbindung fehlgeschlagen" });
    } finally {
      setImporting(false);
    }
  };

  const newCount = preview?.members.filter((m) => !m.exists).length ?? 0;
  const updateCount = preview?.members.filter((m) => m.exists && m.missingSchools > 0).length ?? 0;
  const unchangedCount = (preview?.members.length ?? 0) - newCount - updateCount;
  const schoolNames = schools.filter((s) => schoolIds.includes(s.id)).map((s) => s.name).join(", ");

  return (
    <div className="card p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-[#007AFF]" />
          <h2 className="text-[18px] font-bold text-[#1C1C1E]">Direkt aus Microsoft 365 importieren</h2>
        </div>
        <p className="text-[14px] text-[#8E8E93] mt-1">
          Sucht eine Teams-/Entra-Gruppe (z.B. «Schulhaus Dorf») und weist deren Mitglieder den gewählten
          Schulhäusern zu. Neue Benutzer werden angelegt, bestehende erhalten fehlende Schulhäuser dazu.
          Wer in mehreren Gruppen ist, bekommt so Zugriff auf alle entsprechenden Bibliotheken.
          Deaktivierte Konten werden ausgelassen.
        </p>
      </div>

      {/* School mapping */}
      <div className="bg-[#F2F2F7] rounded-xl p-4">
        <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">
          Mitglieder dieser Gruppe erhalten Zugriff auf
        </p>
        <div className="flex flex-wrap gap-2">
          {schools.map((s) => {
            const on = schoolIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSchool(s.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all",
                  on
                    ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm"
                    : "bg-white text-[#3A3A3C] border-[#C6C6C8] hover:border-[#007AFF]"
                )}
              >
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: on ? "#fff" : (s.color ?? "#8E8E93") }} />
                {s.name}
              </button>
            );
          })}
        </div>
        {schoolIds.length === 0 && (
          <p className="text-[12px] text-[#FF9500] mt-2">Mindestens ein Schulhaus wählen.</p>
        )}
      </div>

      {/* Group search */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gruppenname, z.B. Lehrpersonen"
            className="w-full bg-white border border-[#C6C6C8] rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
          />
        </div>
        <Button type="submit" loading={searching}>
          <Search size={15} />
          Gruppen suchen
        </Button>
      </form>

      {apiError && (
        <div className="p-4 bg-[#FFF3F3] rounded-xl space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#FF3B30]" />
            <p className="text-[13px] font-semibold text-[#FF3B30]">{apiError.error}</p>
          </div>
          {apiError.hint && <p className="text-[13px] text-[#3A3A3C] pl-6">{apiError.hint}</p>}
        </div>
      )}

      {/* Group list */}
      {groups && (
        groups.length === 0 ? (
          <p className="text-[14px] text-[#8E8E93]">Keine Gruppe gefunden.</p>
        ) : (
          <div className="border border-[#E5E5EA] rounded-xl divide-y divide-[#F2F2F7] max-h-64 overflow-y-auto">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => loadPreview(g)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  selected?.id === g.id ? "bg-[#E1F0FF]" : "hover:bg-[#F9F9FB]"
                )}
              >
                <Users size={16} className={selected?.id === g.id ? "text-[#007AFF]" : "text-[#8E8E93]"} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">{g.displayName}</p>
                  {(g.description || g.mail) && (
                    <p className="text-[12px] text-[#8E8E93] truncate">{g.description ?? g.mail}</p>
                  )}
                </div>
                {selected?.id === g.id && previewing && <Loader2 size={16} className="animate-spin text-[#007AFF]" />}
              </button>
            ))}
          </div>
        )
      )}

      {selected && schoolIds.length === 0 && (
        <p className="text-[13px] text-[#FF9500]">Wähle oben die Schulhäuser für «{selected.displayName}», dann erscheint die Vorschau.</p>
      )}

      {/* Preview */}
      {selected && preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F2F7] rounded-xl p-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1C1C1E]">{selected.displayName} → {schoolNames}</p>
              <p className="text-[13px] text-[#3A3A3C] mt-0.5">
                {preview.members.length} Mitglieder · {newCount} neu · {updateCount} erhalten Schulhäuser dazu · {unchangedCount} unverändert
                {preview.disabled > 0 && ` · ${preview.disabled} deaktiviert (werden ausgelassen)`}
              </p>
            </div>
            <Button onClick={runImport} loading={importing} disabled={newCount + updateCount === 0}>
              <UserPlus size={15} />
              {newCount + updateCount} Benutzer übernehmen
            </Button>
          </div>

          <div className="border border-[#E5E5EA] rounded-xl divide-y divide-[#F2F2F7] max-h-80 overflow-y-auto">
            {preview.members.map((m) => (
              <div key={m.email} className="flex items-center gap-3 px-4 py-2">
                {!m.exists ? (
                  <UserPlus size={15} className="text-[#007AFF] flex-shrink-0" />
                ) : m.missingSchools > 0 ? (
                  <UserPlus size={15} className="text-[#FF9500] flex-shrink-0" />
                ) : (
                  <UserCheck size={15} className="text-[#34C759] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1C1C1E] truncate">{m.name ?? m.email}</p>
                  <p className="text-[12px] text-[#8E8E93] truncate">{m.email}</p>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    !m.exists ? "text-[#007AFF]" : m.missingSchools > 0 ? "text-[#FF9500]" : "text-[#8E8E93]"
                  )}
                >
                  {!m.exists ? "neu" : m.missingSchools > 0 ? `+${m.missingSchools} Schulhaus` : "unverändert"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-3 p-4 bg-[#E3F9E8] rounded-xl">
          <CheckCircle size={18} className="text-[#28A745] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-[#1C6A2E]">
              {result.created} neu angelegt, {result.updated} mit Schulhäusern ergänzt
            </p>
            {result.skipped > 0 && (
              <p className="text-[13px] text-[#3A3A3C] mt-0.5">{result.skipped} unverändert</p>
            )}
            {result.errors.length > 0 && (
              <p className="text-[13px] text-[#FF3B30] mt-0.5">{result.errors.length} Fehler</p>
            )}
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-medium text-[#007AFF] hover:underline">
              <Users size={14} />
              Zur Benutzerverwaltung – Rollen vergeben
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
