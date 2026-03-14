import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    include: {
      _count: { select: { users: true, books: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(schools);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, description, address, color } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }

  const school = await prisma.school.create({
    data: { name, slug, description, address, color },
  });

  return NextResponse.json(school, { status: 201 });
}
