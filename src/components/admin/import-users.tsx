"use client";

import * as React from "react";
import Link from "next/link";
import { Upload, CheckCircle, AlertCircle, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ImportResult {
  created: number;
  updated?: number;
  skipped: number;
  errors: { row: number; message: string; email?: string }[];
  total: number;
}

const SAMPLE_ROWS = [
  ["Display Name", "User Principal Name"],
  ["Max Muster", "m.muster@schule-dietlikon.ch"],
  ["Anna Beispiel", "a.beispiel@schule-dietlikon.ch"],
];

export function ImportUsers() {
  const { addToast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) {
      addToast("Bitte eine CSV-Datei auswählen", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import/users", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Importfehler");
      setResult(data);
      addToast(
        data.created > 0 ? `${data.created} Benutzer importiert` : "Keine neuen Benutzer importiert",
        data.created > 0 ? "success" : "info"
      );
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[#1C1C1E]">Alternativ: CSV-Datei importieren</h2>
        <p className="text-[14px] text-[#8E8E93] mt-1">
          CSV-Export aus dem Microsoft 365 Admin Center (Benutzer → Exportieren) oder aus einer
          Entra-Gruppe (Mitglieder → Massenvorgänge → Herunterladen). Bestehende Benutzer werden
          übersprungen. Die Konten werden beim ersten Login automatisch verknüpft, Rollen kannst du
          sofort unter <Link href="/admin/users" className="text-[#007AFF] hover:underline">Benutzer</Link> vergeben.
        </p>
      </div>

      <div className="bg-[#F2F2F7] rounded-xl p-4">
        <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">
          Erkannte Spalten
        </p>
        <p className="text-[13px] text-[#3A3A3C] font-mono mb-3">
          Display Name / Anzeigename, User Principal Name / Benutzerprinzipalname / E-Mail
        </p>
        <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Beispiel</p>
        <div className="overflow-x-auto">
          <table className="text-[12px] font-mono text-[#3A3A3C]">
            <tbody>
              {SAMPLE_ROWS.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`pr-4 py-0.5 ${i === 0 ? "font-bold text-[#1C1C1E]" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-[#007AFF] bg-[#F0F7FF]" : "border-[#C6C6C8] hover:border-[#007AFF] hover:bg-[#F0F7FF]"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={24} className="text-[#007AFF]" />
            <div className="text-left">
              <p className="text-[14px] font-semibold text-[#1C1C1E]">{file.name}</p>
              <p className="text-[12px] text-[#8E8E93]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <>
            <Upload size={28} className="text-[#8E8E93] mx-auto mb-2" />
            <p className="text-[14px] font-semibold text-[#3A3A3C]">CSV-Datei auswählen</p>
            <p className="text-[12px] text-[#8E8E93] mt-1">Klicken oder Datei hierher ziehen</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" loading={loading} onClick={handleImport} disabled={!file}>
          <Upload size={16} />
          Importieren
        </Button>
        {file && (
          <Button
            variant="secondary"
            onClick={() => {
              pick(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Zurücksetzen
          </Button>
        )}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-[#E3F9E8] rounded-xl">
            <CheckCircle size={18} className="text-[#28A745] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-[#1C6A2E]">
                {result.created} von {result.total} Benutzern importiert
              </p>
              {result.skipped > 0 && (
                <p className="text-[13px] text-[#3A3A3C] mt-0.5">{result.skipped} bereits vorhanden (übersprungen)</p>
              )}
              <Link href="/admin/users" className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-medium text-[#007AFF] hover:underline">
                <Users size={14} />
                Zur Benutzerverwaltung
              </Link>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="p-4 bg-[#FFF3F3] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-[#FF3B30]" />
                <p className="text-[13px] font-semibold text-[#FF3B30]">{result.errors.length} Fehler</p>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-[12px] text-[#FF3B30]">
                    {e.row > 0 ? `Zeile ${e.row}: ` : ""}{e.email ? `${e.email} – ` : ""}{e.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
