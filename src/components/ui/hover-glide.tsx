"use client";

import * as React from "react";

/**
 * Gleitende Mouseover-Hervorhebung für die ganze Anwendung.
 *
 * Eine einzige, schwebende Fläche folgt dem Mauszeiger von Element zu Element.
 * Lage und Grösse laufen über eine gedämpfte Feder (Masse, Steifigkeit,
 * Dämpfung): Die Fläche nimmt Schwung mit, schiesst leicht über das Ziel
 * hinaus und pendelt aus. Wechselt das Ziel mitten in der Bewegung, bleibt die
 * Geschwindigkeit erhalten — darum wirkt es wie ein Gegenstand und nicht wie
 * eine abgespielte Animation.
 *
 * Erfasst werden Links, Schaltflächen, Register und Tabellenzeilen. Wer eine
 * Fläche ausnehmen will, setzt `data-no-glide`; zusätzliche Ziele bekommen
 * `data-glide`.
 */

const TARGETS = 'a[href], button, [role="tab"], [role="option"], tbody tr, [data-glide]';

// Federkonstanten: leicht unterdämpft, damit ein kleines Überschwingen bleibt.
const STIFFNESS = 380;
const DAMPING = 26;
const MAX_HEIGHT = 132; // grössere Flächen (Karten) haben ihre eigene Bewegung

type Box = { x: number; y: number; w: number; h: number };
const KEYS = ["x", "y", "w", "h"] as const;

export function HoverGlide() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const pill = ref.current;
    if (!pill) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches) return;

    const root = document.documentElement;
    root.dataset.hoverGlide = "on";

    const pos: Box = { x: 0, y: 0, w: 0, h: 0 };
    const vel: Box = { x: 0, y: 0, w: 0, h: 0 };
    let target: HTMLElement | null = null;
    let visible = false;
    let frame = 0;
    let last = 0;
    let snap = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const boxOf = (el: HTMLElement): Box => {
      const r = el.getBoundingClientRect();
      // Tabellenzeilen: Fläche leicht eingerückt, damit sie in der Karte schwebt
      const inset = el.tagName === "TR" ? 6 : 0;
      return { x: r.left + inset, y: r.top + 1, w: r.width - inset * 2, h: r.height - 2 };
    };

    const paint = () => {
      pill.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      pill.style.width = `${Math.max(0, pos.w)}px`;
      pill.style.height = `${Math.max(0, pos.h)}px`;
    };

    const tick = (now: number) => {
      frame = 0;
      if (!target || !target.isConnected) {
        hide(true);
        return;
      }
      const goal = boxOf(target);
      // Zeitschritt begrenzen, damit die Feder nach einem Ruckler nicht ausbricht
      const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
      last = now;

      let moving = false;
      for (const k of KEYS) {
        if (snap || calm.matches) {
          pos[k] = goal[k];
          vel[k] = 0;
          continue;
        }
        const force = (goal[k] - pos[k]) * STIFFNESS - vel[k] * DAMPING;
        vel[k] += force * dt;
        pos[k] += vel[k] * dt;
        if (Math.abs(vel[k]) > 0.05 || Math.abs(goal[k] - pos[k]) > 0.05) moving = true;
      }
      snap = false;
      paint();
      // Solange die Fläche sichtbar ist, folgt sie ihrem Ziel (Scrollen, Layout)
      if (visible || moving) frame = requestAnimationFrame(tick);
    };

    const run = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    function hide(now = false) {
      clearTimeout(hideTimer);
      const off = () => {
        visible = false;
        target = null;
        pill!.dataset.show = "false";
      };
      // Kurze Gnadenfrist: beim Wechsel über einen Spalt bleibt die Fläche stehen
      if (now) off();
      else hideTimer = setTimeout(off, 90);
    }

    const pick = (start: EventTarget | null): HTMLElement | null => {
      if (!(start instanceof Element)) return null;
      const el = start.closest<HTMLElement>(TARGETS);
      if (!el || el.closest("[data-no-glide]")) return null;
      if (el instanceof HTMLButtonElement && el.disabled) return null;
      if (el.getAttribute("aria-disabled") === "true") return null;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.height > MAX_HEIGHT) return null;
      return el;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const el = pick(e.target);
      if (!el) {
        if (target) hide();
        return;
      }
      clearTimeout(hideTimer);
      if (el === target) return;
      target = el;

      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      pill.style.borderRadius =
        el.tagName === "TR" ? "10px" : radius > 0 ? cs.borderRadius : "8px";

      if (!visible) {
        // Erscheinen: etwas kleiner ansetzen, die Feder drückt die Fläche auf
        const goal = boxOf(el);
        const pad = Math.min(8, goal.h * 0.18);
        pos.x = goal.x + pad;
        pos.y = goal.y + pad;
        pos.w = goal.w - pad * 2;
        pos.h = goal.h - pad * 2;
        vel.x = vel.y = vel.w = vel.h = 0;
        paint();
        visible = true;
        pill.dataset.show = "true";
      }
      run();
    };

    const onLeaveWindow = () => hide();
    const onScroll = () => {
      // Beim Scrollen klebt die Fläche am Element, statt hinterherzufedern
      snap = true;
    };
    const onDown = () => {
      pill.dataset.press = "true";
    };
    const onUp = () => {
      pill.dataset.press = "false";
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    root.addEventListener("pointerleave", onLeaveWindow);
    window.addEventListener("blur", onLeaveWindow);

    return () => {
      delete root.dataset.hoverGlide;
      clearTimeout(hideTimer);
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("scroll", onScroll, { capture: true });
      root.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("blur", onLeaveWindow);
    };
  }, []);

  return <div ref={ref} className="hover-glide" data-show="false" aria-hidden="true" />;
}
