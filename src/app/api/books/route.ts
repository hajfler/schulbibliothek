import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { BookFormat, PublicationType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const schoolId = searchParams.get("schoolId") ?? session.user.schoolId;
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type");
  const available = searchParams.get("available");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  if (!schoolId) {
    return NextResponse.json({ error: "No school assigned" }, { status: 400 });
  }

  const where = {
    schoolId,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { author: { contains: search, mode: "insensitive" as const } },
        { isbn: { contains: search, mode: "insensitive" as const } },
        { series: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(type && { typePublication: type as PublicationType }),
  };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        loans: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  const booksWithAvailability = books.map((book) => ({
    ...book,
    availableCopies: book.totalCopies - book._count.loans,
    isAvailable: book.totalCopies - book._count.loans > 0,
  }));

  const filtered =
    available === "true"
      ? booksWithAvailability.filter((b) => b.isAvailable)
      : available === "false"
      ? booksWithAvailability.filter((b) => !b.isAvailable)
      : booksWithAvailability;

  return NextResponse.json({
    books: filtered,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    isbn, title, author, publishingHouse, series, typePublication,
    publishedDate, pageCount, format, coverUrl, description, language,
    totalCopies, schoolId,
  } = body;

  if (!title || !author) {
    return NextResponse.json({ error: "Title and author required" }, { status: 400 });
  }

  const effectiveSchoolId = schoolId ?? session.user.schoolId;
  if (!effectiveSchoolId) {
    return NextResponse.json({ error: "No school assigned" }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: {
      isbn: isbn || null,
      title,
      author,
      publishingHouse: publishingHouse || null,
      series: series || null,
      typePublication: (typePublication as PublicationType) ?? "BOOK",
      publishedDate: publishedDate || null,
      pageCount: pageCount ? parseInt(pageCount) : null,
      format: (format as BookFormat) ?? "HARDCOVER",
      coverUrl: coverUrl || null,
      description: description || null,
      language: language || "de",
      totalCopies: totalCopies ? parseInt(totalCopies) : 1,
      schoolId: effectiveSchoolId,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
