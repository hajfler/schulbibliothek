import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookCard } from "@/components/books/book-card";
import { BooksFilter } from "@/components/books/books-filter";
import { SchoolSwitcher } from "@/components/books/school-switcher";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    available?: string;
    school?: string;
  }>;
}

export default async function BooksPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) return null;

  const { search = "", type, available, school } = await searchParams;
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user.role);

  // Fetch user school memberships for the switcher (non-staff only)
  const userMemberships = !isStaff
    ? await prisma.userSchool.findMany({
        where: { userId: session.user.id },
        include: { school: { select: { id: true, name: true } } },
        orderBy: { school: { name: "asc" } },
      })
    : [];

  const userSchools = userMemberships.map((m) => m.school);

  // Admins/Librarians see all schools; regular users only their active school
  const schoolFilter = isStaff
    ? (school ? { schoolId: school } : {})
    : (session.user.schoolId ? { schoolId: session.user.schoolId } : {});

  const schools = isStaff
    ? await prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const where = {
    ...schoolFilter,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { author: { contains: search, mode: "insensitive" as const } },
        { isbn: { contains: search, mode: "insensitive" as const } },
        { series: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(type && { typePublication: type as "BOOK" }),
  };

  const books = await prisma.book.findMany({
    where,
    include: {
      _count: {
        select: {
          loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } },
        },
      },
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: { user: { select: { name: true, email: true } } },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const booksWithAvailability = books
    .map((book) => ({
      ...book,
      availableCopies: book.totalCopies - book._count.loans,
      isAvailable: book.totalCopies - book._count.loans > 0,
    }))
    .filter((book) => {
      if (available === "true") return book.isAvailable;
      if (available === "false") return !book.isAvailable;
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Bücher
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-0.5">
            {booksWithAvailability.length} Bücher gefunden
          </p>
        </div>
        {isStaff && (
          <Link
            href="/admin/books/new"
            className="inline-flex items-center gap-2 bg-[#007AFF] text-white text-[14px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0071E3] transition-colors shadow-sm active:scale-[0.97]"
          >
            <Plus size={16} />
            Buch hinzufügen
          </Link>
        )}
      </div>

      {/* School switcher for users with multiple schools */}
      {!isStaff && userSchools.length > 1 && (
        <SchoolSwitcher schools={userSchools} activeSchoolId={session.user.schoolId ?? null} />
      )}

      {/* Filter */}
      <BooksFilter schools={schools} />

      {/* Grid */}
      {booksWithAvailability.length === 0 ? (
        <div className="card text-center py-20">
          <BookOpen size={48} className="text-[#C7C7CC] mx-auto mb-4" />
          <h3 className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
            Keine Bücher gefunden
          </h3>
          <p className="text-[14px] text-[#8E8E93]">
            {search
              ? `Keine Bücher für "${search}" gefunden`
              : "Es sind noch keine Bücher in der Bibliothek"}
          </p>
          {isStaff && !search && (
            <Link
              href="/admin/books/new"
              className="inline-flex items-center gap-2 mt-5 bg-[#007AFF] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0071E3] transition-colors"
            >
              <Plus size={16} />
              Erstes Buch hinzufügen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {booksWithAvailability.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isStaff={isStaff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
