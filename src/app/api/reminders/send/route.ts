import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { getDaysUntilDue } from "@/lib/utils";

// This endpoint is called by a cron job (e.g. Coolify scheduled task)
// Protect with a secret token
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // next hour

  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: windowEnd },
      loan: {
        status: { in: ["ACTIVE", "OVERDUE"] },
      },
    },
    include: {
      loan: {
        include: {
          book: {
            select: {
              title: true,
              author: true,
              school: { select: { name: true } },
            },
          },
          user: {
            select: { name: true, email: true },
          },
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
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED" },
      });
      failed++;
    }
  }

  // Also update overdue loans
  await prisma.loan.updateMany({
    where: {
      status: "ACTIVE",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  return NextResponse.json({ sent, failed, total: dueReminders.length });
}
