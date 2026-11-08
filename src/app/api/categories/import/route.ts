import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORY_SETS } from "@/lib/default-categories";

/**
 * POST /api/categories/import { schoolId, setKey }
 * Lädt ein Standard-Kategorienset in ein Schulhaus. Bereits vorhandene
 * Kategorien (gleicher Name auf gleicher Ebene) werden übersprungen.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { schoolId, setKey } = await req.json();
  const set = DEFAULT_CATEGORY_SETS.find((s) => s.key === setKey);
  if (!set || typeof schoolId !== "string") {
    return NextResponse.json({ error: "Invalid schoolId or setKey" }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const existing = await prisma.category.findMany({
    where: { schoolId },
    select: { id: true, name: true, parentId: true, sortOrder: true },
  });

  let created = 0;
  let skipped = 0;
  let order = existing.filter((c) => !c.parentId).reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;

  for (const main of set.categories) {
    let parent = existing.find((c) => !c.parentId && c.name === main.name);
    if (!parent) {
      const row = await prisma.category.create({
        data: { name: main.name, color: main.color ?? null, schoolId, parentId: null, sortOrder: order++ },
        select: { id: true, name: true, parentId: true, sortOrder: true },
      });
      existing.push(row);
      parent = row;
      created++;
    } else {
      skipped++;
    }

    const parentId = parent.id;
    let childOrder = existing
      .filter((c) => c.parentId === parentId)
      .reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;

    for (const childName of main.children ?? []) {
      const dup = existing.find((c) => c.parentId === parentId && c.name === childName);
      if (dup) {
        skipped++;
        continue;
      }
      const row = await prisma.category.create({
        data: { name: childName, schoolId, parentId, sortOrder: childOrder++ },
        select: { id: true, name: true, parentId: true, sortOrder: true },
      });
      existing.push(row);
      created++;
    }
  }

  return NextResponse.json({ created, skipped });
}
