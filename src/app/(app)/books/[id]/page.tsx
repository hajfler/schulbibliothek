import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, getDaysUntilDue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LoanModal } from "@/components/loans/loan-modal";
import {
  BookOpen, ArrowLeft, BookMarked, Calendar,
  Hash, Building2, Layers, FileText, Globe, Edit2
} from "lucide-react";
import Link from "next/link";
import { ContactBorrowerModal } from "@/components/loans/contact-borrower-modal";

const typeLabels: Record<string, string> = {
  BOOK: "Buch", MAGAZINE: "Zeitschrift", COMIC: "Comic",
  AUDIOBOOK: "Hörbuch", EBOOK: "E-Book", REFERENCE: "Nachschlagewerk", OTHER: "Sonstiges",
};

const formatLabels: Record<string, string> = {
  HARDCOVER: "Hardcover", PAPERBACK: "Taschenbuch", POCKET: "Pocket",
  LARGE_PRINT: "Großdruck", OTHER: "Andere",
};

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user.role);

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      school: { select: { name: true, color: true } },
      loans: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!book) notFound();

  const activeLoans = book.loans.filter((l) =>
    ["ACTIVE", "OVERDUE"].includes(l.status)
  );
  const availableCopies = book.totalCopies - activeLoans.length;
  const isAvailable = availableCopies > 0;
  const myActiveLoan = book.loans.find(
    (l) => l.userId === session.user.id && ["ACTIVE", "OVERDUE"].includes(l.status)
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-[14px] text-[#007AFF] hover:underline"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </Link>

      <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-8">
        {/* Cover */}
        <div className="space-y-4">
          <div
            className="rounded-2xl overflow-hidden shadow-lg"
            style={{ aspectRatio: "2/3" }}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E1F0FF] to-[#B8D9FF] flex flex-col items-center justify-center gap-3">
                <BookOpen size={48} className="text-[#007AFF] opacity-60" />
                <p className="text-[14px] font-medium text-[#007AFF] opacity-70 text-center px-4">
                  {book.title}
                </p>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="card p-4 text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold ${
                isAvailable
                  ? "bg-[#E3F9E8] text-[#28A745]"
                  : "bg-[#FFE9E9] text-[#FF3B30]"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? "bg-[#34C759]" : "bg-[#FF3B30]"
                }`}
              />
              {isAvailable
                ? `${availableCopies} von ${book.totalCopies} verfügbar`
                : "Momentan ausgeliehen"}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {myActiveLoan ? (
              <div className="card p-4 text-center">
                <p className="text-[13px] text-[#8E8E93] mb-1">
                  Du hast dieses Buch ausgeliehen
                </p>
                <p className="text-[14px] font-semibold text-[#1C1C1E]">
                  bis {formatDate(myActiveLoan.dueDate)}
                </p>
                <Link
                  href="/my-loans"
                  className="inline-flex items-center gap-2 mt-3 text-[13px] text-[#007AFF] font-medium"
                >
                  <BookMarked size={14} />
                  Zur Ausleihe
                </Link>
              </div>
            ) : isAvailable ? (
              <LoanModal book={{ id: book.id, title: book.title, author: book.author }} />
            ) : (
              <button
                disabled
                className="w-full bg-[#F2F2F7] text-[#C7C7CC] font-semibold py-3 rounded-xl cursor-not-allowed text-[15px]"
              >
                Nicht verfügbar
              </button>
            )}

            {isStaff && (
              <div className="flex gap-2">
                <Link
                  href={`/admin/books/${book.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 border border-[#C6C6C8] text-[#3A3A3C] font-semibold py-2.5 rounded-xl hover:bg-[#F2F2F7] transition-colors text-[14px]"
                >
                  <Edit2 size={14} />
                  Bearbeiten
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="blue">{typeLabels[book.typePublication] ?? book.typePublication}</Badge>
              {book.series && (
                <Badge variant="purple">{book.series}</Badge>
              )}
            </div>
            <h1 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-tight">
              {book.title}
            </h1>
            <p className="text-[18px] text-[#3A3A3C] mt-1">{book.author}</p>
          </div>

          {/* Description */}
          {book.description && (
            <div className="card p-5">
              <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">
                Beschreibung
              </h3>
              <p className="text-[15px] text-[#3A3A3C] leading-relaxed">
                {book.description}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-4">
              Buchdetails
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {book.isbn && (
                <InfoRow icon={<Hash size={15} />} label="ISBN" value={book.isbn} />
              )}
              {book.publishingHouse && (
                <InfoRow icon={<Building2 size={15} />} label="Verlag" value={book.publishingHouse} />
              )}
              {book.publishedDate && (
                <InfoRow icon={<Calendar size={15} />} label="Erschienen" value={book.publishedDate} />
              )}
              {book.pageCount && (
                <InfoRow icon={<FileText size={15} />} label="Seiten" value={book.pageCount.toString()} />
              )}
              <InfoRow icon={<Layers size={15} />} label="Format" value={formatLabels[book.format] ?? book.format} />
              {book.language && (
                <InfoRow icon={<Globe size={15} />} label="Sprache" value={book.language.toUpperCase()} />
              )}
              <InfoRow icon={<BookOpen size={15} />} label="Exemplare" value={book.totalCopies.toString()} />
              <InfoRow icon={<Building2 size={15} />} label="Bibliothek" value={book.school.name} />
            </div>
          </div>

          {/* Active borrowers */}
          {activeLoans.length > 0 && (
            <div className="card p-5">
              <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-4">
                Aktuell ausgeliehen
              </h3>
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const days = getDaysUntilDue(loan.dueDate);
                  const isOverdue = days < 0;
                  return (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F2F2F7]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[12px] font-semibold">
                          {loan.user.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#1C1C1E]">
                            {loan.user.name ?? loan.user.email}
                          </p>
                          <p className="text-[12px] text-[#8E8E93]">
                            {loan.user.email}
                          </p>
                          <ContactBorrowerModal
                            loanId={loan.id}
                            borrowerName={loan.user.name ?? loan.user.email ?? ""}
                            borrowerEmail={loan.user.email ?? ""}
                            bookTitle={book.title}
                          />
                        </div>
                      </div>
                      <Badge variant={isOverdue ? "red" : days <= 3 ? "orange" : "blue"}>
                        {isOverdue
                          ? `${Math.abs(days)}T überfällig`
                          : `bis ${formatDate(loan.dueDate)}`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loan history (staff only) */}
          {isStaff && book.loans.length > 0 && (
            <div className="card p-5">
              <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-4">
                Ausleih-Verlauf
              </h3>
              <div className="space-y-2">
                {book.loans.slice(0, 10).map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between py-2 border-b border-[#F2F2F7] last:border-0"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">
                        {loan.user.name ?? loan.user.email}
                      </p>
                      <p className="text-[11px] text-[#8E8E93]">
                        {formatDate(loan.borrowedAt)} – {loan.returnedAt ? formatDate(loan.returnedAt) : "noch ausgeliehen"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        loan.status === "RETURNED"
                          ? "green"
                          : loan.status === "OVERDUE"
                          ? "red"
                          : "blue"
                      }
                    >
                      {loan.status === "RETURNED"
                        ? "Zurückgegeben"
                        : loan.status === "OVERDUE"
                        ? "Überfällig"
                        : loan.status === "LOST"
                        ? "Verloren"
                        : "Aktiv"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-[#8E8E93] mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-[14px] text-[#1C1C1E] font-medium">{value}</p>
      </div>
    </div>
  );
}
