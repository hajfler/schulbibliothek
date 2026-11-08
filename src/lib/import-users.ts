import { prisma } from "@/lib/db";

export interface ImportEntry {
  email: string;
  name: string | null;
  /** Zeilennummer (CSV) oder Index, nur für Fehlermeldungen */
  row: number;
}

export interface ImportResult {
  created: number;
  /** Bestehende Benutzer, die zusätzliche Schulhaus-Mitgliedschaften erhalten haben */
  updated: number;
  skipped: number;
  errors: { row: number; email: string; message: string }[];
  total: number;
}

/**
 * Legt Benutzer vorab an (ohne verknüpftes M365-Konto) und weist ihnen die
 * angegebenen Schulhäuser zu. Ohne schoolIds gelten alle Schulhäuser.
 * Bestehende Benutzer werden nicht neu angelegt, erhalten aber fehlende
 * Mitgliedschaften dazu (Vereinigung über mehrere Gruppen-Importe).
 * Die Kontoverknüpfung erfolgt beim ersten SSO-Login anhand der E-Mail.
 */
export async function importUsers(entries: ImportEntry[], schoolIds?: string[]): Promise<ImportResult> {
  const schools =
    schoolIds && schoolIds.length > 0
      ? await prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true }, orderBy: { name: "asc" } })
      : await prisma.school.findMany({ select: { id: true }, orderBy: { name: "asc" } });
  const targetIds = schools.map((s) => s.id);

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [], total: entries.length };
  const seen = new Set<string>();

  for (const entry of entries) {
    const email = entry.email.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      result.errors.push({ row: entry.row, email, message: "Keine gültige E-Mail-Adresse" });
      continue;
    }
    if (seen.has(email)) {
      result.skipped++;
      continue;
    }
    seen.add(email);

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, schoolId: true, schoolMemberships: { select: { schoolId: true } } },
    });

    if (existing) {
      const have = new Set(existing.schoolMemberships.map((m) => m.schoolId));
      const missing = targetIds.filter((id) => !have.has(id));
      if (missing.length === 0) {
        result.skipped++;
        continue;
      }
      try {
        await prisma.userSchool.createMany({
          data: missing.map((schoolId) => ({ userId: existing.id, schoolId })),
          skipDuplicates: true,
        });
        if (!existing.schoolId) {
          await prisma.user.update({ where: { id: existing.id }, data: { schoolId: targetIds[0] ?? null } });
        }
        result.updated++;
      } catch {
        result.errors.push({ row: entry.row, email, message: "Fehler beim Zuweisen der Schulhäuser" });
      }
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          email,
          name: entry.name?.trim() || null,
          role: "USER",
          schoolId: targetIds[0] ?? null,
          schoolMemberships: {
            create: targetIds.map((schoolId) => ({ schoolId })),
          },
        },
      });
      result.created++;
    } catch {
      result.errors.push({ row: entry.row, email, message: "Fehler beim Erstellen" });
    }
  }

  return result;
}
