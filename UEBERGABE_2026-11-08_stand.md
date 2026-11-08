# Übergabe schulbibliothek, Stand 2026-11-08 10:12

## Auftrag
Schulbibliothek: Trakte 1/2/3 mit Kategorien, Lehrpersonen-Import aus M365-Gruppen mit Schulhaus-Zuordnung, Elias Reich als Bibliothekar; danach Bewegungssystem wie im LMI und Benutzerfilter nach Rolle/Schulhaus.

## Erledigt
- Trakte, Kategorien, Gruppenimport (118 Lehrpersonen + 2 Zivis) produktiv eingerichtet, Elias Reich Bibliothekar
- Fix: Rolle und aktives Schulhaus werden pro Anfrage aus der DB gelesen (Schulhaus-Wechsel griff nicht)
- Bewegungssystem des LMI übernommen (globals.css Abschnitt Bewegung, MotionProvider, Modal/Toast/Sidebar/Banner), Commit 22f2720
- Benutzerverwaltung mit Rollen- und Schulhaus-Filter wie im LMI, Commit c7413ba
- Per Coolify-Redeploy ausgerollt (Container 20261108T101020), Sichtkontrolle per Chrome ok
- Prompt für den Gruppenimport im LMI: ~/Claude/lmi/PROMPT_2026-11-08_m365-gruppenimport.md
- Antwortentwurf an Seraina geliefert

## Offen
- GitHub-Secrets COOLIFY_WEBHOOK_URL/COOLIFY_TOKEN leer → in Terminal.app neu setzen, sonst Redeploy manuell in Coolify (Auto-Modus fragt bei Deploy nach)
- Seraina: 4 Bücher in Trakt 1 zuteilen und Kategorien vergeben; Trakt 1 ohne Kategorienset
- Sandra/Seraina informieren
- Optional: Remote-URL ohne Token setzen
- LMI: Gruppenimport gemäss Prompt-Datei umsetzen (eigene Session im lmi-Ordner)

## Nächster Schritt
Richard informiert Sandra und Seraina; bei Bedarf LMI-Session mit der Prompt-Datei starten.

## Wartet auf
Seraina: Buchzuteilung zu den Trakten

_Geschrieben vom Mod «stand» über das Tool stand_speichern._
