import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lookupISBN } from "@/lib/isbn";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isbn = req.nextUrl.searchParams.get("isbn");
  if (!isbn) {
    return NextResponse.json({ error: "ISBN required" }, { status: 400 });
  }

  const data = await lookupISBN(isbn);
  if (!data) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
