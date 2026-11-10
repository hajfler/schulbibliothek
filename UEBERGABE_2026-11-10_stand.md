# Übergabe schulbibliothek, Stand 2026-11-10 19:17

## Auftrag
Schulbibliothek (bibliothek.schule-dietlikon.ch): Trakte 1/2/3 mit Ausleihkategorien, M365-Gruppenimport, UI-Angleichung ans LMI. 10.11.2026: Schulhaus-Wechsel für Admins repariert, Register-Navigation und gleitende Mouseover wie im LMI (v1.2.0).

## Erledigt
- Fix 20248e5: /api/user/active-school lässt Admins in jedes Schulhaus wechseln (vorher 403 ohne Mitgliedschaft, betraf Trakt 2/3)
- Feature 5f1938f (v1.2.0): Seitenleiste mit Registern Ausleihe/Verwaltung/Konto und gleitende Mouseover (src/components/ui/hover-glide.tsx, CSS in globals.css), übernommen aus LMI ad3ad8d/d1c178c/4580bf9
- Deploy 10.11.2026 per Redeploy-Klick in Coolify, Container nwwkw4s0og8ks448s444oo4k-20261110T191441 healthy; enthält auch c92f15b (Dialog per Portal) und de463be (statische Dateien ohne Sitzung)
- Live geprüft: Register vorhanden, hover-glide aktiv, Wechsel Trakt 1 → Trakt 3 → Trakt 1 ohne Fehlermeldung

## Offen
- Noch nicht nachgeprüft: Login-Seite im Darkmode zeigt Logo; Versions-Knopf (jetzt im Register Konto) öffnet «Was ist neu» vor den Karten
- Coolify-App direkt: https://webserver.schule-dietlikon.ch/project/kg0woskww0sgw4kwg0ooc0w8/environment/lgw0wssow80ooo88gcks4088/application/nwwkw4s0og8ks448s444oo4k (Redeploy-Knopf oben rechts)
- Push: git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push https://github.com/hajfler/schulbibliothek.git HEAD:main
- GitHub-Secrets COOLIFY_WEBHOOK_URL/COOLIFY_TOKEN leer → Richard per gh secret set
- package-lock.json steht noch auf Version 1.0.0 (package.json 1.2.0)
- Seraina: 4 Bücher in Trakt 1 zuteilen, Kategorien vergeben; Sandra/Seraina informieren
- LMI: Gruppenimport gemäss ~/Claude/lmi/PROMPT_2026-11-08_m365-gruppenimport.md
- Neue Version: package.json und src/lib/changelog.ts gemeinsam anpassen

## Nächster Schritt
Login-Seite im Darkmode und Dialog «Was ist neu» kurz gegenprüfen; danach Seraina/Sandra informieren.

## Wartet auf
Seraina: Buchzuteilung zu den Trakten

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
