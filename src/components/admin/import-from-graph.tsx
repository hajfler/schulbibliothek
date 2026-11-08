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
}

interface Preview {
  total: number;
  disabled: number;
  members: PreviewMember[];
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string; email?: string }[];
  total: number;
}

interface ApiError {
  error: string;
  hint?: string;
}

/** Import von Benutzern direkt aus einer Entra-Gruppe über Microsoft Graph. */
export function ImportFromGraph() {
  const { addToast } = useToast();
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

  const loadPreview = async (group: GraphGroup) => {
    setSelected(group);
    setPreview(null);
    setResult(null);
    setApiError(null);
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/import/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, preview: true }),
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

  const runImport = async () => {
    if (!selected) return;
    setImporting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/admin/import/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data);
        return;
      }
      setResult(data);
      addToast(
        data.created > 0 ? `${data.created} Benutzer importiert` : "Keine neuen Benutzer importiert",
        data.created > 0 ? "success" : "info"
      );
      // Vorschau aktualisieren: alle sind jetzt vorhanden
      setPreview((p) => (p ? { ...p, members: p.members.map((m) => ({ ...m, exists: true })) } : p));
    } catch {
      setApiError({ error: "Verbindung fehlgeschlagen" });
    } finally {
      setImporting(false);
    }
  };

  const newCount = preview?.members.filter((m) => !m.exists).length ?? 0;

  return (
    <div className="card p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-[#007AFF]" />
          <h2 className="text-[18px] font-bold text-[#1C1C1E]">Direkt aus Microsoft 365 importieren</h2>
        </div>
        <p className="text-[14px] text-[#8E8E93] mt-1">
          Sucht eine Gruppe in Entra ID (z.B. «Lehrpersonen») und legt deren Mitglieder an. Deaktivierte
          Konten und bereits vorhandene Benutzer werden übersprungen.
        </p>
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

      {/* Preview */}
      {selected && preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F2F7] rounded-xl p-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1C1C1E]">{selected.displayName}</p>
              <p className="text-[13px] text-[#3A3A3C] mt-0.5">
                {preview.members.length} Mitglieder · {newCount} neu · {preview.members.length - newCount} bereits vorhanden
                {preview.disabled > 0 && ` · ${preview.disabled} deaktiviert (werden ausgelassen)`}
              </p>
            </div>
            <Button onClick={runImport} loading={importing} disabled={newCount === 0}>
              <UserPlus size={15} />
              {newCount} Benutzer importieren
            </Button>
          </div>

          <div className="border border-[#E5E5EA] rounded-xl divide-y divide-[#F2F2F7] max-h-80 overflow-y-auto">
            {preview.members.map((m) => (
              <div key={m.email} className="flex items-center gap-3 px-4 py-2">
                {m.exists ? (
                  <UserCheck size={15} className="text-[#34C759] flex-shrink-0" />
                ) : (
                  <UserPlus size={15} className="text-[#007AFF] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1C1C1E] truncate">{m.name ?? m.email}</p>
                  <p className="text-[12px] text-[#8E8E93] truncate">{m.email}</p>
                </div>
                <span className={cn("text-[11px] font-semibold", m.exists ? "text-[#8E8E93]" : "text-[#007AFF]")}>
                  {m.exists ? "vorhanden" : "neu"}
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
              {result.created} von {result.total} Benutzern importiert
            </p>
            {result.skipped > 0 && (
              <p className="text-[13px] text-[#3A3A3C] mt-0.5">{result.skipped} bereits vorhanden (übersprungen)</p>
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
