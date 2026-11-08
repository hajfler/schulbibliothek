/**
 * Änderungsverlauf für die Anzeige in der Anwendung (Versions-Knopf am Fuss
 * der Navigation). Bei einer neuen Version hier oben einen Eintrag ergänzen,
 * APP_VERSION und die Version in package.json anpassen.
 */

export const APP_VERSION = "1.1.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  highlight?: string;
  changes: { title: string; text: string }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.1.0",
    date: "8. November 2026",
    highlight: "Getrennte Bibliotheken pro Trakt, Ausleihkategorien und Benutzer direkt aus Microsoft 365.",
    changes: [
      {
        title: "Mehrere Bibliotheken",
        text: "Das Schulhaus Dorf führt Trakt 1, 2 und 3 als eigene Bibliotheken. Bücher lassen sich einzeln oder gesammelt in eine andere Bibliothek verschieben, Schulhäuser können umbenannt werden.",
      },
      {
        title: "Ausleihkategorien",
        text: "Pro Bibliothek zweistufige Kategorien mit Farbe. Standardsets für Trakt 2 und 3 lassen sich unter Verwaltung → Kategorien laden, in der Bücherübersicht gibt es den passenden Filter.",
      },
      {
        title: "Benutzer aus Microsoft 365",
        text: "Admins importieren die Mitglieder einer Teams- oder Entra-Gruppe und ordnen sie Schulhäusern zu. Rollen lassen sich so schon vor dem ersten Login vergeben.",
      },
      {
        title: "Benutzerverwaltung",
        text: "Filter nach Rolle und Schulhaus, Schulhäuser als anklickbare Chips, Rolle direkt in der Zeile. Rollen- und Schulhauswechsel greifen sofort, ohne neues Anmelden.",
      },
      {
        title: "Erscheinungsbild",
        text: "Dunkles Farbschema (automatisch nach System oder von Hand), Bewegung mit Abbremsung beim Erscheinen, Aufklappen und in Dialogen.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "27. März 2026",
    highlight: "Erste Fassung der Schulbibliothek mit Microsoft-365-Anmeldung.",
    changes: [
      { title: "Ausleihe", text: "Bücher suchen, ausleihen, verlängern, zurückgeben und reservieren, mit Bestätigungs- und Erinnerungsmails." },
      { title: "Verwaltung", text: "Bücher erfassen (auch per ISBN-Scan), Ausleihen und Benutzer verwalten, Statistiken im Dashboard." },
    ],
  },
];
