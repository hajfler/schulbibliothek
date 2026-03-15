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
  const { userId, role, schoolId, schoolIds } = body;

  // Librarians can only manage users in their school
  if (session.user.role === "LIBRARIAN") {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });
    if (targetUser?.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Update role and/or active school
  if (role || schoolId !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role: role as Role }),
        ...(schoolId !== undefined && { schoolId: schoolId || null }),
      },
    });
  }

  // Replace school memberships if schoolIds array provided (admin only)
  if (Array.isArray(schoolIds) && session.user.role === "ADMIN") {
    await prisma.userSchool.deleteMany({ where: { userId } });
    if (schoolIds.length > 0) {
      await prisma.userSchool.createMany({
        data: schoolIds.map((sid: string) => ({ userId, schoolId: sid })),
        skipDuplicates: true,
      });
    }
    // If active school is no longer in memberships, reset to first member school
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } });
    if (user?.schoolId && !schoolIds.includes(user.schoolId)) {
      await prisma.user.update({
        where: { id: userId },
        data: { schoolId: schoolIds[0] ?? null },
      });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { schoolMemberships: { select: { schoolId: true } } },
  });
  return NextResponse.json(updated);
}
