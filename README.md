# Schulbibliothek

Eine moderne, webbasierte Bibliotheksverwaltung für Schulen. Entwickelt mit Next.js, PostgreSQL und Microsoft 365 Single Sign-On.

---

## Inhaltsverzeichnis

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Voraussetzungen](#voraussetzungen)
- [Installation (Entwicklung)](#installation-entwicklung)
- [Deployment (Produktion)](#deployment-produktion)
- [Konfiguration](#konfiguration)
- [Erste Schritte nach der Installation](#erste-schritte-nach-der-installation)
- [Benutzerrollen](#benutzerrollen)
- [Funktionen im Detail](#funktionen-im-detail)
- [API-Referenz](#api-referenz)
- [Cron-Job](#cron-job)

---

## Features

### Für Schülerinnen und Schüler
- **SSO-Login** via Microsoft 365 — kein separates Konto nötig
- **Bücher durchsuchen** mit Suche nach Titel, Autor oder ISBN
- **Buch ausleihen** mit Rückgabedatum und Bestätigungs-E-Mail
- **Ausleihe verlängern** (1× selbstständig, +14 Tage)
- **Buch zurückgeben** mit Rückgabe-Quittung per E-Mail
- **Buch reservieren** wenn alle Exemplare ausgeliehen sind
- **Kalender-Integration**: Rückgabedatum direkt in Outlook, Apple Kalender oder Google Kalender übernehmen
- **Meine Ausleihen**: Übersicht aller aktiven und vergangenen Ausleihen sowie Reservierungen

### Für Bibliothekarinnen und Bibliothekare
- **Verwaltungs-Dashboard** mit Statistiken (Bücher, Benutzer, aktive Ausleihen, Überfällige)
- **Bücherverwaltung**: Buch erfassen, bearbeiten, löschen
- **ISBN-Lookup**: Buchdaten automatisch via OpenLibrary / Google Books ausfüllen
- **Ausleihverwaltung**: Alle Ausleihen einsehen, filtern, verlängern, zurückbuchen, als verloren markieren
- **Benutzerverwaltung**: Benutzer einsehen und Rollen vergeben
- **Erinnerungs-E-Mails**: Manuell auslösen oder automatisch per Cron
- **Meistausgeliehene Bücher**: Statistik der beliebtesten Titel

### Automatische E-Mails

| Ereignis | Inhalt |
|---|---|
| Ausleihe | Bestätigung mit Rückgabedatum + Kalender-Link |
| Verlängerung | Bestätigung mit neuem Rückgabedatum + Kalender-Link |
| Rückgabe | Quittung mit Rückgabedatum |
| Erinnerung | 3 Tage vor, 1 Tag vor, am Fälligkeitstag, 1 Tag und 1 Woche nach Überfälligkeit |
| Reservierung verfügbar | Benachrichtigung wenn ein reserviertes Buch zurückgegeben wird |

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Datenbank | PostgreSQL + Prisma ORM |
| Authentifizierung | NextAuth.js v5 + Microsoft Entra ID (Azure AD) |
| Styling | Tailwind CSS v4 |
| E-Mail | Nodemailer (SMTP) |
| ISBN-Lookup | OpenLibrary API + Google Books API (Fallback) |
| Deployment | Docker + Coolify |
| CI/CD | GitHub Actions |

---

## Voraussetzungen

- **Node.js** 22+
- **PostgreSQL** 15+
- **Microsoft 365 Tenant** mit Azure App-Registrierung (für SSO)
- **SMTP-Zugang** (z.B. Office 365, Exchange)
- Für Produktion: **Docker** + **Coolify** (oder anderer Docker-Host)

---

## Installation (Entwicklung)

### 1. Repository klonen

```bash
git clone https://github.com/dein-org/schulbibliothek.git
cd schulbibliothek
```

### 2. Abhängigkeiten installieren

```bash
npm install --legacy-peer-deps
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Dann `.env` ausfüllen — siehe [Konfiguration](#konfiguration).

### 4. Datenbank einrichten

```bash
npm run db:push
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## Deployment (Produktion)

### Voraussetzungen

- Coolify-Instanz mit Zugriff auf das GitHub-Repository
- PostgreSQL-Datenbank (kann in Coolify als Service gestartet werden)

### Schritt 1 — PostgreSQL in Coolify einrichten

1. Coolify → **New Resource** → **Database** → **PostgreSQL**
2. Zugangsdaten notieren (werden für `DATABASE_URL` benötigt)

### Schritt 2 — App in Coolify deployen

1. Coolify → **New Resource** → **Application** → GitHub-Repository auswählen
2. Build Pack: **Dockerfile**
3. Port: `3000`

### Schritt 3 — Umgebungsvariablen setzen

Alle Variablen aus `.env.example` in Coolify unter **Environment Variables** eintragen.

### Schritt 4 — Cron-Job einrichten

Damit Erinnerungs-E-Mails automatisch versendet werden:

1. Coolify → **Scheduled Tasks** → **New**
2. Schedule: `0 8 * * *` (täglich 08:00)
3. Command:
```bash
curl -s -X POST https://deine-domain.ch/api/reminders/send \
  -H "Authorization: Bearer DEIN_CRON_SECRET"
```

### Schritt 5 — Deployen

Coolify → **Deploy**. Die App führt beim Start automatisch `prisma db push` aus.

---

## Konfiguration

Alle Einstellungen erfolgen über Umgebungsvariablen (`.env` lokal, Coolify-UI in Produktion).

### App

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `NEXTAUTH_URL` | Öffentliche URL der App | `https://bibliothek.meineschule.ch` |
| `NEXTAUTH_SECRET` | Zufälliger Secret (`openssl rand -base64 32`) | |

### Microsoft 365 SSO (Azure AD)

> Azure Portal → App-Registrierungen → Neue Registrierung

| Variable | Beschreibung |
|---|---|
| `AZURE_AD_CLIENT_ID` | Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Certificates & secrets → New client secret |
| `AZURE_AD_TENANT_ID` | Directory (tenant) ID |

**Redirect URI** in Azure eintragen:
```
https://deine-domain.ch/api/auth/callback/microsoft-entra-id
```

### Datenbank

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindungs-URL | `postgresql://postgres:passwort@db:5432/bibliothek` |
| `POSTGRES_USER` | DB-Benutzer | `postgres` |
| `POSTGRES_PASSWORD` | DB-Passwort | |
| `POSTGRES_DB` | Datenbankname | `bibliothek` |

### E-Mail (SMTP)

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `SMTP_HOST` | SMTP-Server | `smtp.office365.com` |
| `SMTP_PORT` | SMTP-Port | `587` |
| `SMTP_SECURE` | TLS (`true`/`false`) | `false` |
| `SMTP_USER` | Absender-E-Mail | `bibliothek@meineschule.ch` |
| `SMTP_PASSWORD` | E-Mail-Passwort oder App-Passwort | |
| `SMTP_FROM` | Absenderadresse (optional, Standard = `SMTP_USER`) | |

### Optionales

| Variable | Beschreibung |
|---|---|
| `CRON_SECRET` | Secret für den Erinnerungs-Cron-Endpoint (`openssl rand -base64 32`) |
| `GOOGLE_BOOKS_API_KEY` | Google Books API Key für ISBN-Lookup (OpenLibrary wird ohne Key als Fallback verwendet) |

---

## Erste Schritte nach der Installation

### 1. Admin-Konto einrichten

Beim ersten Login über Microsoft 365 wird automatisch ein Benutzerkonto angelegt. Die Rolle muss einmalig manuell in der Datenbank gesetzt werden:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'deine@email.ch';
```

### 2. Schule anlegen

Admin → **Schulen** → **Neue Schule**:
- Name
- Adresse (erscheint im Kalender-Eintrag bei Ausleihen)
- Beschreibung (optional)
- Logo-URL (optional)

### 3. Benutzer der Schule zuweisen

Admin → **Benutzer** → Benutzer auswählen → Schule zuweisen + Rolle vergeben.

### 4. Bücher erfassen

Admin → **Bücher** → **Neues Buch**:
- ISBN eingeben → Daten werden automatisch ausgefüllt
- Anzahl Exemplare, Format und weitere Details ergänzen

---

## Benutzerrollen

| Rolle | Beschreibung |
|---|---|
| `USER` | Standardrolle. Kann Bücher suchen, ausleihen, verlängern, zurückgeben und reservieren. |
| `LIBRARIAN` | Verwaltet Bücher, Ausleihen und Benutzer der eigenen Schule. Kann Erinnerungen auslösen. |
| `ADMIN` | Vollzugriff. Verwaltet alle Schulen, Benutzer und Einstellungen. |

Rollen werden von einem Admin unter **Verwaltung → Benutzer** vergeben.

---

## Funktionen im Detail

### Bücher

- **Medientypen**: Buch, Zeitschrift, Zeitung, Comic, Hörbuch, E-Book, Nachschlagewerk, Sonstiges
- **Formate**: Hardcover, Paperback, Taschenbuch, Grossdruck, Sonstiges
- **ISBN-Lookup**: Automatisches Befüllen von Titel, Autor, Verlag, Beschreibung, Cover und Seitenanzahl via OpenLibrary API (Google Books als Fallback)
- **Mehrere Exemplare**: Jedes Buch kann mit einer Anzahl Exemplare erfasst werden
- **Verfügbarkeitsanzeige**: Zeigt an wie viele Exemplare verfügbar sind

### Ausleihen

- Rückgabedatum frei wählbar (muss in der Zukunft liegen)
- Automatische Statusaktualisierung auf `OVERDUE` wenn Fälligkeitsdatum überschritten
- Max. 1 Selbstverlängerung um 14 Tage (nur bei nicht überfälligen Ausleihen)
- Bibliothekarinnen und Bibliothekare können Ausleihen auf beliebiges Datum verlängern
- Status-Fluss: `ACTIVE` → `OVERDUE` → `RETURNED` / `LOST`

### Reservierungen

- Buch reservieren wenn alle Exemplare ausgeliehen sind
- Automatische E-Mail-Benachrichtigung wenn das Buch zurückgegeben wird
- Reservierung kann jederzeit storniert werden

### Kalender-Integration

Beim Klick auf **"Zum Kalender hinzufügen"** in einer Bestätigungs-E-Mail wird eine `.ics`-Datei heruntergeladen:

- Ganztägiger Eintrag am Rückgabedatum
- Ort: Schulname + Adresse
- Erinnerungen: 3 Tage vorher (08:00) und am Ereignistag (08:00)
- Anzeige als "Frei"
- Kompatibel mit Outlook, Apple Kalender, Google Kalender und allen ICS-fähigen Apps

### Erinnerungs-E-Mails

Automatisch geplante Erinnerungen pro Ausleihe:

| Zeitpunkt | Typ |
|---|---|
| 3 Tage vor Fälligkeit | `THREE_DAYS_BEFORE` |
| 1 Tag vor Fälligkeit | `ONE_DAY_BEFORE` |
| Am Fälligkeitstag | `DUE_TODAY` |
| 1 Tag nach Fälligkeit | `ONE_DAY_OVERDUE` |
| 7 Tage nach Fälligkeit | `ONE_WEEK_OVERDUE` |

Erinnerungen können auch manuell über **Verwaltung → "Jetzt senden"** ausgelöst werden.

---

## API-Referenz

### Öffentliche Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/health` | Health-Check für Monitoring |
| `GET` | `/api/loans/[id]/calendar` | ICS-Datei für Kalender-Integration |

### Authentifizierte Endpunkte (Session erforderlich)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/books` | Bücher suchen und auflisten |
| `GET` | `/api/books/[id]` | Buchdetails |
| `GET` | `/api/isbn?isbn=` | ISBN-Lookup |
| `GET` | `/api/loans` | Ausleihen abrufen |
| `POST` | `/api/loans` | Neue Ausleihe erstellen |
| `PATCH` | `/api/loans/[id]` | Ausleihe aktualisieren (`return`, `selfExtend`, `extend`, `markLost`) |
| `GET` | `/api/reservations` | Reservierungen abrufen |
| `POST` | `/api/reservations` | Reservierung erstellen |
| `DELETE` | `/api/reservations/[id]` | Reservierung löschen |

### Staff-Endpunkte (LIBRARIAN / ADMIN)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `POST` | `/api/admin/reminders/trigger` | Alle fälligen Erinnerungen sofort senden |
| `GET` | `/api/admin/stats` | Statistiken |
| `GET/POST` | `/api/admin/users` | Benutzerverwaltung |
| `POST/PUT/DELETE` | `/api/books`, `/api/books/[id]` | Bücherverwaltung |

### Cron-Endpunkt (Bearer Token)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `POST` | `/api/reminders/send` | Fällige Erinnerungen senden (Header: `Authorization: Bearer CRON_SECRET`) |

---

## Cron-Job

Der Cron-Job sendet automatisch Erinnerungs-E-Mails für alle Ausleihen, deren geplanter Erinnerungszeitpunkt erreicht ist.

**Empfohlener Zeitplan**: Täglich um 08:00 Uhr (`0 8 * * *`)

**Aufruf**:
```bash
curl -X POST https://deine-domain.ch/api/reminders/send \
  -H "Authorization: Bearer DEIN_CRON_SECRET"
```

**Antwort**:
```json
{ "sent": 3, "failed": 0, "total": 3 }
```

Der Endpunkt markiert erledigte Erinnerungen als `SENT` und aktualisiert überfällige Ausleihen automatisch auf Status `OVERDUE`.
