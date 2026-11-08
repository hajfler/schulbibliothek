# Übergabe 08.11.2026 – Trakt 2 / Trakt 3 und Ausleihkategorien

## Auftrag
Seraina (Lehrerbibliothek Schulhaus Dorf) braucht die Aufteilung in zwei separate
Bibliotheken «Schulhaus Dorf Trakt 2» und «Schulhaus Dorf Trakt 3» sowie die
Ausleihkategorien aus `~/Downloads/Lehrerbibliothek-Unterkategorien.docx`.
Sandra fragt, ob der Zivi Elias Reich Admin-Rechte zum Einscannen braucht.

## Umgesetzt (lokal, noch nicht committet/deployt)
- Prisma: neues Modell `Category` (zweistufig, pro School, Farbe, Sortierung),
  `Book.categoryId` (nullable, ON DELETE SET NULL). `prisma db push` beim
  Containerstart legt Tabelle und Spalte an, bestehende Daten bleiben.
- Standardsets in `src/lib/default-categories.ts` (Trakt 2 mit Unterkategorien,
  Trakt 3 einstufig), Import über `POST /api/categories/import`.
- Neue Seite «Verwaltung → Kategorien» (`/admin/categories`): pro Schulhaus
  Baum anzeigen, Haupt-/Unterkategorie anlegen, umbenennen, Farbe, löschen,
  «Standardkategorien laden».
- Buchformular: Schulhaus-Auswahl auch beim Bearbeiten (Admin), Kategorie +
  Unterkategorie abhängig vom Schulhaus.
- Bücherübersicht: Kategoriefilter (Haupt → Unter), Kategorie auf Karte und
  Detailseite; Admin-Tabelle mit Spalten Schulhaus/Kategorie.
- «Bücher verwalten»: Checkboxen + Aktionsleiste «In Bibliothek verschieben»
  (`POST /api/books/bulk-move`), weil unbekannt ist, welche bestehenden Bücher
  zu welchem Trakt gehören.
- Schulhäuser: Bearbeiten-Stift (Name, Slug, Adresse, Farbe) via
  `PATCH /api/admin/schools/[id]`.
- Bibliothekare dürfen jetzt in allen Schulhäusern arbeiten, denen sie
  zugeteilt sind (Neuanlage, Verwaltung, Kategorien).

## Verifikation
`npx tsc --noEmit` ok, `next build` ok. Lint: 4 Fehler bestehen schon vorher
(admin/page.tsx, isbn-scanner.tsx), nicht Teil dieser Änderung. Keine lokale DB,
daher kein Laufzeittest.

## Nächste Schritte (Richard)
1. Commit + Push → Coolify deployt, Entrypoint führt `prisma db push` aus.
2. Als Admin: Schulhäuser → «Schulhaus Dorf» umbenennen in «Schulhaus Dorf
   Trakt 2» (oder 3), zweites Schulhaus anlegen.
3. Kategorien → pro Trakt «Standardkategorien laden» (passendes Set wählen).
4. Elias Reich: erst einmal per M365 anmelden lassen, dann unter Benutzer die
   Rolle «Bibliothekar» setzen (reicht zum Scannen/Erfassen; kein Admin nötig).
   Rolle greift bei der nächsten Anmeldung.
5. Seraina: bestehende Bücher in «Bücher verwalten» anhaken und in den
   richtigen Trakt verschieben, Kategorien beim Bearbeiten zuweisen.
