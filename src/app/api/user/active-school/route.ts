import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const schoolId = body?.schoolId;
  if (typeof schoolId !== "string" || !schoolId) {
    return NextResponse.json({ error: "schoolId required" }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Admins sehen im Umschalter alle Schulhäuser und dürfen in jedes wechseln,
  // alle anderen nur in Schulhäuser, denen sie zugeteilt sind.
  if (session.user.role !== "ADMIN") {
    const membership = await prisma.userSchool.findUnique({
      where: { userId_schoolId: { userId: session.user.id, schoolId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this school" }, { status: 403 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { schoolId },
  });

  return NextResponse.json({ success: true });
}
