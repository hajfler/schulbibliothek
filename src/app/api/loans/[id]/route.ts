import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReservationAvailableEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, dueDate, notes, status } = body;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      book: { select: { title: true, author: true, school: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!loan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = loan.userId === session.user.id;
  const isStaff = ["LIBRARIAN", "ADMIN"].includes(session.user.role);

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "return") {
    const updated = await prisma.loan.update({
      where: { id },
      data: { status: "RETURNED", returnedAt: new Date() },
    });

    // Cancel pending reminders
    await prisma.reminder.updateMany({
      where: { loanId: id, status: "PENDING" },
      data: { status: "FAILED" },
    });

    // Notify first reservation holder (if any)
    const firstReservation = await prisma.reservation.findFirst({
      where: { bookId: loan.bookId, notifiedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, author: true, school: { select: { name: true } } } },
      },
    });

    if (firstReservation?.user.email) {
      await prisma.reservation.update({
        where: { id: firstReservation.id },
        data: { notifiedAt: new Date() },
      });
      sendReservationAvailableEmail({
        to: firstReservation.user.email,
        userName: firstReservation.user.name ?? firstReservation.user.email,
        bookTitle: firstReservation.book.title,
        bookAuthor: firstReservation.book.author,
        bookId: loan.bookId,
        schoolName: firstReservation.book.school.name,
      }).catch((err) => console.error("Reservation email failed:", err));
    }

    return NextResponse.json(updated);
  }

  if (action === "extend" && isStaff) {
    const newDueDate = new Date(dueDate);
    const updated = await prisma.loan.update({
      where: { id },
      data: { dueDate: newDueDate, status: "ACTIVE" },
    });

    await prisma.reminder.deleteMany({
      where: { loanId: id, status: "PENDING" },
    });

    return NextResponse.json(updated);
  }

  if (action === "selfExtend" && isOwner) {
    if (loan.status === "OVERDUE") {
      return NextResponse.json(
        { error: "Überfällige Ausleihen können nicht verlängert werden. Bitte kontaktiere die Bibliothek." },
        { status: 409 }
      );
    }
    if (loan.extensions >= 1) {
      return NextResponse.json(
        { error: "Eine Ausleihe kann nur einmal verlängert werden." },
        { status: 409 }
      );
    }

    const newDueDate = new Date(loan.dueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const updated = await prisma.loan.update({
      where: { id },
      data: { dueDate: newDueDate, extensions: { increment: 1 } },
    });

    // Reset reminders for new due date
    await prisma.reminder.deleteMany({ where: { loanId: id, status: "PENDING" } });
    const now = new Date();
    const reminderDates = [
      { type: "THREE_DAYS_BEFORE" as const, offset: -3 },
      { type: "ONE_DAY_BEFORE" as const, offset: -1 },
      { type: "DUE_TODAY" as const, offset: 0 },
      { type: "ONE_DAY_OVERDUE" as const, offset: 1 },
      { type: "ONE_WEEK_OVERDUE" as const, offset: 7 },
    ].map(({ type, offset }) => {
      const d = new Date(newDueDate);
      d.setDate(d.getDate() + offset);
      d.setUTCHours(6, 0, 0, 0);
      return { type, date: d };
    }).filter((r) => r.date > now);

    if (reminderDates.length > 0) {
      await prisma.reminder.createMany({
        data: reminderDates.map((r) => ({ loanId: id, type: r.type, scheduledAt: r.date })),
      });
    }

    return NextResponse.json(updated);
  }

  if (action === "markLost" && isStaff) {
    const updated = await prisma.loan.update({
      where: { id },
      data: { status: "LOST" },
    });
    return NextResponse.json(updated);
  }

  // Generic status update for staff
  if (status && isStaff) {
    const updated = await prisma.loan.update({
      where: { id },
      data: { status, ...(notes !== undefined && { notes }) },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
