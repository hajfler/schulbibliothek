"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CATEGORY_COLORS } from "@/lib/default-categories";
import type { CategoryNode } from "@/lib/categories";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, Download, Tags, BookOpen,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  color: string | null;
}

interface DefaultSetInfo {
  key: string;
  label: string;
  description: string;
}

interface Props {
  schools: School[];
  activeSchoolId: string;
  initialTree: CategoryNode[];
  defaultSets: DefaultSetInfo[];
}

type EditorState =
  | { kind: "create"; parentId: string | null; parentName?: string }
  | { kind: "edit"; node: CategoryNode }
  | null;

export function CategoryManager({ schools, activeSchoolId, initialTree, defaultSets }: Props) {
  const [tree, setTree] = React.useState(initialTree);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(initialTree.map((c) => c.id)));
  const [editor, setEditor] = React.useState<EditorState>(null);
  const [deleting, setDeleting] = React.useState<CategoryNode | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importKey, setImportKey] = React.useState(defaultSets[0]?.key ?? "");
  const [loading, setLoading] = React.useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    setTree(initialTree);
    setExpanded(new Set(initialTree.map((c) => c.id)));
  }, [initialTree]);

  const reload = async () => {
    const res = await fetch(`/api/categories?schoolId=${encodeURIComponent(activeSchoolId)}`);
    if (res.ok) setTree(await res.json());
    router.refresh();
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const save = async (name: string, color: string | null) => {
    if (!editor || !name.trim()) return;
    setLoading(true);
    try {
      const res =
        editor.kind === "create"
          ? await fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ schoolId: activeSchoolId, name, color, parentId: editor.parentId }),
            })
          : await fetch(`/api/categories/${editor.node.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, color }),
            });
      if (!res.ok) {
        addToast("Fehler beim Speichern", "error");
        return;
      }
      addToast(editor.kind === "create" ? "Kategorie erstellt" : "Kategorie gespeichert", "success");
      if (editor.kind === "create" && editor.parentId) {
        setExpanded((prev) => new Set(prev).add(editor.parentId!));
      }
      setEditor(null);
      await reload();
    } catch {
      addToast("Fehler beim Speichern", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        addToast("Fehler beim Löschen", "error");
        return;
      }
      addToast("Kategorie gelöscht", "success");
      setDeleting(null);
      await reload();
    } catch {
      addToast("Fehler beim Löschen", "error");
    } finally {
      setLoading(false);
    }
  };

  const importSet = async () => {
    if (!importKey) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: activeSchoolId, setKey: importKey }),
      });
      if (!res.ok) {
        addToast("Fehler beim Laden der Standardkategorien", "error");
        return;
      }
      const { created, skipped } = await res.json();
      addToast(
        `${created} Kategorien angelegt${skipped > 0 ? `, ${skipped} bereits vorhanden` : ""}`,
        "success"
      );
      setImportOpen(false);
      await reload();
    } catch {
      addToast("Fehler beim Laden der Standardkategorien", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeSchool = schools.find((s) => s.id === activeSchoolId);
  const totalBooks = tree.reduce((sum, c) => sum + c.bookCount + c.children.reduce((s, ch) => s + ch.bookCount, 0), 0);

  return (
    <div className="space-y-5">
      {/* School tabs */}
      {schools.length > 1 && (
        <div className="flex flex-wrap gap-1.5 bg-white border border-[#C6C6C8] rounded-xl p-1 w-fit">
          {schools.map((s) => (
            <Link
              key={s.id}
              href={`/admin/categories?school=${s.id}`}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                s.id === activeSchoolId
                  ? "bg-[#007AFF] text-white shadow-sm"
                  : "text-[#3A3A3C] hover:bg-[#F2F2F7]"
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: s.color ?? "#007AFF" }} />
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#8E8E93]">
          <span className="font-semibold text-[#1C1C1E]">{activeSchool?.name}</span>
          {" · "}
          {tree.length} Hauptkategorien, {tree.reduce((n, c) => n + c.children.length, 0)} Unterkategorien, {totalBooks} zugeordnete Bücher
        </p>
        <div className="flex gap-2">
          {defaultSets.length > 0 && (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Download size={15} />
              Standardkategorien laden
            </Button>
          )}
          <Button onClick={() => setEditor({ kind: "create", parentId: null })}>
            <Plus size={15} />
            Hauptkategorie
          </Button>
        </div>
      </div>

      {/* Tree */}
      {tree.length === 0 ? (
        <div className="card text-center py-16">
          <Tags size={40} className="text-[#C7C7CC] mx-auto mb-3" />
          <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-1">Noch keine Kategorien</h3>
          <p className="text-[14px] text-[#8E8E93]">
            Lade ein Standardset oder erstelle die erste Hauptkategorie.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-[#F2F2F7]">
          {tree.map((main) => {
            const isOpen = expanded.has(main.id);
            return (
              <div key={main.id}>
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-[#F9F9FB] transition-colors">
                  <button
                    onClick={() => toggle(main.id)}
                    className="p-1 rounded-md text-[#8E8E93] hover:bg-[#F2F2F7] disabled:opacity-30"
                    disabled={main.children.length === 0}
                    aria-label={isOpen ? "Zuklappen" : "Aufklappen"}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: main.color ?? "#E5E5EA" }}
                  />
                  <span className="flex-1 text-[15px] font-semibold text-[#1C1C1E]">{main.name}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[12px] text-[#8E8E93] mr-2">
                    <BookOpen size={12} />
                    {main.bookCount + main.children.reduce((s, ch) => s + ch.bookCount, 0)}
                  </span>
                  <span className="text-[12px] text-[#8E8E93] mr-2">
                    {main.children.length} Unterkat.
                  </span>
                  <RowActions
                    onAdd={() => setEditor({ kind: "create", parentId: main.id, parentName: main.name })}
                    onEdit={() => setEditor({ kind: "edit", node: main })}
                    onDelete={() => setDeleting(main)}
                  />
                </div>
                {isOpen && main.children.length > 0 && (
                  <div className="bg-[#FAFAFC] border-t border-[#F2F2F7]">
                    {main.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 pl-14 pr-4 py-2 hover:bg-[#F2F2F7] transition-colors"
                      >
                        <span className="flex-1 text-[14px] text-[#3A3A3C]">{child.name}</span>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[12px] text-[#8E8E93] mr-2">
                          <BookOpen size={12} />
                          {child.bookCount}
                        </span>
                        <RowActions
                          onEdit={() => setEditor({ kind: "edit", node: child })}
                          onDelete={() => setDeleting(child)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit modal */}
      {editor && (
        <CategoryEditor
          state={editor}
          loading={loading}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}

      {/* Delete confirm */}
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Kategorie löschen" size="sm">
        {deleting && (
          <div className="p-6 space-y-5">
            <p className="text-[14px] text-[#3A3A3C]">
              «{deleting.name}» wirklich löschen?
              {deleting.children.length > 0 && (
                <> Die {deleting.children.length} Unterkategorien werden ebenfalls gelöscht.</>
              )}
              {" "}Zugeordnete Bücher bleiben erhalten und verlieren nur ihre Kategorie.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>
                Abbrechen
              </Button>
              <Button variant="danger" className="flex-1" loading={loading} onClick={remove}>
                Löschen
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Standardkategorien laden">
        <div className="p-6 space-y-5">
          <p className="text-[14px] text-[#3A3A3C]">
            Lädt die Ordnung aus dem Dokument «Lehrerbibliothek-Unterkategorien» in die Bibliothek{" "}
            <span className="font-semibold">{activeSchool?.name}</span>. Bereits vorhandene Kategorien
            mit gleichem Namen werden übersprungen.
          </p>
          <Select
            label="Kategorienset"
            value={importKey}
            onChange={(e) => setImportKey(e.target.value)}
            options={defaultSets.map((s) => ({ value: s.key, label: s.label }))}
          />
          <p className="text-[13px] text-[#8E8E93]">
            {defaultSets.find((s) => s.key === importKey)?.description}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setImportOpen(false)}>
              Abbrechen
            </Button>
            <Button className="flex-1" loading={loading} onClick={importSet} disabled={!importKey}>
              Laden
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RowActions({
  onAdd,
  onEdit,
  onDelete,
}: {
  onAdd?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const btn = "p-1.5 rounded-lg text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] transition-colors";
  return (
    <div className="flex items-center gap-0.5">
      {onAdd && (
        <button onClick={onAdd} className={btn} title="Unterkategorie hinzufügen">
          <Plus size={15} />
        </button>
      )}
      <button onClick={onEdit} className={btn} title="Bearbeiten">
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-[#8E8E93] hover:bg-[#FFE9E9] hover:text-[#FF3B30] transition-colors"
        title="Löschen"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function CategoryEditor({
  state,
  loading,
  onClose,
  onSave,
}: {
  state: NonNullable<EditorState>;
  loading: boolean;
  onClose: () => void;
  onSave: (name: string, color: string | null) => void;
}) {
  const isSub = state.kind === "create" ? state.parentId !== null : state.node.parentId !== null;
  const [name, setName] = React.useState(state.kind === "edit" ? state.node.name : "");
  const [color, setColor] = React.useState<string | null>(state.kind === "edit" ? state.node.color : null);

  const title =
    state.kind === "create"
      ? isSub
        ? `Unterkategorie in «${state.parentName}»`
        : "Hauptkategorie erstellen"
      : "Kategorie bearbeiten";

  return (
    <Modal open onClose={onClose} title={title} size="sm">
      <form
        className="p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, color);
        }}
      >
        <Input
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isSub ? "z.B. Geometrie" : "z.B. Mathematik"}
          autoFocus
        />
        {!isSub && (
          <div>
            <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-3">
              Farbe (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor(null)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 border-dashed border-[#C6C6C8] text-[10px] text-[#8E8E93] transition-transform",
                  color === null ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-105"
                )}
                title="Keine Farbe"
              >
                –
              </button>
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" loading={loading} disabled={!name.trim()}>
            {state.kind === "create" ? "Erstellen" : "Speichern"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
