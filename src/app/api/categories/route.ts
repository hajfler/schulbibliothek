import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCategoryTree } from "@/lib/categories";

/** GET /api/categories?schoolId=… – Kategorienbaum eines Schulhauses (alle angemeldeten Benutzer). */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolId = req.nextUrl.searchParams.get("schoolId") ?? session.user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "No school assigned" }, { status: 400 });
  }

  const tree = await getCategoryTree(schoolId);
  return NextResponse.json(tree);
}

/** POST /api/categories – neue Haupt- oder Unterkategorie (Bibliothekar/Admin). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const schoolId = typeof body.schoolId === "string" ? body.schoolId : null;
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  const color = typeof body.color === "string" && body.color ? body.color : null;

  if (!name || !schoolId) {
    return NextResponse.json({ error: "Name and schoolId required" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.schoolId !== schoolId) {
      return NextResponse.json({ error: "Invalid parent category" }, { status: 400 });
    }
    if (parent.parentId) {
      return NextResponse.json({ error: "Only two levels are supported" }, { status: 400 });
    }
  }

  const last = await prisma.category.findFirst({
    where: { schoolId, parentId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name,
      color: parentId ? null : color,
      schoolId,
      parentId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
