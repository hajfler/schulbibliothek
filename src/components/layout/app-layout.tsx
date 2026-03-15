import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { ToastProvider } from "@/components/ui/toast";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#F2F2F7]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar session={session} />
        </div>

        <main className="flex-1 overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden sticky top-0 z-30 bg-white border-b border-[#F2F2F7] px-4 py-3 flex items-center">
            <img src="/logo.svg" alt="Schule Dietlikon" className="h-6 w-auto" />
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav session={session} />
      </div>
    </ToastProvider>
  );
}
