"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Bewegungssystem für alle Seiten — zentral, damit die einzelnen Seiten
 * nichts davon wissen müssen. Auch nachgeladene Listen werden erfasst.
 *
 * Das Einrollen beim Erscheinen übernimmt CSS selbst (globals.css, Abschnitt
 * «Bewegung») — es läuft schon beim ersten Bild, ohne auf JavaScript zu
 * warten. Hier passiert nur, was CSS nicht kann:
 *
 *  - Elemente ausserhalb des Sichtbereichs zurückhalten und erst beim
 *    Heranscrollen einrollen lassen, je Schub gestaffelt
 *  - Parallax: Karten und Zeilen wandern beim Scrollen leicht versetzt mit,
 *    der Seitenkopf etwas stärker
 *
 * Arbeitsteilung der Eigenschaften: `translate` gehört dem Einrollen und dem
 * Hover, `transform` ausschliesslich dem Parallax (über --py).
 */

const CARD_SELECTOR = '.card,[class*="rounded-2xl"]';
// Enge Listen (Dashboard «Letzte Ausleihen» usw.) — weite Abstände wie
// space-y-6 sind Seitenabschnitte, keine Listen.
const LIST_SELECTOR =
  '[class*="space-y-1"] > *,[class*="space-y-2"] > *,[class*="space-y-3"] > *,[class*="divide-y"] > *';
const ROW_SELECTOR = "tbody > tr";

const MAX_ELEMENTS = 400;     // Schutz vor sehr langen Listen
const MAX_BATCH_INDEX = 10;   // Staffelung je Schub, der gemeinsam ins Bild kommt
const FAILSAFE_MS = 1500;
const OVERSCAN_PX = 240;      // Parallax auch knapp ausserhalb des Sichtbereichs weiterrechnen
const REVEAL_MARGIN_PX = 80;  // Was so nah am Sichtbereich liegt, gilt als sichtbar

type Kind = "card" | "list" | "row";

interface Item {
  el: HTMLElement;
  kind: Kind;
  amplitude: number;
  top: number;      // Oberkante relativ zum Scrollinhalt, ohne eigene Verschiebung
  height: number;
  py: number;       // aktuell gesetzte Parallax-Verschiebung
}

/** Karten wandern spürbar, Zeilen nur dezent — drei «Tiefen» für Karten. */
function amplitudeFor(kind: Kind, index: number): number {
  if (kind === "card") return [10, 14, 18][index % 3];
  return 6;
}

