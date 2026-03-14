import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SchoolManager } from "@/components/admin/school-manager";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminSchoolsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const schools = await prisma.school.findMany({
    include: {
      _count: { select: { users: true, books: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Schulhäuser
        </h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">
          Verwalte die Schulgebäude und ihre Bibliotheken
        </p>
      </div>

      <ToastProvider>
        <SchoolManager initialSchools={schools} />
      </ToastProvider>
    </div>
  );
}
