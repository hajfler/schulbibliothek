# Übergabe schulbibliothek, Stand 2026-11-08 08:21

## Auftrag
Schulbibliothek: zwei Bibliotheken Schulhaus Dorf Trakt 2/3 plus Ausleihkategorien (Seraina); Lehrpersonen vorab aus M365 importieren mit Schulhaus-Zuordnung nach Teams-Gruppen, damit Elias Reich (Zivi) sofort Bibliothekar werden kann (Sandra).

## Erledigt
- Commit 4a9acef: Category-Modell, Standardkategorien Trakt 2/3, /admin/categories, Kategoriefilter, Sammel-Verschieben, Schulhaus bearbeiten
- Commit 2fac9b6: /admin/import mit Graph-Gruppenimport und CSV, allowDangerousEmailAccountLinking, linkAccount-Event
- Commit ad4d93b: Gruppen-Import mit Schulhaus-Zuordnung (Vereinigung bei mehreren Gruppen), alles auf main gepusht
- Push: Remote-URL hatte abgelaufenen Token, Push klappt mit gh-Credential-Helper auf explizite URL
- Entra: App bibliothek.schule-dietlikon.ch (42133daf-b974-437a-8bf9-a4b2183b1ce0) gefunden, Dialog «API-Berechtigungen anfordern» mit Suche GroupMember.Read.All geöffnet; Anhaken vom Auto-Modus blockiert
- Kontakte Seraina, Sandra, Elias Reich gespeichert; UEBERGABE_2026-11-08_trakte-kategorien.md mit Nachtrag

## Offen
- Richard: in Entra GroupMember.Read.All (Anwendungsberechtigung) anhaken → Berechtigungen hinzufügen → Administratorzustimmung für Schule Dietlikon erteilen
- Richard: nach Deploy /admin/import → Teams-Gruppen suchen, Schulhäuser zuordnen (Schulhaus Dorf → Trakt 2 und 3), importieren; dann Elias Reich Rolle Bibliothekar
- Richard: Schulhaus Dorf umbenennen, zweiten Trakt anlegen, Standardkategorien laden
- Seraina: bestehende Bücher per Sammel-Verschieben den Trakten zuteilen
- Optional: git remote set-url origin https://github.com/hajfler/schulbibliothek.git (Token aus URL entfernen)
- Neue SSO-Benutzer ohne Vorab-Import erhalten weiterhin alle Schulhäuser (createUser)

## Nächster Schritt
Richard erteilt GroupMember.Read.All im offenen Entra-Dialog, dann Import unter Verwaltung → Benutzer importieren testen.

## Wartet auf
Richard: Entra-Berechtigung; Seraina: Buchzuteilung zu Trakten

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