function isExcluded(el: HTMLElement): boolean {
  if (el.closest('[role="dialog"], aside, nav')) return true;
  if (/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return true;
  // Elemente mit eigener Choreografie (Warnmeldung, Seite) bleiben unangetastet
  if (el.dataset.motion && el.dataset.motion !== "card") return true;
  if (el.closest('[data-motion="alert"]')) return true;
  // Schwebende und klebende Elemente (Sammelleiste, Overlays) gehören nicht in den Fluss
  const position = getComputedStyle(el).position;
  if (position === "fixed" || position === "sticky" || position === "absolute") return true;
  // Elemente, die Tailwind bereits über «translate» positioniert
  if (/(^|\s)-?translate-/.test(el.className)) return true;
  return false;
}

function isBigEnough(el: HTMLElement, kind: Kind): boolean {
  const rect = el.getBoundingClientRect();
  const minHeight = kind === "card" ? 44 : 24;
  return rect.width >= 160 && rect.height >= minHeight;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.querySelector("main");
    if (!root) return;

    const items: Item[] = [];
    const tracked = new WeakSet<HTMLElement>();
    let viewportHeight = root.clientHeight;

    // ── Einblenden ────────────────────────────────────────────────────
    const observer = new IntersectionObserver(
      (entries) => {
        // Alles, was gemeinsam ins Bild kommt, rollt von oben nach unten
        // gestaffelt ein — wie beim ersten Bild, nur je Schub neu gezählt.
        const batch = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        batch.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--i", String(Math.min(i, MAX_BATCH_INDEX)));
          el.dataset.reveal = "in";
          observer.unobserve(el);
        });
      },
      { root, rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
    );

    /**
     * Sicherheitsnetz: Was im Bild liegt und trotzdem noch ausgeblendet ist,
     * wird gezeigt — Inhalte dürfen nie unsichtbar hängen bleiben. Was
     * ausserhalb wartet, bleibt zurückgehalten, bis es herangescrollt wird.
     * Läuft in Abständen weiter, solange etwas zurückgehalten ist.
     */
    const isNearView = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      return (
        rect.bottom > rootRect.top - REVEAL_MARGIN_PX &&
        rect.top < rootRect.bottom + REVEAL_MARGIN_PX
      );
    };
    let failsafe = 0;
    const armFailsafe = () => {
      window.clearTimeout(failsafe);
      failsafe = window.setTimeout(() => {
        const pending = root.querySelectorAll<HTMLElement>('[data-reveal="out"]');
        pending.forEach((el) => {
          if (isNearView(el)) el.dataset.reveal = "in";
        });
        if (pending.length > 0) armFailsafe();
      }, FAILSAFE_MS);
    };

    // ── Parallax-Vermessung ───────────────────────────────────────────
    const measure = () => {
      viewportHeight = root.clientHeight;
      const scrollTop = root.scrollTop;
      for (const item of items) {
        const rect = item.el.getBoundingClientRect();
        item.top = rect.top + scrollTop - item.py;
        item.height = rect.height;
      }
    };

    const applyParallax = () => {
      const scrollTop = root.scrollTop;
      const half = viewportHeight / 2;
      for (const item of items) {
        const center = item.top - scrollTop + item.height / 2;
        if (center < -OVERSCAN_PX || center > viewportHeight + OVERSCAN_PX) continue;
        const depth = Math.max(-1.2, Math.min(1.2, (center - half) / half));
        const py = Math.round(depth * item.amplitude * 10) / 10;
        if (Math.abs(py - item.py) < 0.25) continue;
        item.py = py;
        item.el.style.setProperty("--py", `${py}px`);
      }
    };

    const collect = (): Array<[HTMLElement, Kind]> => {
      const seen = new Set<HTMLElement>();
      const out: Array<[HTMLElement, Kind]> = [];
      const add = (selector: string, kind: Kind) => {
        root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          out.push([el, kind]);
        });
      };
      add(CARD_SELECTOR, "card");
      add(LIST_SELECTOR, "list");
      add(ROW_SELECTOR, "row");
      // Dokumentreihenfolge, damit die Staffelung von oben nach unten läuft
      return out.sort((a, b) =>
        a[0].compareDocumentPosition(b[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
    };

    const prepare = () => {
      if (items.length >= MAX_ELEMENTS) return;

      const groups = new Map<Element, number>();
      let added = 0;

      for (const [el, kind] of collect()) {
        if (items.length >= MAX_ELEMENTS) break;
        if (tracked.has(el)) continue;
        if (isExcluded(el)) continue;
        if (!isBigEnough(el, kind)) continue;
        // Verschachtelung: nur die äusserste Karte animieren. Tabellenzeilen
        // liegen immer in einer Karte und sind davon ausgenommen.
        if (kind !== "row" && el.parentElement?.closest("[data-parallax-item]")) continue;
        // Listenzeilen, die selbst Karten enthalten, sind Abschnitte — die
        // Karten darin sollen einzeln laufen.
        if (kind === "list" && el.querySelector(CARD_SELECTOR)) continue;

        const parent = el.parentElement ?? root;
        const index = groups.get(parent) ?? 0;
        groups.set(parent, index + 1);

        /**
         * Was bereits im Bild ist, rollt gerade per CSS ein oder ist fertig —
         * das bleibt unangetastet, sonst gäbe es ein Flackern. Nur was
         * ausserhalb liegt, wird zurückgehalten und beim Heranscrollen
         * eingerollt. Verwaiste Markierungen eines früheren Laufs (dessen
         * Beobachter abgeräumt wurde) werden dabei übernommen.
         */
        if (isNearView(el)) {
          if (el.dataset.reveal === "out") el.dataset.reveal = "in";
        } else if (el.dataset.reveal !== "in") {
          el.dataset.reveal = "out";
          observer.observe(el);
        }

        if (kind === "card" && !el.dataset.motion) el.dataset.motion = "card";
        el.dataset.parallaxItem = kind;

        items.push({ el, kind, amplitude: amplitudeFor(kind, index), top: 0, height: 0, py: 0 });
        tracked.add(el);
        added++;
      }

      if (added > 0) {
        armFailsafe();
        measure();
        applyParallax();
      }
    };

    prepare();

    // ── Nachgeladene Inhalte ──────────────────────────────────────────
    let pending = false;
    const mutationObserver = new MutationObserver(() => {
      // Das Sicherheitsnetz hängt nicht am Animationsrahmen — der läuft in
      // Hintergrund-Tabs nicht.
      if (root.querySelector('[data-reveal="out"]')) armFailsafe();
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        prepare();
        measure();
        applyParallax();
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    // Höhenänderungen (Bilder, Schriften, Aufklappen) neu vermessen
    const resizeObserver = new ResizeObserver(() => {
      measure();
      applyParallax();
    });
    if (root.firstElementChild) resizeObserver.observe(root.firstElementChild);

    // ── Scrollen: Seitenkopf + Elemente ───────────────────────────────
    const heading = root.querySelector("h1");
    const header = heading?.parentElement ?? null;
    if (header) header.dataset.parallax = "";

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (header) {
          const offset = Math.min(root.scrollTop * 0.18, 44);
          header.style.setProperty("--parallax-y", `${-offset}px`);
          header.style.opacity = String(Math.max(1 - root.scrollTop / 460, 0.4));
        }
        applyParallax();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame) cancelAnimationFrame(frame);
      if (header) {
        header.style.removeProperty("--parallax-y");
        header.style.removeProperty("opacity");
      }
      // Nichts darf ausgeblendet zurückbleiben, was kein Nachfolger übernimmt
      root.querySelectorAll<HTMLElement>('[data-reveal="out"]').forEach((el) => {
        el.dataset.reveal = "in";
      });
    };
  }, [pathname]);

  return (
    <div data-motion="page" key={pathname}>
      {children}
    </div>
  );
}
