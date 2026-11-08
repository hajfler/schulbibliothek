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


/** Weist einem Benutzer ohne Schulhaus-Mitgliedschaften alle Schulhäuser zu (erstes als aktives). */
async function assignSchoolsToUser(userId: string) {
  const count = await prisma.userSchool.count({ where: { userId } });
  if (count > 0) return;

  const allSchools = await prisma.school.findMany({
    select: { id: true },
    orderBy: { name: "asc" },
  });
  if (allSchools.length === 0) return;

  await prisma.userSchool.createMany({
    data: allSchools.map((s) => ({ userId, schoolId: s.id })),
    skipDuplicates: true,
  });
  await prisma.user.update({
    where: { id: userId },
    data: { schoolId: allSchools[0].id },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      // Beim Login die ID übernehmen, danach Rolle und aktives Schulhaus bei jeder
      // Anfrage frisch aus der DB lesen: Schulhaus-Wechsel (SchoolSwitcher) und
      // Rollenänderungen durch Admins greifen so sofort, nicht erst beim nächsten Login.
      if (user?.id) {
        token.id = user.id;
      }
      const userId = (token.id as string | undefined) ?? (token.sub as string | undefined);
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, schoolId: true },
        });
        token.id = userId;
        token.role = dbUser?.role ?? "USER";
        token.schoolId = dbUser?.schoolId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as Role | undefined) ?? "USER";
      session.user.schoolId = (token.schoolId as string | null | undefined) ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Fires exactly once after the user row is committed to the DB
      if (!user.id) return;
      await assignSchoolsToUser(user.id);
    },
    async linkAccount({ user }) {
      // Fires when the M365 account is linked to an existing (pre-imported) user
      if (!user.id) return;
      await assignSchoolsToUser(user.id);
    },
  },
});
