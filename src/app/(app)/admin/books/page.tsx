import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCategoryPath } from "@/lib/categories";
import { AdminBooksTable, type AdminBookRow } from "@/components/admin/admin-books-table";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminBooksPage() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Admins sehen alle Bibliotheken, Bibliothekare die Schulhäuser, denen sie zugeteilt sind
  const schools = isAdmin
    ? await prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : await prisma.school.findMany({
        where: { userMemberships: { some: { userId: session.user.id } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });

  const books = await prisma.book.findMany({
    where: isAdmin ? {} : { schoolId: { in: schools.map((s) => s.id) } },
    include: {
      school: { select: { name: true } },
      category: { select: { name: true, color: true, parent: { select: { name: true, color: true } } } },
      _count: {
        select: {
          loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: AdminBookRow[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    coverUrl: b.coverUrl,
    typePublication: b.typePublication,
    totalCopies: b.totalCopies,
    activeLoans: b._count.loans,
    createdAt: b.createdAt.toISOString(),
    schoolId: b.schoolId,
    schoolName: b.school.name,
    categoryPath: formatCategoryPath(b.category),
    categoryColor: b.category?.parent?.color ?? b.category?.color ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Bücher verwalten
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-0.5">
            {books.length} Bücher
            {schools.length > 1 && " · Bücher anhaken, um sie in eine andere Bibliothek zu verschieben"}
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="inline-flex items-center gap-2 bg-[#007AFF] text-white text-[14px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0071E3] transition-colors shadow-sm"
        >
          <Plus size={16} />
          Buch hinzufügen
        </Link>
      </div>

      <AdminBooksTable books={rows} schools={schools} isAdmin={isAdmin} />
    </div>
  );
}
