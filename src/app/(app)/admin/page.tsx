import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Users, BookMarked, AlertCircle, TrendingUp, Clock,
} from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;
  const schoolFilter = schoolId ? { schoolId } : {};
  const bookSchoolFilter = schoolId ? { book: { schoolId } } : {};

  const [
    totalBooks,
    totalUsers,
    activeLoans,
    overdueLoans,
    recentLoans,
    popularBooks,
  ] = await Promise.all([
    prisma.book.count({ where: schoolFilter }),
    prisma.user.count({ where: schoolId ? { schoolId } : {} }),
    prisma.loan.count({ where: { ...bookSchoolFilter, status: "ACTIVE" } }),
    prisma.loan.findMany({
      where: { ...bookSchoolFilter, status: "OVERDUE" },
      include: {
        book: { select: { title: true, coverUrl: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.loan.findMany({
      where: bookSchoolFilter,
      include: {
        book: { select: { title: true, author: true, coverUrl: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.book.findMany({
      where: { ...schoolFilter, loans: { some: {} } },
      include: { _count: { select: { loans: true } } },
      orderBy: { loans: { _count: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Verwaltung
        </h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">Übersicht der Bibliothek</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bücher", value: totalBooks, icon: <BookOpen size={20} />, color: "blue" as const, href: "/admin/books" },
          { label: "Benutzer", value: totalUsers, icon: <Users size={20} />, color: "purple" as const, href: "/admin/users" },
          { label: "Aktive Ausleihen", value: activeLoans, icon: <BookMarked size={20} />, color: "green" as const, href: "/admin/loans" },
          { label: "Überfällig", value: overdueLoans.length, icon: <AlertCircle size={20} />, color: overdueLoans.length > 0 ? "red" as const : "green" as const, href: "/admin/loans?status=OVERDUE" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              stat.color === "blue" ? "bg-[#E1F0FF] text-[#007AFF]" :
              stat.color === "purple" ? "bg-[#F3E8FF] text-[#AF52DE]" :
              stat.color === "green" ? "bg-[#E3F9E8] text-[#28A745]" :
              "bg-[#FFE9E9] text-[#FF3B30]"
            }`}>
              {stat.icon}
            </div>
            <p className="text-[28px] font-bold text-[#1C1C1E]">{stat.value}</p>
            <p className="text-[13px] text-[#8E8E93] mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Overdue loans */}
        {overdueLoans.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E] flex items-center gap-2">
                <AlertCircle size={18} className="text-[#FF3B30]" />
                Überfällige Ausleihen
              </h2>
              <Link href="/admin/loans?status=OVERDUE" className="text-[13px] text-[#007AFF]">
                Alle
              </Link>
            </div>
            <div className="space-y-3">
              {overdueLoans.map((loan) => {
                const days = Math.abs(
                  Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / 86400000)
                );
                return (
                  <div key={loan.id} className="flex items-center gap-3 p-3 bg-[#FFF8F8] rounded-xl border border-[#FFE9E9]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">
                        {loan.book.title}
                      </p>
                      <p className="text-[12px] text-[#8E8E93]">
                        {loan.user.name ?? loan.user.email}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="red">{days}T überfällig</Badge>
                      <a
                        href={`mailto:${loan.user.email}?subject=Überfälliges Buch: ${encodeURIComponent(loan.book.title)}`}
                        className="block text-[11px] text-[#007AFF] mt-1"
                      >
                        E-Mail senden
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent loans */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-[#1C1C1E] flex items-center gap-2">
              <Clock size={18} className="text-[#007AFF]" />
              Letzte Ausleihen
            </h2>
            <Link href="/admin/loans" className="text-[13px] text-[#007AFF]">
              Alle
            </Link>
          </div>
          <div className="space-y-2">
            {recentLoans.map((loan) => (
              <div key={loan.id} className="flex items-center gap-3 py-2 border-b border-[#F2F2F7] last:border-0">
                {loan.book.coverUrl ? (
                  <img src={loan.book.coverUrl} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-8 h-11 bg-[#F2F2F7] rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1C1C1E] truncate">
                    {loan.book.title}
                  </p>
                  <p className="text-[11px] text-[#8E8E93]">
                    {loan.user.name ?? loan.user.email}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <Badge
                    variant={
                      loan.status === "RETURNED" ? "green" :
                      loan.status === "OVERDUE" ? "red" : "blue"
                    }
                  >
                    {loan.status === "RETURNED" ? "Zurück" :
                     loan.status === "OVERDUE" ? "Überfällig" : "Aktiv"}
                  </Badge>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most borrowed */}
        {popularBooks.length > 0 && (
          <div className="card p-6">
            <h2 className="text-[17px] font-semibold text-[#1C1C1E] flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-[#34C759]" />
              Meistausgeliehen
            </h2>
            <div className="space-y-3">
              {popularBooks.map((book, i) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                >
                  <span className="text-[20px] font-bold text-[#C7C7CC] w-7 text-center">
                    {i + 1}
                  </span>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-11 bg-[#F2F2F7] rounded-md flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">{book.title}</p>
                    <p className="text-[12px] text-[#8E8E93]">{book._count.loans}x ausgeliehen</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
