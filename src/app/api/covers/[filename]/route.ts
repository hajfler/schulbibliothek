import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";

function getUploadsDir() {
  return process.env.COVER_UPLOAD_DIR ?? (process.env.NODE_ENV === "production"
    ? "/tmp/covers"
    : join(process.cwd(), "public", "covers"));
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filepath = join(getUploadsDir(), filename);

  if (!existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const bytes = await readFile(filepath);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
