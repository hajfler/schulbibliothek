import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  // Check book exists and is actually unavailable
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      _count: { select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } } },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (book._count.loans < book.totalCopies) {
    return NextResponse.json({ error: "Book is available — borrow it directly" }, { status: 409 });
  }

  // Check user doesn't already have an active loan for this book
  const existingLoan = await prisma.loan.findFirst({
    where: { bookId, userId: session.user.id, status: { in: ["ACTIVE", "OVERDUE"] } },
  });
  if (existingLoan) {
    return NextResponse.json({ error: "You already have this book" }, { status: 409 });
  }

  const reservation = await prisma.reservation.create({
    data: { bookId, userId: session.user.id },
  });

  return NextResponse.json(reservation, { status: 201 });
}
