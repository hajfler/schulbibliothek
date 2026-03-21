import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendLoanConfirmationEmail } from "@/lib/email";
import { addDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status");
  const all = searchParams.get("all");

  // Regular users can only see their own loans
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user.role);

  const where = {
    ...(all === "true" && isStaff
      ? schoolId
        ? { book: { schoolId } }
        : {}
      : { userId: session.user.id }),
    ...(userId && isStaff && { userId }),
    ...(status && { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST" }),
  };

  const loans = await prisma.loan.findMany({
    where,
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
          isbn: true,
          school: { select: { name: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  // Auto-update overdue status
  const now = new Date();
  const overdueIds = loans
    .filter((l) => l.status === "ACTIVE" && l.dueDate < now)
    .map((l) => l.id);

  if (overdueIds.length > 0) {
    await prisma.loan.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: "OVERDUE" },
    });
    loans.forEach((l) => {
      if (overdueIds.includes(l.id)) l.status = "OVERDUE";
    });
  }

  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, dueDate, notes } = body;

  if (!bookId || !dueDate) {
    return NextResponse.json({ error: "bookId and dueDate required" }, { status: 400 });
  }

  const due = new Date(dueDate);
  const now = new Date();

  if (due <= now) {
    return NextResponse.json({ error: "Due date must be in the future" }, { status: 400 });
  }

  // Check book availability
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      _count: {
        select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (book._count.loans >= book.totalCopies) {
    return NextResponse.json({ error: "No copies available" }, { status: 409 });
  }

  // Check user doesn't already have this book
  const existingLoan = await prisma.loan.findFirst({
    where: {
      bookId,
      userId: session.user.id,
      status: { in: ["ACTIVE", "OVERDUE"] },
    },
  });

  if (existingLoan) {
    return NextResponse.json(
      { error: "You already have this book borrowed" },
      { status: 409 }
    );
  }

  const loan = await prisma.loan.create({
    data: {
      bookId,
      userId: session.user.id,
      dueDate: due,
      notes: notes || null,
    },
    include: {
      book: { select: { title: true, author: true, school: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  // Schedule reminders
  await scheduleReminders(loan.id, due);

  // Send confirmation email (non-blocking)
  if (loan.user.email) {
    sendLoanConfirmationEmail({
      to: loan.user.email,
      userName: loan.user.name ?? loan.user.email,
      bookTitle: loan.book.title,
      bookAuthor: loan.book.author,
      borrowedAt: loan.borrowedAt,
      dueDate: due,
      schoolName: loan.book.school.name,
    }).catch((err) => console.error("Confirmation email failed:", err));
  }

  return NextResponse.json(loan, { status: 201 });
}

function reminderDate(base: Date, days: number): Date {
  // Normalize to 06:00 UTC so the 08:00 UTC cron (window end 09:00) always catches it
  const d = startOfDay(addDays(base, days));
  d.setUTCHours(6, 0, 0, 0);
  return d;
}

async function scheduleReminders(loanId: string, dueDate: Date) {
  const reminders = [
    { type: "THREE_DAYS_BEFORE" as const, date: reminderDate(dueDate, -3) },
    { type: "ONE_DAY_BEFORE" as const, date: reminderDate(dueDate, -1) },
    { type: "DUE_TODAY" as const, date: reminderDate(dueDate, 0) },
    { type: "ONE_DAY_OVERDUE" as const, date: reminderDate(dueDate, 1) },
    { type: "ONE_WEEK_OVERDUE" as const, date: reminderDate(dueDate, 7) },
  ];

  const now = new Date();
  const futureReminders = reminders.filter((r) => r.date > now);

  await prisma.reminder.createMany({
    data: futureReminders.map((r) => ({
      loanId,
      type: r.type,
      scheduledAt: r.date,
    })),
  });
}
