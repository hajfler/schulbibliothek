"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export function UserSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      router.push(`/admin/users${params.size ? `?${params}` : ""}`);
    },
    [router]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, push]);

  return (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name oder E-Mail suchen…"
        className="pl-9 pr-8 py-2 text-[14px] border border-[#C6C6C8] rounded-xl bg-white focus:outline-none focus:border-[#007AFF] w-64 transition-colors"
        autoComplete="off"
        autoFocus
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#3A3A3C]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
