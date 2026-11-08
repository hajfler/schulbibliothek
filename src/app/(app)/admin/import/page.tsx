import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImportUsers } from "@/components/admin/import-users";
import { ImportFromGraph } from "@/components/admin/import-from-graph";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminImportPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">Benutzer importieren</h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">
          Lehrpersonen aus Microsoft 365 vorab anlegen, damit Rollen vor dem ersten Login vergeben werden können
        </p>
      </div>

      <ToastProvider>
        <ImportFromGraph />
        <ImportUsers />
      </ToastProvider>
    </div>
  );
}
