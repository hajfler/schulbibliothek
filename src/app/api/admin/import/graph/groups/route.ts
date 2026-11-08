import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchGroups, describeGraphError } from "@/lib/graph";

/** GET /api/admin/import/graph/groups?search=… – Entra-Gruppen suchen (Admin). */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") ?? "";
  try {
    const groups = await searchGroups(search);
    return NextResponse.json(groups);
  } catch (err) {
    const { status, message, hint } = describeGraphError(err);
    return NextResponse.json({ error: message, hint }, { status });
  }
}
