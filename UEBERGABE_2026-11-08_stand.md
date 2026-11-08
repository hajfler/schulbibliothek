# Übergabe schulbibliothek, Stand 2026-11-08 10:30

## Auftrag
Schulbibliothek (bibliothek.schule-dietlikon.ch): Trakte 1/2/3 mit Ausleihkategorien, Lehrpersonen-Import aus M365-Gruppen mit Schulhaus-Zuordnung, Elias Reich als Bibliothekar; danach UI-Angleichung ans LMI (Bewegungssystem, Benutzerfilter, dichte Benutzertabelle, Darkmode, Versionsanzeige 1.1.0).

## Erledigt
- Produktiv eingerichtet: Schulhaus Dorf Trakt 1 (4 bestehende Bücher), Trakt 2 und 3 neu, Kategoriensets Trakt 2 (12/39) und Trakt 3 (9) geladen
- Import aus Entra-Gruppen: Lehrperson Dorf → Trakt 1–3 (43 neu), Fadacher → Fadacher (39 neu, 3 ergänzt), Sek Hueenerweid → Hüenerweid (34 neu), Zivi Dorf → Trakt 1–3 (2 neu); Elias Reich Rolle Bibliothekar
- Fix: Rolle und aktives Schulhaus werden pro Anfrage aus der DB gelesen (Schulhaus-Wechsel griff vorher nicht)
- UI wie LMI: Bewegungssystem (globals.css Abschnitt Bewegung, MotionProvider), Benutzerfilter Rolle/Schulhaus, dichte Benutzertabelle mit Rollen-Pille und Schulhaus-Chips, Darkmode via next-themes mit CSS-Umlenkung der Hex-Klassen, Seitenleisten-Fuss (Schulhaus-Umschalter, Rollen-Chip, Erscheinungsbild, Versions-Knopf mit Changelog src/lib/changelog.ts), Version 1.1.0
- Deploys per Redeploy in Coolify (webserver.schule-dietlikon.ch, App nwwkw4s0og8ks448s444oo4k), letzter Stand live: 0da2800 (Container 20261108T102450), Sichtkontrolle hell/dunkel ok
- Lint-Fehler behoben, GitHub-Pipeline baut wieder (Image nach ghcr.io), nur Webhook-Schritt scheitert
- Doku: UEBERGABE_2026-11-08_trakte-kategorien.md mit Nachträgen; Prompt für LMI-Gruppenimport in ~/Claude/lmi/PROMPT_2026-11-08_m365-gruppenimport.md; Antwortentwurf an Seraina

## Offen
- Redeploy für Commit c92f15b (Modal per createPortal an document.body, Dialog «Was ist neu» lag hinter Karten): Coolify https://webserver.schule-dietlikon.ch → Projekt Webserver → bibliothek.schule-dietlikon.ch → Redeploy; Auto-Modus blockiert den Klick, Richard klickt oder schreibt «deployen». Danach Versions-Knopf prüfen
- Container-Check per SSH: ssh root@85.195.227.178 'docker ps | grep nwwkw4s0og8ks448s444oo4k'
- Push ins Repo: git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push https://github.com/hajfler/schulbibliothek.git HEAD:main (origin-URL hat abgelaufenen Token)
- GitHub-Secrets COOLIFY_WEBHOOK_URL/COOLIFY_TOKEN sind leer (via !-Präfix gesetzt) → Richard in Terminal.app: gh secret set COOLIFY_WEBHOOK_URL / COOLIFY_TOKEN (Webhook aus Coolify App → Webhooks, Token aus Keys & Tokens)
- Entra-App «Bibliothek» ffdf4296-c516-4fb0-a215-ab0b1bfc44b2 hat GroupMember.Read.All + User.ReadBasic.All; nach neuen Berechtigungen Container neu starten (Graph-Token 1 h gecached)
- Seraina: 4 Bücher in Trakt 1 per Sammel-Verschieben zuteilen, Kategorien vergeben; Trakt 1 ohne Kategorienset
- Sandra und Seraina informieren (Textentwürfe im Chat vom 08.11.2026)
- LMI: Gruppenimport gemäss Prompt-Datei in eigener Session im lmi-Ordner umsetzen
- Bei neuer Version: package.json und src/lib/changelog.ts (APP_VERSION + Eintrag) anpassen

## Nächster Schritt
Redeploy für c92f15b auslösen (Richard klickt in Coolify), dann Dialog «Was ist neu» über den Versions-Knopf in der Seitenleiste prüfen.

## Wartet auf
Richard: Redeploy-Klick; Seraina: Buchzuteilung zu den Trakten

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
