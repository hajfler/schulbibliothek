import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#F2F2F7]">
        <Sidebar session={session} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
