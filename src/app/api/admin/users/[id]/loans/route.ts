import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const loans = await prisma.loan.findMany({
    where: {
      userId: id,
      status: { in: ["ACTIVE", "OVERDUE"] },
    },
    include: {
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(loans);
}
