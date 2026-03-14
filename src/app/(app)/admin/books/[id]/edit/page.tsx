import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { ToastProvider } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/books");
  }

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/books/${id}`}
        className="inline-flex items-center gap-2 text-[14px] text-[#007AFF] hover:underline"
      >
        <ArrowLeft size={16} />
        Zurück zum Buch
      </Link>

      <div>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
          Buch bearbeiten
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-0.5">{book.title}</p>
      </div>

      <ToastProvider>
        <BookForm
          mode="edit"
          initialData={{
            id: book.id,
            isbn: book.isbn ?? "",
            title: book.title,
            author: book.author,
            publishingHouse: book.publishingHouse ?? "",
            series: book.series ?? "",
            typePublication: book.typePublication,
            publishedDate: book.publishedDate ?? "",
            pageCount: book.pageCount?.toString() ?? "",
            format: book.format,
            coverUrl: book.coverUrl ?? "",
            description: book.description ?? "",
            language: book.language ?? "de",
            totalCopies: book.totalCopies.toString(),
          }}
          schoolId={book.schoolId}
        />
      </ToastProvider>
    </div>
  );
}
