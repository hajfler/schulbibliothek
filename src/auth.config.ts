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
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" as const },
} satisfies NextAuthConfig;
