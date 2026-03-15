import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      schoolId?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, schoolId: true },
        });
        session.user.role = dbUser?.role ?? "USER";
        session.user.schoolId = dbUser?.schoolId ?? null;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        // Check if this user already has any school memberships
        const membershipCount = await prisma.userSchool.count({
          where: { userId: user.id },
        });

        if (membershipCount === 0) {
          // First login: assign user to ALL schools
          const allSchools = await prisma.school.findMany({
            select: { id: true },
            orderBy: { name: "asc" },
          });

          if (allSchools.length > 0) {
            await prisma.userSchool.createMany({
              data: allSchools.map((s) => ({ userId: user.id!, schoolId: s.id })),
              skipDuplicates: true,
            });

            // Set active school to the first one if not set
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { schoolId: true },
            });
            if (!dbUser?.schoolId) {
              await prisma.user.update({
                where: { id: user.id },
                data: { schoolId: allSchools[0].id },
              });
            }
          }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
});
