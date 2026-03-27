import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import { authConfig } from "@/auth.config";

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
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      // Runs on sign-in (user is set) — enrich token with DB data.
      // Role changes in the DB take effect on next sign-in.
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, schoolId: true },
        });
        token.id = user.id;
        token.role = dbUser?.role ?? "USER";
        token.schoolId = dbUser?.schoolId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id!;
      session.user.role = token.role ?? "USER";
      session.user.schoolId = token.schoolId ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Fires exactly once after the user row is committed to the DB
      if (!user.id) return;

      const allSchools = await prisma.school.findMany({
        select: { id: true },
        orderBy: { name: "asc" },
      });

      if (allSchools.length > 0) {
        await prisma.userSchool.createMany({
          data: allSchools.map((s) => ({ userId: user.id!, schoolId: s.id })),
          skipDuplicates: true,
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { schoolId: allSchools[0].id },
        });
      }
    },
  },
});
