import { prisma } from "@/lib/db";

export interface CategoryNode {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  parentId: string | null;
  schoolId: string;
  bookCount: number;
  children: CategoryNode[];
}

/** Lädt alle Kategorien eines Schulhauses als zweistufigen Baum (Haupt- mit Unterkategorien). */
export async function getCategoryTree(schoolId: string): Promise<CategoryNode[]> {
  const rows = await prisma.category.findMany({
    where: { schoolId },
    include: { _count: { select: { books: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const nodes = new Map<string, CategoryNode>();
  for (const r of rows) {
    nodes.set(r.id, {
      id: r.id,
      name: r.name,
      color: r.color,
      sortOrder: r.sortOrder,
      parentId: r.parentId,
      schoolId: r.schoolId,
      bookCount: r._count.books,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Anzeigename «Hauptkategorie › Unterkategorie». */
export function formatCategoryPath(category: { name: string; parent?: { name: string } | null } | null | undefined): string | null {
  if (!category) return null;
  return category.parent ? `${category.parent.name} › ${category.name}` : category.name;
}

/** Prüft, ob eine Kategorie existiert und zum angegebenen Schulhaus gehört. */
export async function validateCategoryForSchool(categoryId: string | null | undefined, schoolId: string): Promise<string | null> {
  if (!categoryId) return null;
  const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { schoolId: true } });
  if (!cat || cat.schoolId !== schoolId) {
    throw new Error("Category does not belong to this school");
  }
  return categoryId;
}
