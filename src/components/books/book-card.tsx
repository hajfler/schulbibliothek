"use client";

import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string | null;
    totalCopies: number;
    isAvailable: boolean;
    availableCopies: number;
    typePublication: string;
    series?: string | null;
    loans?: Array<{ user: { name: string | null; email: string | null } }>;
  };
  isStaff?: boolean;
}

const typeLabels: Record<string, string> = {
  BOOK: "Buch",
  MAGAZINE: "Zeitschrift",
  COMIC: "Comic",
  AUDIOBOOK: "Hörbuch",
  EBOOK: "E-Book",
  REFERENCE: "Nachschlagewerk",
  OTHER: "Sonstiges",
};

export function BookCard({ book, isStaff }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`} className="group">
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden shadow-sm",
          "group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200"
        )}
        style={{ aspectRatio: "2/3" }}
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E1F0FF] to-[#B8D9FF] flex flex-col items-center justify-center gap-2 p-3">
            <BookOpen size={28} className="text-[#007AFF] opacity-60" />
            <p className="text-[10px] font-medium text-[#007AFF] opacity-70 text-center leading-tight line-clamp-3">
              {book.title}
            </p>
          </div>
        )}

        {/* Availability dot */}
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full border-2 border-white shadow",
              book.isAvailable ? "bg-[#34C759]" : "bg-[#FF3B30]"
            )}
          />
        </div>

        {/* Copies badge if multiple */}
        {book.totalCopies > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <Users size={9} />
            {book.availableCopies}/{book.totalCopies}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">
              {book.title}
            </p>
            <p className="text-white/70 text-[10px] mt-0.5 truncate">
              {book.author}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="text-[13px] font-semibold text-[#1C1C1E] line-clamp-1 leading-snug">
          {book.title}
        </p>
        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{book.author}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              book.isAvailable ? "bg-[#34C759]" : "bg-[#FF3B30]"
            )}
          />
          <span className="text-[11px] text-[#8E8E93]">
            {book.isAvailable
              ? book.availableCopies > 1
                ? `${book.availableCopies} verfügbar`
                : "Verfügbar"
              : "Ausgeliehen"}
          </span>
        </div>
      </div>
    </Link>
  );
}
