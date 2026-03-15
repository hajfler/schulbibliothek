import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await req.json();

  // Verify user is a member of that school
  const membership = await prisma.userSchool.findUnique({
    where: { userId_schoolId: { userId: session.user.id, schoolId } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this school" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { schoolId },
  });

  return NextResponse.json({ success: true });
}
