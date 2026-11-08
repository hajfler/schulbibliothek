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

## Nachtrag 08.11.2026 abends – Benutzer-Import aus M365
- Commit 4a9acef (Trakte/Kategorien) und 2fac9b6 (Import) gepusht, Remote-URL
  enthielt einen abgelaufenen Token; Push klappt mit
  `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push https://github.com/hajfler/schulbibliothek.git HEAD:main`
  oder nach `git remote set-url origin https://github.com/hajfler/schulbibliothek.git`.
- `/admin/import` (Admin): Direktimport der Mitglieder einer Teams-/Entra-Gruppe
  via Graph (Client-Credentials) mit Zuordnung zu Schulhäusern; bestehende
  Benutzer erhalten fehlende Schulhäuser dazu (Vereinigung). Alternativ CSV.
- Vorab angelegte Benutzer: `allowDangerousEmailAccountLinking` im Provider,
  `linkAccount`-Event weist Schulhäuser zu, falls noch keine vorhanden.
- Voraussetzung Graph: App «bibliothek.schule-dietlikon.ch»
  (42133daf-b974-437a-8bf9-a4b2183b1ce0) braucht Anwendungsberechtigung
  `GroupMember.Read.All` + Admin-Einwilligung (Dialog im Entra-Portal war offen,
  Klick vom Auto-Modus blockiert → Richard manuell).
- Hinweis: Neue Benutzer, die ohne Vorab-Import per SSO kommen, erhalten
  weiterhin automatisch alle Schulhäuser (createUser-Event).

## Nachtrag 08.11.2026 – Deploy-Pipeline
- GitHub-Action scheiterte seit März am Lint (4 Fehler) → behoben in fde91b5.
- Repo-Secrets COOLIFY_WEBHOOK_URL / COOLIFY_TOKEN fehlten, am 08.11.2026 von
  Richard per `gh secret set` gesetzt.
- Graph-Berechtigung gehört auf App «Bibliothek» (ffdf4296-c516-4fb0-a215-ab0b1bfc44b2),
  nicht auf «bibliothek.schule-dietlikon.ch» (42133daf…). Login-URL zeigt die Client-ID.

## Abschluss 08.11.2026 ca. 09:15 – produktiv eingerichtet
- Deploy: Coolify auf der Webserver-VM der Schule (webserver.schule-dietlikon.ch,
  App nwwkw4s0og8ks448s444oo4k, Build aus GitHub main per Dockerfile), Redeploy manuell.
  GitHub-Action baut das Image, der Webhook-Schritt scheitert an leeren Secrets
  (über das !-Präfix gesetzt). Offen: Secrets in Terminal.app neu setzen.
- Fixes nach dem Live-Test: Mitglieder ohne Adresse überspringen, Gruppen ohne $orderby
  laden und lokal filtern, trustHost in Edge-Auth-Config (Commits baa2475, 157db62).
- Entra-App «Bibliothek» (ffdf4296-…): GroupMember.Read.All + User.ReadBasic.All mit
  Admin-Einwilligung. Die App cached das Graph-Token 1 h → nach neuer Berechtigung
  Container neu starten.
- Eingerichtet: «Schulhaus Dorf» → «Schulhaus Dorf Trakt 1» (4 bestehende Bücher), neu
  Trakt 2 und 3; Kategoriensets Trakt 2 (12 Haupt/39 Unter) und Trakt 3 (9) geladen.
- Import: Lehrperson Dorf → Trakt 1–3 (43 neu, 3 vorhanden), Lehrperson Fadacher →
  Fadacher (39 neu, 3 ergänzt), Lehrperson Sek Hueenerweid → Hüenerweid (34 neu),
  Personengruppe Zivi Dorf → Trakt 1–3 (2 neu, darunter Elias Reich).
- Elias Reich: Rolle Bibliothekar, aktives Schulhaus Trakt 1.
- Offen: Seraina teilt die 4 Bücher in Trakt 1 zu (Sammel-Verschieben) und vergibt
  Kategorien; Trakt 1 hat kein Standard-Kategorienset.
