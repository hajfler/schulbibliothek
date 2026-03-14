import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const schoolId = searchParams.get("schoolId") ?? session.user.schoolId;

  const where = session.user.role === "ADMIN" && !schoolId
    ? {}
    : { schoolId: schoolId ?? undefined };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      schoolId: true,
      school: { select: { name: true } },
      _count: { select: { loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } } } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role, schoolId } = body;

  // Librarians can only manage users in their school
  if (session.user.role === "LIBRARIAN") {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });
    if (targetUser?.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Librarians can't promote to ADMIN
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role && { role: role as Role }),
      ...(schoolId !== undefined && { schoolId }),
    },
  });

  return NextResponse.json(updated);
}
