import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { getDaysUntilDue } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function POST() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Staff only see their own school's reminders
  const loanFilter: Prisma.LoanWhereInput =
    session.user.role === "ADMIN" || !session.user.schoolId
      ? { status: { in: ["ACTIVE", "OVERDUE"] } }
      : { status: { in: ["ACTIVE", "OVERDUE"] }, book: { schoolId: session.user.schoolId } };

  // Update overdue loans first
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

  // Find loans with no PENDING reminder at all (e.g. loans created before reminders feature)
  const loansWithoutReminders = await prisma.loan.findMany({
    where: {
      ...loanFilter,
      reminders: { none: {} },
    },
    include: {
      book: { select: { title: true, author: true, school: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      loan: loanFilter,
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

  // Send via existing reminder records
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

  // Send directly for loans that have no reminder records
  for (const loan of loansWithoutReminders) {
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
      await prisma.reminder.create({
        data: {
          loanId: loan.id,
          type: getDaysUntilDue(loan.dueDate) < 0 ? "ONE_DAY_OVERDUE" : "DUE_TODAY",
          scheduledAt: now,
          status: "SENT",
          sentAt: now,
        },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: dueReminders.length + loansWithoutReminders.length });
}
