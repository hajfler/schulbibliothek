import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, getDaysUntilDue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BookMarked, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const userId = session.user.id;
  const schoolId = session.user.schoolId;

  const [myActiveLoans, schoolStats, recentBooks] = await Promise.all([
    prisma.loan.findMany({
      where: { userId, status: { in: ["ACTIVE", "OVERDUE"] } },
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    schoolId
      ? prisma.book.count({
          where: { schoolId },
        })
      : null,
    schoolId
      ? prisma.book.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            _count: {
              select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } },
            },
          },
        })
      : [],
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "dort";
  const overdueCount = myActiveLoans.filter(
    (l) => getDaysUntilDue(l.dueDate) < 0
  ).length;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Hallo, {firstName}
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">
          Willkommen in der Bibliothek
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Aktive Ausleihen"
          value={myActiveLoans.length}
          icon={<BookMarked size={20} />}
          color="blue"
        />
        <StatCard
          label="Überfällig"
          value={overdueCount}
          icon={<AlertCircle size={20} />}
          color={overdueCount > 0 ? "red" : "green"}
        />
        {schoolStats !== null && (
          <StatCard
            label="Bücher in der Bibliothek"
            value={schoolStats}
            icon={<BookOpen size={20} />}
            color="purple"
          />
        )}
        <StatCard
          label="Zurückgegeben (30T)"
          value={0}
          icon={<CheckCircle size={20} />}
          color="green"
          href="/my-loans"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My active loans */}
        <div className="card p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
              Meine Ausleihen
            </h2>
            <Link
              href="/my-loans"
              className="text-[13px] text-[#007AFF] font-medium hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>

          {myActiveLoans.length === 0 ? (
            <div className="text-center py-10">
              <BookMarked size={40} className="text-[#C7C7CC] mx-auto mb-3" />
              <p className="text-[15px] text-[#8E8E93]">
                Du hast keine aktiven Ausleihen
              </p>
              <Link
                href="/books"
                className="inline-block mt-3 text-[14px] text-[#007AFF] font-medium"
              >
                Bücher entdecken
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myActiveLoans.map((loan) => {
                const days = getDaysUntilDue(loan.dueDate);
                const isOverdue = days < 0;
                return (
                  <div
                    key={loan.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                  >
                    {loan.book.coverUrl ? (
                      <img
                        src={loan.book.coverUrl}
                        alt={loan.book.title}
                        className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-[#F2F2F7] rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-[#C7C7CC]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">
                        {loan.book.title}
                      </p>
                      <p className="text-[12px] text-[#8E8E93] truncate">
                        {loan.book.author}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <Badge variant={isOverdue ? "red" : days <= 3 ? "orange" : "blue"}>
                        <Clock size={11} />
                        {isOverdue
                          ? `${Math.abs(days)}T überfällig`
                          : days === 0
                          ? "Heute"
                          : `${days}T`}
                      </Badge>
                      <p className="text-[11px] text-[#8E8E93] mt-1">
                        bis {formatDate(loan.dueDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently added books */}
        <div className="card p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
              Neue Bücher
            </h2>
            <Link
              href="/books"
              className="text-[13px] text-[#007AFF] font-medium hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(recentBooks as typeof recentBooks).map((book) => {
              const available =
                book.totalCopies - book._count.loans > 0;
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#F2F2F7] mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={24} className="text-[#C7C7CC]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-[#1C1C1E] truncate">
                    {book.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        available ? "bg-[#34C759]" : "bg-[#FF3B30]"
                      }`}
                    />
                    <p className="text-[11px] text-[#8E8E93]">
                      {available ? "Verfügbar" : "Ausgeliehen"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "red" | "green" | "purple";
  href?: string;
}) {
  const colors = {
    blue: "bg-[#E1F0FF] text-[#007AFF]",
    red: "bg-[#FFE9E9] text-[#FF3B30]",
    green: "bg-[#E3F9E8] text-[#28A745]",
    purple: "bg-[#F3E8FF] text-[#AF52DE]",
  };

  const content = (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[28px] font-bold text-[#1C1C1E]">{value}</p>
      <p className="text-[13px] text-[#8E8E93] mt-0.5">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
