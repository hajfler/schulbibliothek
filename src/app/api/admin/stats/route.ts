import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = req.nextUrl.searchParams.get("schoolId") ?? session.user.schoolId;

  const schoolFilter = schoolId ? { schoolId } : {};
  const bookSchoolFilter = schoolId ? { book: { schoolId } } : {};

  const [
    totalBooks,
    totalLoans,
    activeLoans,
    overdueLoans,
    totalUsers,
    recentLoans,
    popularBooks,
  ] = await Promise.all([
    prisma.book.count({ where: schoolFilter }),
    prisma.loan.count({ where: bookSchoolFilter }),
    prisma.loan.count({ where: { ...bookSchoolFilter, status: "ACTIVE" } }),
    prisma.loan.count({ where: { ...bookSchoolFilter, status: "OVERDUE" } }),
    prisma.user.count({ where: schoolId ? { schoolId } : {} }),
    prisma.loan.findMany({
      where: bookSchoolFilter,
      include: {
        book: { select: { title: true, author: true, coverUrl: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.book.findMany({
      where: schoolFilter,
      include: {
        _count: { select: { loans: true } },
      },
      orderBy: {
        loans: { _count: "desc" },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    totalBooks,
    totalLoans,
    activeLoans,
    overdueLoans,
    totalUsers,
    recentLoans,
    popularBooks,
  });
}
