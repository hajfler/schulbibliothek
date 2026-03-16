import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { getDaysUntilDue } from "@/lib/utils";

export async function POST() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);

  // Staff only see their own school's reminders
  const schoolFilter =
    session.user.role === "ADMIN"
      ? {}
      : { loan: { book: { schoolId: session.user.schoolId ?? undefined } } };

  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: windowEnd },
      loan: { status: { in: ["ACTIVE", "OVERDUE"] } },
      ...schoolFilter,
    },
    include: {
      loan: {
        include: {
          book: { select: { title: true, author: true, school: { select: { name: true } } } },
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    const { loan } = reminder;
    if (!loan.user.email) continue;
    try {
      await sendReminderEmail({
        to: loan.user.email,
        userName: loan.user.name ?? loan.user.email,
        bookTitle: loan.book.title,
        bookAuthor: loan.book.author,
        dueDate: loan.dueDate,
        schoolName: loan.book.school.name,
        daysLeft: getDaysUntilDue(loan.dueDate),
      });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED" },
      });
      failed++;
    }
  }

  // Update overdue loans
  await prisma.loan.updateMany({
    where: {
      status: "ACTIVE",
      dueDate: { lt: now },
      ...(session.user.role !== "ADMIN" && session.user.schoolId
        ? { book: { schoolId: session.user.schoolId } }
        : {}),
    },
    data: { status: "OVERDUE" },
  });

  return NextResponse.json({ sent, failed, total: dueReminders.length });
}
