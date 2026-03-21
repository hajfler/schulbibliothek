import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, getDaysUntilDue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AdminLoanActions } from "@/components/loans/admin-loan-actions";
import { BookOpen, Filter, Mail } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; school?: string }>;
}

export default async function AdminLoansPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { status, search, school } = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  // Admins see all schools; librarians only their own school
  const schoolFilter = isAdmin
    ? (school ? { schoolId: school } : {})
    : { schoolId: session.user.schoolId ?? undefined };

  const schools = isAdmin
    ? await prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const where = {
    ...(Object.keys(schoolFilter).length ? { book: schoolFilter } : {}),
    ...(status ? { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST" } : {}),
    ...(search
      ? {
          OR: [
            { book: { title: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  // Update overdue status
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() }, ...(Object.keys(schoolFilter).length ? { book: schoolFilter } : {}) },
    data: { status: "OVERDUE" },
  });

  const loans = await prisma.loan.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, author: true, coverUrl: true, school: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    take: 100,
  });

  const statusFilters = [
    { value: "", label: "Alle" },
    { value: "ACTIVE", label: "Aktiv" },
    { value: "OVERDUE", label: "Überfällig" },
    { value: "RETURNED", label: "Zurückgegeben" },
    { value: "LOST", label: "Verloren" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Alle Ausleihen
        </h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">{loans.length} Einträge</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1">
          {statusFilters.map((f) => {
            const params = new URLSearchParams();
            if (f.value) params.set("status", f.value);
            if (school) params.set("school", school);
            if (search) params.set("search", search);
            return (
              <Link
                key={f.value}
                href={`/admin/loans${params.size ? `?${params}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  (status ?? "") === f.value
                    ? "bg-[#007AFF] text-white"
                    : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* School filter (admin only) */}
        {isAdmin && schools.length > 1 && (
          <div className="flex flex-wrap gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1">
            {[{ id: "", name: "Alle Schulhäuser" }, ...schools].map((s) => {
              const params = new URLSearchParams();
              if (status) params.set("status", status);
              if (s.id) params.set("school", s.id);
              if (search) params.set("search", search);
              return (
                <Link
                  key={s.id}
                  href={`/admin/loans${params.size ? `?${params}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    (school ?? "") === s.id
                      ? "bg-[#007AFF] text-white"
                      : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
                  }`}
                >
                  {s.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      {loans.length === 0 ? (
        <div className="card text-center py-14">
          <BookOpen size={40} className="text-[#C7C7CC] mx-auto mb-3" />
          <p className="text-[15px] text-[#8E8E93]">Keine Ausleihen gefunden</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loans.map((loan) => {
              const days = getDaysUntilDue(loan.dueDate);
              const isOverdue = loan.status === "OVERDUE";
              return (
                <div key={loan.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    {loan.book.coverUrl ? (
                      <img src={loan.book.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 bg-[#F2F2F7] rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/books/${loan.book.id}`} className="text-[14px] font-semibold text-[#1C1C1E] hover:text-[#007AFF] line-clamp-1">
                            {loan.book.title}
                          </Link>
                          <p className="text-[12px] text-[#8E8E93]">{loan.book.author}</p>
                        </div>
                        <Badge variant={loan.status === "RETURNED" ? "green" : loan.status === "OVERDUE" ? "red" : loan.status === "LOST" ? "gray" : "blue"}>
                          {loan.status === "ACTIVE" ? "Aktiv" : loan.status === "RETURNED" ? "Zurück" : loan.status === "OVERDUE" ? "Überfällig" : "Verloren"}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[12px] font-medium text-[#1C1C1E]">{loan.user.name ?? loan.user.email}</p>
                        <a href={`mailto:${loan.user.email}`} className="flex items-center gap-1 text-[12px] text-[#007AFF]">
                          <Mail size={10} />{loan.user.email}
                        </a>
                        {isAdmin && <p className="text-[12px] text-[#8E8E93]">{loan.book.school.name}</p>}
                        <p className={`text-[12px] font-medium ${isOverdue ? "text-[#FF3B30]" : "text-[#3A3A3C]"}`}>
                          Fällig: {formatDate(loan.dueDate)}
                          {isOverdue && ` · ${Math.abs(days)}T überfällig`}
                          {loan.status === "ACTIVE" && days <= 3 && days >= 0 && ` · In ${days}T fällig`}
                        </p>
                      </div>
                      <div className="mt-3">
                        <AdminLoanActions loanId={loan.id} status={loan.status} userEmail={loan.user.email ?? ""} bookTitle={loan.book.title} currentDueDate={loan.dueDate.toISOString()} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F2F7]">
                  {["Buch", ...(isAdmin ? ["Schulhaus"] : []), "Benutzer", "Ausgeliehen", "Fällig", "Status", "Aktionen"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const days = getDaysUntilDue(loan.dueDate);
                  const isOverdue = loan.status === "OVERDUE";
                  return (
                    <tr key={loan.id} className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#F9F9FB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {loan.book.coverUrl ? (
                            <img src={loan.book.coverUrl} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-11 bg-[#F2F2F7] rounded-md flex-shrink-0" />
                          )}
                          <div>
                            <Link href={`/books/${loan.book.id}`} className="text-[14px] font-semibold text-[#1C1C1E] hover:text-[#007AFF] line-clamp-1">
                              {loan.book.title}
                            </Link>
                            <p className="text-[12px] text-[#8E8E93]">{loan.book.author}</p>
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-[#3A3A3C]">{loan.book.school.name}</span>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <p className="text-[14px] font-medium text-[#1C1C1E]">{loan.user.name ?? loan.user.email}</p>
                        <a href={`mailto:${loan.user.email}`} className="flex items-center gap-1 text-[12px] text-[#007AFF] hover:underline mt-0.5">
                          <Mail size={11} />{loan.user.email}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] text-[#3A3A3C]">{formatDate(loan.borrowedAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className={`text-[13px] font-medium ${isOverdue ? "text-[#FF3B30]" : "text-[#3A3A3C]"}`}>
                          {formatDate(loan.dueDate)}
                        </p>
                        {loan.status === "ACTIVE" && days <= 3 && days >= 0 && (
                          <p className="text-[11px] text-[#FF9500]">In {days}T fällig</p>
                        )}
                        {isOverdue && (
                          <p className="text-[11px] text-[#FF3B30]">{Math.abs(days)}T überfällig</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={loan.status === "RETURNED" ? "green" : loan.status === "OVERDUE" ? "red" : loan.status === "LOST" ? "gray" : "blue"}>
                          {loan.status === "ACTIVE" ? "Aktiv" : loan.status === "RETURNED" ? "Zurückgegeben" : loan.status === "OVERDUE" ? "Überfällig" : "Verloren"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <AdminLoanActions loanId={loan.id} status={loan.status} userEmail={loan.user.email ?? ""} bookTitle={loan.book.title} currentDueDate={loan.dueDate.toISOString()} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
