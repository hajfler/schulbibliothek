/**
 * Standard-Ausleihkategorien der Lehrerbibliotheken Schulhaus Dorf.
 * Quelle: «Lehrerbibliothek-Unterkategorien.docx» (Seraina, November 2026).
 *
 * Werden über /api/categories/import in ein Schulhaus (Trakt) geladen.
 * Farben entsprechen den Farbmarkierungen im Dokument (Magenta, Violett, ...).
 */

export interface DefaultCategory {
  name: string;
  color?: string;
  children?: string[];
}

export interface DefaultCategorySet {
  key: string;
  label: string;
  description: string;
  categories: DefaultCategory[];
}

const MAGENTA = "#FF2D55";
const VIOLETT = "#AF52DE";
const BLAU = "#007AFF";
const GRUEN = "#34C759";
const ROT = "#FF3B30";
const GELB = "#FFCC00";

export const DEFAULT_CATEGORY_SETS: DefaultCategorySet[] = [
  {
    key: "dorf-trakt-2",
    label: "Schulhaus Dorf Trakt 2 – Ordnung",
    description: "Fachkategorien mit Unterkategorien (Deutsch, Mathematik, Didaktik usw.)",
    categories: [
      {
        name: "Deutsch",
        color: MAGENTA,
        children: ["Sprechen", "Hören", "Grammatik", "Schreiben", "Rechtschreibung", "Lesen", "Lehrmittel", "Verschiedenes"],
      },
      { name: "Englisch", color: VIOLETT, children: ["Lehrmittel", "Verschiedenes"] },
      {
        name: "Mathematik",
        color: BLAU,
        children: ["Grundlagen", "Kopfrechnen", "Geometrie", "Grössen & Bruchrechnen", "Lehrmittel", "Verschiedenes"],
      },
      { name: "Musik", color: GRUEN, children: ["Lehrmittel", "Verschiedenes"] },
      { name: "Religion & Kultur", color: GRUEN, children: ["Inhalte und Materialien"] },
      { name: "Sport", color: ROT, children: ["Lehrmittel", "Verschiedenes"] },
      { name: "Geschichte", children: ["Völker", "Märchen", "Weihnachten", "Verschiedenes"] },
      { name: "Geografie", children: ["Pflanzen", "Tiere", "Sonnensystem", "Wetter", "Nachschlagwerke"] },
      { name: "Natur & Technik", children: ["Elemente", "Gesundheit & Ernährung"] },
      { name: "Soziales", children: ["Zusammenleben / Klassengemeinschaft", "Verschiedenes"] },
      { name: "Zeichnen / Bildnerisches Gestalten", children: ["Lehrmittel", "Verschiedenes"] },
      { name: "Didaktik", color: GELB, children: ["Pädagogik", "Gute Schule", "Diverses"] },
    ],
  },
  {
    key: "dorf-trakt-3",
    label: "Schulhaus Dorf Trakt 3 – Ordnung",
    description: "Einstufige Kategorien (Pädagogik/Fachbücher, Themenmappen, Bilderbücher, Spiele usw.)",
    categories: [
      { name: "Pädagogik/Fachbücher" },
      { name: "Mathematik" },
      { name: "Sprache/Deutsch" },
      { name: "Bewegung/Sport" },
      { name: "Musik" },
      { name: "Werkstatt" },
      { name: "Themenmappen" },
      { name: "Bilderbücher" },
      { name: "Spiele" },
    ],
  },
];

/** Farbpalette für die Kategorienverwaltung (gleiche Reihenfolge wie im Dokument). */
export const CATEGORY_COLORS = [
  MAGENTA, VIOLETT, BLAU, GRUEN, ROT, GELB, "#FF9500", "#5AC8FA", "#A2845E", "#8E8E93",
];
