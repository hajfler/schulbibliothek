import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schulbibliothek Dietlikon",
  description: "Bücherausleihe System für die Schule Dietlikon",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
