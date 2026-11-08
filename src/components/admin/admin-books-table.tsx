"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DeleteBookButton } from "@/components/admin/delete-book-button";
import { BulkMoveBooks } from "@/components/admin/bulk-move-books";
import { formatDate } from "@/lib/utils";
import { BookOpen, Edit2 } from "lucide-react";

export interface AdminBookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  typePublication: string;
  totalCopies: number;
  activeLoans: number;
  createdAt: string;
  schoolId: string;
  schoolName: string;
  categoryPath: string | null;
  categoryColor: string | null;
}

interface School {
  id: string;
  name: string;
}

const typeLabels: Record<string, string> = {
  BOOK: "Buch", MAGAZINE: "Zeitschrift", NEWSPAPER: "Zeitung", COMIC: "Comic",
  AUDIOBOOK: "Hörbuch", EBOOK: "E-Book", REFERENCE: "Nachschlagewerk", OTHER: "Sonstiges",
};

export function AdminBooksTable({
  books,
  schools,
  isAdmin,
}: {
  books: AdminBookRow[];
  schools: School[];
  isAdmin: boolean;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const canSelect = schools.length > 1;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allSelected = books.length > 0 && books.every((b) => selected.has(b.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(books.map((b) => b.id)));

  const headers = [
    ...(canSelect ? [""] : []),
    "Buch", "Schulhaus", "Kategorie", "Typ", "Exemplare", "Ausgeliehen", "Hinzugefügt", "Aktionen",
  ];

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F7]">
              {headers.map((h, i) => (
                <th key={i} className="text-left px-5 py-3.5 text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                  {canSelect && i === 0 ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-[#007AFF]"
                      aria-label="Alle auswählen"
                    />
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => {
              const available = book.totalCopies - book.activeLoans;
              const isSelected = selected.has(book.id);
              return (
                <tr
                  key={book.id}
                  className={`border-b border-[#F2F2F7] last:border-0 transition-colors ${isSelected ? "bg-[#E1F0FF]/60" : "hover:bg-[#F9F9FB]"}`}
                >
                  {canSelect && (
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(book.id)}
                        className="w-4 h-4 rounded accent-[#007AFF]"
                        aria-label={`${book.title} auswählen`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-11 bg-[#F2F2F7] rounded-md flex items-center justify-center flex-shrink-0">
                          <BookOpen size={14} className="text-[#C7C7CC]" />
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-semibold text-[#1C1C1E] line-clamp-1">{book.title}</p>
                        <p className="text-[12px] text-[#8E8E93]">{book.author}</p>
                        {book.isbn && <p className="text-[11px] text-[#C7C7CC]">ISBN: {book.isbn}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[13px] text-[#3A3A3C]">{book.schoolName}</span>
                  </td>
                  <td className="px-5 py-4">
                    {book.categoryPath ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#3A3A3C]">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: book.categoryColor ?? "#8E8E93" }}
                        />
                        {book.categoryPath}
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#C7C7CC]">–</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="gray">{typeLabels[book.typePublication] ?? book.typePublication}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#3A3A3C]">{book.totalCopies}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${available > 0 ? "bg-[#34C759]" : "bg-[#FF3B30]"}`} />
                      <span className="text-[13px] text-[#3A3A3C]">
                        {book.activeLoans} / {book.totalCopies}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-[#8E8E93]">{formatDate(new Date(book.createdAt))}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/books/${book.id}/edit`}
                        className="p-2 rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                      >
                        <Edit2 size={15} />
                      </Link>
                      <Link
                        href={`/books/${book.id}`}
                        className="p-2 rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                      >
                        <BookOpen size={15} />
                      </Link>
                      {isAdmin && <DeleteBookButton bookId={book.id} bookTitle={book.title} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkMoveBooks
        schools={schools}
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
      />
    </div>
  );
}
