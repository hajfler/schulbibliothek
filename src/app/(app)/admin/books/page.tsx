import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit2, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminBooksPage() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;

  const books = await prisma.book.findMany({
    where: schoolId ? { schoolId } : {},
    include: {
      _count: {
        select: {
          loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const typeLabels: Record<string, string> = {
    BOOK: "Buch", MAGAZINE: "Zeitschrift", COMIC: "Comic",
    AUDIOBOOK: "Hörbuch", EBOOK: "E-Book", REFERENCE: "Nachschlagewerk", OTHER: "Sonstiges",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Bücher verwalten
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-0.5">{books.length} Bücher</p>
        </div>
        <Link
          href="/admin/books/new"
          className="inline-flex items-center gap-2 bg-[#007AFF] text-white text-[14px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0071E3] transition-colors shadow-sm"
        >
          <Plus size={16} />
          Buch hinzufügen
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F7]">
              {["Buch", "Typ", "Exemplare", "Ausgeliehen", "Hinzugefügt", "Aktionen"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => {
              const available = book.totalCopies - book._count.loans;
              return (
                <tr key={book.id} className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#F9F9FB] transition-colors">
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
                    <Badge variant="gray">{typeLabels[book.typePublication] ?? book.typePublication}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#3A3A3C]">{book.totalCopies}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${available > 0 ? "bg-[#34C759]" : "bg-[#FF3B30]"}`} />
                      <span className="text-[13px] text-[#3A3A3C]">
                        {book._count.loans} / {book.totalCopies}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-[#8E8E93]">{formatDate(book.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
