import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { HoverGlide } from "@/components/ui/hover-glide";
import { MotionProvider } from "@/components/ui/motion-provider";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Schulhäuser für den Umschalter am Fuss der Navigation: Admins alle, sonst die zugeordneten
  const schools =
    session.user.role === "ADMIN"
      ? await prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : await prisma.school.findMany({
          where: { userMemberships: { some: { userId: session.user.id } } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        });

  return (
    <ToastProvider>
      <HoverGlide />
      <div className="flex h-screen bg-[var(--background)]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar session={session} schools={schools} activeSchoolId={session.user.schoolId ?? null} />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Mobile header */}
          <div className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--separator-opaque)] px-4 py-3 flex items-center">
            <img src="/logo.svg" alt="Schule Dietlikon" className="h-6 w-auto logo-light-mode" />
            <img src="/logo-dark.svg" alt="Schule Dietlikon" className="h-6 w-auto logo-dark-mode" />
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-24 md:pb-8">
            <MotionProvider>{children}</MotionProvider>
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav session={session} />
      </div>
    </ToastProvider>
  );
}
