import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { BookFormat, PublicationType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      school: { select: { name: true } },
      loans: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeLoans = book.loans.filter((l) =>
    ["ACTIVE", "OVERDUE"].includes(l.status)
  );

  return NextResponse.json({
    ...book,
    availableCopies: book.totalCopies - activeLoans.length,
    isAvailable: book.totalCopies - activeLoans.length > 0,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const book = await prisma.book.update({
    where: { id },
    data: {
      isbn: body.isbn ?? null,
      title: body.title,
      author: body.author,
      publishingHouse: body.publishingHouse ?? null,
      series: body.series ?? null,
      typePublication: body.typePublication as PublicationType,
      publishedDate: body.publishedDate ?? null,
      pageCount: body.pageCount ? parseInt(body.pageCount) : null,
      format: body.format as BookFormat,
      coverUrl: body.coverUrl ?? null,
      description: body.description ?? null,
      language: body.language ?? "de",
      totalCopies: body.totalCopies ? parseInt(body.totalCopies) : 1,
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const activeLoans = await prisma.loan.count({
    where: { bookId: id, status: { in: ["ACTIVE", "OVERDUE"] } },
  });

  if (activeLoans > 0) {
    return NextResponse.json(
      { error: "Cannot delete book with active loans" },
      { status: 400 }
    );
  }

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
