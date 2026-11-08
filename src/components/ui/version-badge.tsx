"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { APP_VERSION, changelog } from "@/lib/changelog";

/**
 * Versionsanzeige am Fuss der Navigation: ruht als schlichter Text und wird
 * unter dem Mauszeiger zur Schaltfläche, die den Änderungsverlauf öffnet.
 */
export function VersionBadge() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Änderungsverlauf anzeigen"
        className="group mt-3 mx-auto flex items-center justify-center gap-1.5 rounded-full px-3 py-1
                   text-[11px] text-[var(--foreground-tertiary)]
                   transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                   hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]
                   hover:shadow-sm hover:-translate-y-px
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]"
      >
        <Sparkles
          size={12}
          className="w-0 -ml-1.5 opacity-0 text-[#007AFF]
                     transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                     group-hover:w-3 group-hover:ml-0 group-hover:opacity-100"
        />
        <span className="whitespace-nowrap">Version {APP_VERSION}</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Was ist neu" size="lg">
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-7">
            {changelog.map((entry, i) => (
              <section key={entry.version}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[17px] font-semibold text-[var(--foreground)]">Version {entry.version}</h3>
                  {i === 0 && (
                    <span className="rounded-full bg-[#007AFF]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                      Aktuell
                    </span>
                  )}
                  <span className="text-[12px] text-[var(--foreground-tertiary)]">{entry.date}</span>
                </div>
                {entry.highlight && (
                  <p className="mb-3 text-[14px] text-[var(--foreground-secondary)]">{entry.highlight}</p>
                )}
                <ul className="flex flex-col gap-2.5">
                  {entry.changes.map((change) => (
                    <li key={change.title} className="flex gap-2.5">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#007AFF]/40" />
                      <p className="text-[14px] leading-relaxed text-[var(--foreground-secondary)]">
                        <span className="font-semibold text-[var(--foreground)]">{change.title}</span> — {change.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-7 border-t border-[var(--separator-opaque)] pt-4 text-[12px] text-[var(--foreground-tertiary)]">
            Schulbibliothek der Schule Dietlikon. Fragen zur Bedienung beantwortet das ICT-Team.
          </p>
        </div>
      </Modal>
    </>
  );
}
