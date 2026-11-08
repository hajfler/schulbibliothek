"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

/** Wechselt System → Hell → Dunkel → System, wie im LMI. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" aria-hidden />;

  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };
  const label = theme === "dark" ? "Dunkel" : theme === "light" ? "Hell" : "System";

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Farbschema: ${label} (klicken zum Wechseln)`}
      aria-label={`Farbschema: ${label}`}
      className="p-2 rounded-xl bg-[var(--surface-secondary)] hover:opacity-80 transition-opacity text-[var(--foreground-tertiary)]"
    >
      {theme === "dark" ? <Moon size={16} /> : theme === "light" ? <Sun size={16} /> : <Monitor size={16} />}
    </button>
  );
}
