import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/books/bulk-move { bookIds: string[], schoolId: string }
 * Verschiebt mehrere Bücher in eine andere Bibliothek (Schulhaus/Trakt).
 * Die Kategorie wird dabei entfernt, da Kategorien pro Bibliothek gelten.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookIds, schoolId } = await req.json();
  if (!Array.isArray(bookIds) || bookIds.length === 0 || typeof schoolId !== "string") {
    return NextResponse.json({ error: "bookIds and schoolId required" }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Bibliothekare dürfen nur in Schulhäuser verschieben, denen sie zugeteilt sind
  if (session.user.role === "LIBRARIAN") {
    const membership = await prisma.userSchool.findUnique({
      where: { userId_schoolId: { userId: session.user.id, schoolId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await prisma.book.updateMany({
    where: { id: { in: bookIds.filter((id: unknown) => typeof id === "string") }, NOT: { schoolId } },
    data: { schoolId, categoryId: null },
  });

  return NextResponse.json({ moved: result.count });
}
