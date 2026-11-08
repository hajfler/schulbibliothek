# Übergabe schulbibliothek, Stand 2026-11-08 09:13

## Auftrag
Schulbibliothek: zwei bzw. drei Bibliotheken Schulhaus Dorf Trakt 1/2/3 plus Ausleihkategorien (Seraina); Lehrpersonen aus M365 nach Teams-Gruppen mit Schulhaus-Zuordnung importieren, Elias Reich (Zivi) als Bibliothekar (Sandra).

## Erledigt
- Code: Category-Modell, Standardkategorien, /admin/categories, Kategoriefilter, Sammel-Verschieben, Schulhaus bearbeiten, /admin/import (Graph-Gruppen mit Schulhaus-Zuordnung + CSV), Kontoverknüpfung beim ersten Login; Lint-Fixes, Pipeline wieder grün bis Image
- Deploy manuell per Redeploy in Coolify (webserver.schule-dietlikon.ch, SSH root@85.195.227.178, App nwwkw4s0og8ks448s444oo4k, Dockerfile aus GitHub main)
- Entra-App «Bibliothek» (ffdf4296-…): GroupMember.Read.All + User.ReadBasic.All mit Admin-Einwilligung (Richard); Container-Restart wegen Token-Cache
- Produktiv: Schulhaus Dorf → Trakt 1 (4 Bücher), Trakt 2 und 3 neu, Kategoriensets Trakt 2 (12/39) und Trakt 3 (9) geladen
- Import: Lehrperson Dorf → Trakt 1–3 (43 neu), Fadacher → Fadacher (39 neu, 3 ergänzt), Sek Hueenerweid → Hüenerweid (34 neu), Zivi Dorf → Trakt 1–3 (2 neu)
- Elias Reich Rolle Bibliothekar, aktives Schulhaus Trakt 1
- Doku: UEBERGABE_2026-11-08_trakte-kategorien.md mit Abschluss, alles auf main gepusht

## Offen
- GitHub-Secrets COOLIFY_WEBHOOK_URL/COOLIFY_TOKEN sind leer (gh secret set via !-Präfix) → Richard setzt sie in Terminal.app neu, sonst Deploy manuell in Coolify
- Seraina: 4 Bücher in Trakt 1 per Sammel-Verschieben zuteilen, Kategorien vergeben; Trakt 1 ohne Standard-Kategorienset
- Sandra/Seraina informieren (Elias kann sich anmelden)
- Optional: git remote set-url origin https://github.com/hajfler/schulbibliothek.git (Token aus Remote-URL entfernen); Push klappt mit gh-Credential-Helper auf explizite URL
- Neue SSO-Benutzer ohne Vorab-Import erhalten weiterhin alle Schulhäuser (createUser-Event)

## Nächster Schritt
Richard informiert Sandra und Seraina; bei Bedarf Coolify-Secrets im Terminal setzen, damit Pushes wieder automatisch deployen.

## Wartet auf
Seraina: Buchzuteilung zu den Trakten

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
