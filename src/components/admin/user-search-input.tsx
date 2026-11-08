"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface School {
  id: string;
  name: string;
}

interface UserSearchInputProps {
  /** Schulhäuser für den Filter; leer → Filter ausgeblendet (Bibliothekare sehen nur ihr Schulhaus) */
  schools?: School[];
}

const ROLE_OPTIONS = [
  { value: "", label: "Alle Rollen" },
  { value: "USER", label: "Benutzer" },
  { value: "LIBRARIAN", label: "Bibliothekar" },
  { value: "ADMIN", label: "Admin" },
];

const selectClass =
  "appearance-none pl-3 pr-8 py-2 text-[14px] border border-[#C6C6C8] rounded-xl bg-white text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] transition-colors cursor-pointer";

/** Filterzeile der Benutzerverwaltung: Textsuche (entprellt), Rolle und Schulhaus (sofort). */
export function UserSearchInput({ schools = [] }: UserSearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
  const currentRole = searchParams.get("role") ?? "";
  const currentSchool = searchParams.get("school") ?? "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildUrl(q: string, r: string, s: string) {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (r) params.set("role", r);
    if (s) params.set("school", s);
    return `/admin/users${params.size ? `?${params}` : ""}`;
  }

  // Nur die Texteingabe ist entprellt; die Auswahlfelder stossen sofort an
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchText === (searchParams.get("search") ?? "")) return;
      router.push(buildUrl(searchText, currentRole, currentSchool));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Name oder E-Mail…"
          className="pl-9 pr-8 py-2 text-[14px] border border-[#C6C6C8] rounded-xl bg-white focus:outline-none focus:border-[#007AFF] w-56 transition-colors"
          autoComplete="off"
        />
        {searchText && (
          <button
            onClick={() => setSearchText("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#3A3A3C]"
            aria-label="Suche leeren"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={currentRole}
          onChange={(e) => router.push(buildUrl(searchText, e.target.value, currentSchool))}
          className={selectClass}
          aria-label="Nach Rolle filtern"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" />
      </div>

      {schools.length > 0 && (
        <div className="relative">
          <select
            value={currentSchool}
            onChange={(e) => router.push(buildUrl(searchText, currentRole, e.target.value))}
            className={selectClass}
            aria-label="Nach Schulhaus filtern"
          >
            <option value="">Alle Schulhäuser</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" />
        </div>
      )}
    </div>
  );
}
