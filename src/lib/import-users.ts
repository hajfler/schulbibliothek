import { prisma } from "@/lib/db";

export interface ImportEntry {
  email: string;
  name: string | null;
  /** Zeilennummer (CSV) oder Index, nur für Fehlermeldungen */
  row: number;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; email: string; message: string }[];
  total: number;
}

/**
 * Legt Benutzer vorab an (ohne verknüpftes M365-Konto). Bestehende E-Mail-Adressen
 * werden übersprungen. Alle Schulhäuser werden als Mitgliedschaft eingetragen,
 * das erste alphabetisch als aktives. Verknüpfung erfolgt beim ersten SSO-Login.
 */
export async function importUsers(entries: ImportEntry[]): Promise<ImportResult> {
  const allSchools = await prisma.school.findMany({
    select: { id: true },
    orderBy: { name: "asc" },
  });

  const result: ImportResult = { created: 0, skipped: 0, errors: [], total: entries.length };
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

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      result.skipped++;
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          email,
          name: entry.name?.trim() || null,
          role: "USER",
          schoolId: allSchools[0]?.id ?? null,
          schoolMemberships: {
            create: allSchools.map((s) => ({ schoolId: s.id })),
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
