"use client";

import { useState } from "react";
import { BookMarked, X, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Loan {
  id: string;
  dueDate: string;
  borrowedAt: string;
  status: "ACTIVE" | "OVERDUE";
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
}

interface Props {
  userId: string;
  userName: string;
  loanCount: number;
}

export function UserLoansModal({ userId, userName, loanCount }: Props) {
  const [open, setOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (loans !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/loans`);
      const data = await res.json();
      setLoans(data);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const daysUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
          loanCount > 0
            ? "hover:bg-[#F2F2F7] cursor-pointer"
            : "cursor-default opacity-50"
        }`}
        disabled={loanCount === 0}
        title={loanCount > 0 ? "Ausleihen anzeigen" : "Keine aktiven Ausleihen"}
      >
        <BookMarked size={14} className={loanCount > 0 ? "text-[#007AFF]" : "text-[#8E8E93]"} />
        <span className={`text-[14px] font-medium ${loanCount > 0 ? "text-[#007AFF]" : "text-[#3A3A3C]"}`}>
          {loanCount}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                  Aktive Ausleihen
                </h2>
                <p className="text-[13px] text-[#8E8E93] mt-0.5">{userName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-colors"
              >
                <X size={18} className="text-[#3A3A3C]" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && loans?.length === 0 && (
                <div className="flex flex-col items-center py-10 text-[#8E8E93]">
                  <BookOpen size={36} className="mb-2 text-[#C7C7CC]" />
                  <p className="text-[14px]">Keine aktiven Ausleihen</p>
                </div>
              )}

              {!loading && loans && loans.length > 0 && (
                <div className="space-y-2">
                  {loans.map((loan) => {
                    const days = daysUntil(loan.dueDate);
                    const isOverdue = loan.status === "OVERDUE" || days < 0;
                    return (
                      <Link
                        key={loan.id}
                        href={`/books/${loan.book.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                      >
                        {loan.book.coverUrl ? (
                          <img
                            src={loan.book.coverUrl}
                            alt=""
                            className="w-9 h-12 object-cover rounded-md shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-12 bg-[#F2F2F7] rounded-md flex-shrink-0 flex items-center justify-center">
                            <BookOpen size={16} className="text-[#C7C7CC]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">
                            {loan.book.title}
                          </p>
                          <p className="text-[12px] text-[#8E8E93]">{loan.book.author}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {isOverdue ? (
                              <AlertCircle size={12} className="text-[#FF3B30]" />
                            ) : null}
                            <span className={`text-[12px] font-medium ${isOverdue ? "text-[#FF3B30]" : days <= 3 ? "text-[#FF9500]" : "text-[#8E8E93]"}`}>
                              {isOverdue
                                ? `${Math.abs(days)}T überfällig`
                                : days === 0
                                ? "Heute fällig"
                                : `Fällig ${formatDate(loan.dueDate)}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isOverdue
                              ? "bg-[#FFF2F0] text-[#FF3B30]"
                              : "bg-[#EBF5FF] text-[#007AFF]"
                          }`}>
                            {isOverdue ? "Überfällig" : "Aktiv"}
                          </span>
                          <p className="text-[11px] text-[#C7C7CC] mt-1">
                            seit {formatDate(loan.borrowedAt)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
