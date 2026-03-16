"use client";

import { useState } from "react";
import { BookMarked, X, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AdminLoanActions } from "@/components/loans/admin-loan-actions";

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
  userEmail: string;
  loanCount: number;
}

export function UserLoansModal({ userId, userName, userEmail, loanCount }: Props) {
  const [open, setOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset cached loans when loanCount changes (after a return/lost action refreshes the page)
  const prevCountRef = useState(loanCount);
  if (prevCountRef[0] !== loanCount) {
    prevCountRef[0] = loanCount;
    setLoans(null);
  }

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
                      <div
                        key={loan.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F9FB] border border-[#F2F2F7]"
                      >
                        {/* Cover + Info — klickbar zur Buchdetail-Seite */}
                        <Link
                          href={`/books/${loan.book.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 flex-1 min-w-0 group"
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
                          <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#1C1C1E] truncate group-hover:text-[#007AFF] transition-colors">
                            {loan.book.title}
                          </p>
                          <p className="text-[12px] text-[#8E8E93] truncate">{loan.book.author}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isOverdue && <AlertCircle size={11} className="text-[#FF3B30] flex-shrink-0" />}
                              <span className={`text-[11px] font-medium ${isOverdue ? "text-[#FF3B30]" : days <= 3 ? "text-[#FF9500]" : "text-[#8E8E93]"}`}>
                                {isOverdue
                                  ? `${Math.abs(days)}T überfällig`
                                  : days === 0
                                  ? "Heute fällig"
                                  : `Fällig ${formatDate(loan.dueDate)}`}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Actions */}
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <AdminLoanActions
                            loanId={loan.id}
                            status={loan.status}
                            userEmail={userEmail}
                            bookTitle={loan.book.title}
                            currentDueDate={loan.dueDate}
                          />
                        </div>
                      </div>
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
