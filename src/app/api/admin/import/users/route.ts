import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importUsers } from "@/lib/import-users";

/** Einfache CSV-Zeile parsen: Komma oder Semikolon als Trenner, Anführungszeichen beachten. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim().replace(/^"|"$/g, "") ?? ""]));
  });
}

/**
 * POST /api/admin/import/users – Benutzer aus einem M365-CSV-Export anlegen (Admin).
 * Unterstützt die Spalten des Microsoft 365 Admin Centers (englisch und deutsch) sowie
 * des Entra-Gruppenmitglieder-Exports. Bestehende Adressen werden übersprungen.
 * Die Konten werden beim ersten SSO-Login anhand der E-Mail verknüpft.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Keine CSV-Datei hochgeladen" }, { status: 400 });
  }

  const rows = parseCSV(await file.text());
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV leer oder ungültiges Format" }, { status: 400 });
  }

  const entries = rows.map((row, i) => ({
    email: (
      row["user principal name"] ||
      row["userprincipalname"] ||
      row["benutzerprinzipalname"] ||
      row["email"] ||
      row["e-mail"] ||
      row["mail"] ||
      row["e-mail-adresse"] ||
      ""
    ),
    name: (
      row["display name"] ||
      row["displayname"] ||
      row["anzeigename"] ||
      row["name"] ||
      null
    ),
    row: i + 2,
  }));

  const result = await importUsers(entries);
  return NextResponse.json(result);
}
