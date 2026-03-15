import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { ToastProvider } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewBookPage() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user?.role ?? "")) {
    redirect("/books");
  }

  // Admins can create books for any school; others only for their own school
  const isAdmin = session.user?.role === "ADMIN";
  const schools = isAdmin
    ? await prisma.school.findMany({ orderBy: { name: "asc" } })
    : session.user?.schoolId
    ? await prisma.school.findMany({ where: { id: session.user.schoolId } })
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/books"
        className="inline-flex items-center gap-2 text-[14px] text-[#007AFF] hover:underline"
      >
        <ArrowLeft size={16} />
        Zurück
      </Link>

      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Buch hinzufügen
        </h1>
        <p className="text-[14px] text-[#8E8E93] mt-0.5">
          Scanne einen Strichcode oder gib die Daten manuell ein
        </p>
      </div>

      <ToastProvider>
        <BookForm
          mode="create"
          schoolId={session.user?.schoolId ?? undefined}
          schools={schools}
        />
      </ToastProvider>
    </div>
  );
}
