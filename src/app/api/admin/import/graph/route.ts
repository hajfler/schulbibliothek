import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroupUserMembers, describeGraphError } from "@/lib/graph";
import { importUsers } from "@/lib/import-users";

/**
 * POST /api/admin/import/graph { groupId, preview?: boolean }
 * Mitglieder einer Entra-Gruppe direkt aus Microsoft 365 importieren (Admin).
 * Mit preview=true werden die Mitglieder nur aufgelistet (inkl. Markierung, wer schon existiert).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { groupId, preview } = await req.json();
  if (typeof groupId !== "string" || !groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }

  let members;
  try {
    members = await getGroupUserMembers(groupId);
  } catch (err) {
    const { status, message, hint } = describeGraphError(err);
    return NextResponse.json({ error: message, hint }, { status });
  }

  // Deaktivierte Konten und Mitglieder ohne Adresse auslassen
  const candidates = members
    .filter((m) => m.accountEnabled !== false)
    .map((m, i) => ({
      email: (m.mail ?? m.userPrincipalName).toLowerCase().trim(),
      name: m.displayName,
      row: i + 1,
    }))
    .filter((m) => m.email.includes("@"));

  if (preview) {
    const emails = candidates.map((c) => c.email);
    const existing = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((e) => e.email?.toLowerCase()));
    return NextResponse.json({
      total: members.length,
      disabled: members.filter((m) => m.accountEnabled === false).length,
      members: candidates.map((c) => ({ email: c.email, name: c.name, exists: existingSet.has(c.email) })),
    });
  }

  const result = await importUsers(candidates);
  return NextResponse.json(result);
}
