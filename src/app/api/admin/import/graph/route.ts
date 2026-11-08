import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroupUserMembers, describeGraphError } from "@/lib/graph";
import { importUsers } from "@/lib/import-users";

/**
 * POST /api/admin/import/graph { groupId, schoolIds: string[], preview?: boolean }
 * Mitglieder einer Entra-/Teams-Gruppe aus Microsoft 365 importieren und den
 * angegebenen Schulhäusern zuweisen (Admin). Bestehende Benutzer erhalten
 * fehlende Mitgliedschaften dazu. Mit preview=true nur auflisten.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { groupId, schoolIds, preview } = await req.json();
  if (typeof groupId !== "string" || !groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }
  const requestedSchoolIds: string[] = Array.isArray(schoolIds)
    ? schoolIds.filter((s: unknown): s is string => typeof s === "string")
    : [];
  if (requestedSchoolIds.length === 0) {
    return NextResponse.json({ error: "Mindestens ein Schulhaus wählen" }, { status: 400 });
  }
  const schools = await prisma.school.findMany({
    where: { id: { in: requestedSchoolIds } },
    select: { id: true },
  });
  if (schools.length !== requestedSchoolIds.length) {
    return NextResponse.json({ error: "Unbekanntes Schulhaus" }, { status: 400 });
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
      email: (m.mail ?? m.userPrincipalName ?? "").toLowerCase().trim(),
      name: m.displayName,
      row: i + 1,
    }))
    .filter((m) => m.email.includes("@"));

  if (preview) {
    const existing = await prisma.user.findMany({
      where: { email: { in: candidates.map((c) => c.email) } },
      select: { email: true, schoolMemberships: { select: { schoolId: true } } },
    });
    const byEmail = new Map(existing.map((e) => [e.email?.toLowerCase(), e.schoolMemberships.map((m) => m.schoolId)]));
    return NextResponse.json({
      total: members.length,
      disabled: members.filter((m) => m.accountEnabled === false).length,
      members: candidates.map((c) => {
        const have = byEmail.get(c.email);
        const missing = have ? requestedSchoolIds.filter((id) => !have.includes(id)).length : requestedSchoolIds.length;
        return { email: c.email, name: c.name, exists: have !== undefined, missingSchools: missing };
      }),
    });
  }

  const result = await importUsers(candidates, requestedSchoolIds);
  return NextResponse.json(result);
}
