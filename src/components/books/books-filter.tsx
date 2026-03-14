"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "", label: "Alle Typen" },
  { value: "BOOK", label: "Buch" },
  { value: "MAGAZINE", label: "Zeitschrift" },
  { value: "COMIC", label: "Comic" },
  { value: "AUDIOBOOK", label: "Hörbuch" },
  { value: "EBOOK", label: "E-Book" },
  { value: "REFERENCE", label: "Nachschlagewerk" },
];

const availabilityOptions = [
  { value: "", label: "Alle" },
  { value: "true", label: "Verfügbar" },
  { value: "false", label: "Ausgeliehen" },
];

export function BooksFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter("search", search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const currentType = searchParams.get("type") ?? "";
  const currentAvailable = searchParams.get("available") ?? "";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Titel, Autor, ISBN suchen..."
          className="w-full bg-white border border-[#C6C6C8] rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1">
        {typeOptions.slice(0, 4).map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("type", opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              currentType === opt.value
                ? "bg-[#007AFF] text-white shadow-sm"
                : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Availability filter */}
      <div className="flex gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1">
        {availabilityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("available", opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              currentAvailable === opt.value
                ? "bg-[#007AFF] text-white shadow-sm"
                : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
            )}
          >
            {opt.value === "true" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#34C759] mr-1.5 mb-0.5" />
            )}
            {opt.value === "false" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] mr-1.5 mb-0.5" />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
