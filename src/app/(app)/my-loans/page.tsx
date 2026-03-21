import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, getDaysUntilDue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ReturnBookButton } from "@/components/loans/return-button";
import { ExtendLoanButton } from "@/components/loans/extend-button";
import { BookOpen, Clock, CheckCircle, AlertCircle, BookMarked, Bell } from "lucide-react";
import Link from "next/link";
import { ReserveButton } from "@/components/books/reserve-button";

export default async function MyLoansPage() {
  const session = await auth();
  if (!session) return null;

  // Update overdue statuses first
  await prisma.loan.updateMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const [loans, reservations] = await Promise.all([
    prisma.loan.findMany({
      where: { userId: session.user.id },
      include: {
        book: {
          select: {
            id: true, title: true, author: true, coverUrl: true,
            school: { select: { name: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.reservation.findMany({
      where: { userId: session.user.id },
      include: {
        book: {
          select: {
            id: true, title: true, author: true, coverUrl: true,
            school: { select: { name: true } },
            _count: { select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const activeLoans = loans.filter((l) => ["ACTIVE", "OVERDUE"].includes(l.status));
  const pastLoans = loans.filter((l) => ["RETURNED", "LOST"].includes(l.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Meine Ausleihen
        </h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">
          {activeLoans.length} aktiv · {pastLoans.length} zurückgegeben{reservations.length > 0 ? ` · ${reservations.length} reserviert` : ""}
        </p>
      </div>

      {/* Active loans */}
      <section>
        <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
          <BookMarked size={18} className="text-[#007AFF]" />
          Aktive Ausleihen
        </h2>

        {activeLoans.length === 0 ? (
          <div className="card text-center py-14">
            <BookOpen size={40} className="text-[#C7C7CC] mx-auto mb-3" />
            <p className="text-[15px] text-[#8E8E93]">
              Du hast keine aktiven Ausleihen
            </p>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 mt-4 text-[14px] text-[#007AFF] font-medium"
            >
              Bücher entdecken
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const days = getDaysUntilDue(loan.dueDate);
              const isOverdue = days < 0;
              return (
                <div key={loan.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    {/* Cover */}
                    <Link href={`/books/${loan.book.id}`} className="flex-shrink-0">
                      {loan.book.coverUrl ? (
                        <img
                          src={loan.book.coverUrl}
                          alt={loan.book.title}
                          className="w-14 h-20 object-cover rounded-xl shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-20 bg-[#F2F2F7] rounded-xl flex items-center justify-center">
                          <BookOpen size={20} className="text-[#C7C7CC]" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/books/${loan.book.id}`}>
                        <h3 className="text-[16px] font-semibold text-[#1C1C1E] hover:text-[#007AFF] transition-colors">
                          {loan.book.title}
                        </h3>
                      </Link>
                      <p className="text-[13px] text-[#8E8E93] mt-0.5">
                        {loan.book.author}
                      </p>
                      <p className="text-[12px] text-[#C7C7CC] mt-0.5">
                        {loan.book.school.name}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        {/* Status */}
                        <Badge variant={isOverdue ? "red" : days <= 3 ? "orange" : "blue"}>
                          {isOverdue ? (
                            <>
                              <AlertCircle size={11} />
                              {Math.abs(days)} Tag{Math.abs(days) !== 1 ? "e" : ""} überfällig
                            </>
                          ) : days === 0 ? (
                            <>
                              <Clock size={11} />
                              Heute fällig
                            </>
                          ) : (
                            <>
                              <Clock size={11} />
                              {days} Tag{days !== 1 ? "e" : ""} verbleibend
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-[12px] text-[#8E8E93]">
                        <span>
                          Ausgeliehen: {formatDate(loan.borrowedAt)}
                        </span>
                        <span className={isOverdue ? "text-[#FF3B30] font-medium" : ""}>
                          Rückgabe: {formatDate(loan.dueDate)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <ReturnBookButton loanId={loan.id} bookTitle={loan.book.title} />
                      <ExtendLoanButton
                        loanId={loan.id}
                        dueDate={loan.dueDate}
                        extensions={loan.extensions}
                        isOverdue={isOverdue}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reservations */}
      {reservations.length > 0 && (
        <section>
          <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
            <Bell size={18} className="text-[#FF9500]" />
            Meine Reservierungen
          </h2>
          <div className="space-y-3">
            {reservations.map((res) => (
              <div key={res.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Link href={`/books/${res.book.id}`} className="flex-shrink-0">
                    {res.book.coverUrl ? (
                      <img
                        src={res.book.coverUrl}
                        alt={res.book.title}
                        className="w-14 h-20 object-cover rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-[#F2F2F7] rounded-xl flex items-center justify-center">
                        <BookOpen size={20} className="text-[#C7C7CC]" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/books/${res.book.id}`}>
                      <h3 className="text-[16px] font-semibold text-[#1C1C1E] hover:text-[#007AFF] transition-colors truncate">
                        {res.book.title}
                      </h3>
                    </Link>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5 truncate">{res.book.author}</p>
                    <p className="text-[12px] text-[#C7C7CC] mt-0.5">{res.book.school.name}</p>
                    <div className="mt-3">
                      <Badge variant="orange">
                        <Bell size={11} />
                        {res.notifiedAt ? "Verfügbar — bitte abholen" : "Wartet auf Verfügbarkeit"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#C7C7CC] mt-2">
                      Reserviert am {formatDate(res.createdAt)}
                    </p>
                    <div className="mt-3">
                      <ReserveButton bookId={res.book.id} reservationId={res.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past loans */}
      {pastLoans.length > 0 && (
        <section>
          <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-[#34C759]" />
            Zurückgegebene Bücher
          </h2>
          <div className="space-y-2">
            {pastLoans.map((loan) => (
              <div
                key={loan.id}
                className="card p-4 flex items-center gap-4 opacity-70"
              >
                <Link href={`/books/${loan.book.id}`} className="flex-shrink-0">
                  {loan.book.coverUrl ? (
                    <img
                      src={loan.book.coverUrl}
                      alt={loan.book.title}
                      className="w-10 h-14 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-[#F2F2F7] rounded-lg flex items-center justify-center">
                      <BookOpen size={14} className="text-[#C7C7CC]" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">
                    {loan.book.title}
                  </p>
                  <p className="text-[12px] text-[#8E8E93]">{loan.book.author}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={loan.status === "RETURNED" ? "green" : "red"}>
                    {loan.status === "RETURNED" ? "Zurückgegeben" : "Verloren"}
                  </Badge>
                  {loan.returnedAt && (
                    <p className="text-[11px] text-[#8E8E93] mt-1">
                      {formatDate(loan.returnedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
