"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

/** Farbschema (hell/dunkel/System) über die Klasse «dark» am <html>, wie im LMI. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {children}
    </ThemeProvider>
  );
}
