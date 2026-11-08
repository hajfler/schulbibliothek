import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCategoryTree } from "@/lib/categories";
import { DEFAULT_CATEGORY_SETS } from "@/lib/default-categories";
import { CategoryManager } from "@/components/admin/category-manager";
import { ToastProvider } from "@/components/ui/toast";
import { Tags } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { school } = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  // Admins verwalten alle Bibliotheken, Bibliothekare die ihnen zugeteilten
  const schools = isAdmin
    ? await prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } })
    : await prisma.school.findMany({
        where: { userMemberships: { some: { userId: session.user.id } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, color: true },
      });

  const activeSchool =
    schools.find((s) => s.id === school) ??
    schools.find((s) => s.id === session.user.schoolId) ??
    schools[0] ??
    null;

  const tree = activeSchool ? await getCategoryTree(activeSchool.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">Kategorien</h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">
          Ausleihkategorien pro Bibliothek: Hauptkategorien mit optionalen Unterkategorien
        </p>
      </div>

      {!activeSchool ? (
        <div className="card text-center py-16">
          <Tags size={40} className="text-[#C7C7CC] mx-auto mb-3" />
          <p className="text-[14px] text-[#8E8E93]">Kein Schulhaus zugeteilt.</p>
        </div>
      ) : (
        <ToastProvider>
          <CategoryManager
            schools={schools}
            activeSchoolId={activeSchool.id}
            initialTree={tree}
            defaultSets={DEFAULT_CATEGORY_SETS.map((s) => ({ key: s.key, label: s.label, description: s.description }))}
          />
        </ToastProvider>
      )}
    </div>
  );
}
