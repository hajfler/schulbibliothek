import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** PATCH /api/admin/schools/[id] – Schulhaus/Bibliothek umbenennen oder Angaben ändern (Admin). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: { name?: string; slug?: string; description?: string | null; address?: string | null; color?: string | null } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.slug === "string" && body.slug.trim()) data.slug = body.slug.trim();
  if (body.description !== undefined) data.description = body.description || null;
  if (body.address !== undefined) data.address = body.address || null;
  if (body.color !== undefined) data.color = body.color || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (data.slug) {
    const clash = await prisma.school.findFirst({ where: { slug: data.slug, NOT: { id } }, select: { id: true } });
    if (clash) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  const school = await prisma.school.update({ where: { id }, data });
  return NextResponse.json(school);
}
