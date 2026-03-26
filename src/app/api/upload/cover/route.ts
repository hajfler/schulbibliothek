import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

function getUploadsDir() {
  return process.env.COVER_UPLOAD_DIR ?? (process.env.NODE_ENV === "production"
    ? "/tmp/covers"
    : join(process.cwd(), "public", "covers"));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Keine Datei angegeben" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Nur Bilddateien erlaubt" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Datei zu gross (max. 5 MB)" }, { status: 400 });
  }

  const uploadsDir = getUploadsDir();
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = join(uploadsDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return NextResponse.json({ url: `/api/covers/${filename}` });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filename = req.nextUrl.searchParams.get("filename");

  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Ungültiger Dateiname" }, { status: 400 });
  }

  try {
    await unlink(join(getUploadsDir(), filename));
  } catch {
    // File may not exist — ignore
  }

  return NextResponse.json({ ok: true });
}
