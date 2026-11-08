# Übergabe schulbibliothek, Stand 2026-11-08 08:06

## Auftrag
Schulbibliothek: Aufteilung in zwei Bibliotheken «Schulhaus Dorf Trakt 2» und «Trakt 3» (Wunsch Seraina) plus Ausleihkategorien aus Lehrerbibliothek-Unterkategorien.docx; Zivi Elias Reich braucht Rechte zum Einscannen (Sandra).

## Erledigt
- Prisma-Modell Category (zweistufig, pro School) und Book.categoryId ergänzt, Client generiert
- Standardkategorien Trakt 2/3 in src/lib/default-categories.ts, Import-API /api/categories/import
- Admin-Seite /admin/categories mit Baum, Anlegen/Umbenennen/Farbe/Löschen und «Standardkategorien laden»
- Buchformular mit Kategorie/Unterkategorie und Schulhaus-Wechsel (Admin), Kategoriefilter in /books, Kategorie auf Karte/Detail/Admin-Tabelle
- Sammel-Verschieben von Büchern zwischen Bibliotheken (/api/books/bulk-move, Checkboxen in Bücher verwalten)
- Schulhaus bearbeiten (PATCH /api/admin/schools/[id]) im SchoolManager
- tsc und next build erfolgreich, README und UEBERGABE_2026-11-08_trakte-kategorien.md geschrieben

## Offen
- Nicht committet/gepusht; Deploy via Coolify, Entrypoint macht prisma db push
- package.json/package-lock: typescript auf 5.9.3 gepinnt war schon vorher uncommittet
- Welche bestehenden Bücher zu welchem Trakt gehören ist unbekannt → Seraina verschiebt sie per Sammelfunktion
- Elias Reich: Rolle Bibliothekar erst nach seiner ersten Anmeldung setzbar (Admin → Benutzer)
- 4 bestehende Lint-Fehler in admin/page.tsx und isbn-scanner.tsx (nicht Teil dieser Änderung)

## Nächster Schritt
Commit + Push, dann als Admin «Schulhaus Dorf» umbenennen, zweiten Trakt anlegen und pro Trakt Standardkategorien laden.

## Wartet auf
Seraina: Zuteilung bestehender Bücher zu Trakt 2/3 (kann sie selbst per Sammel-Verschieben erledigen)

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
