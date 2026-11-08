import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Edge-runtime-safe config: no Node.js-only imports (no Prisma, no fs, etc.).
// Used by middleware. The full auth in src/lib/auth.ts spreads this config and
// adds the PrismaAdapter + JWT callbacks that read from the database.
export const authConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: { scope: "openid profile email User.Read" },
      },
      // Vorab importierte Benutzer (CSV aus M365, noch ohne verknüpftes Konto) werden beim
      // ersten Login anhand der E-Mail verknüpft. Unkritisch, weil nur der Tenant der Schule
      // authentifizieren kann; niemand kann dort eine fremde Adresse registrieren.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" as const },
  // Hinter dem Coolify-Proxy; ohne trustHost loggt die Middleware bei jedem /api/auth/session «UntrustedHost»
  trustHost: true,
} satisfies NextAuthConfig;
