"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ISBNScanner } from "./isbn-scanner";
import { useToast } from "@/components/ui/toast";
import {
  BookOpen, Search, Loader2, Image as ImageIcon, Hash, Upload, Trash2, X,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "BOOK", label: "Buch" },
  { value: "MAGAZINE", label: "Zeitschrift" },
  { value: "NEWSPAPER", label: "Zeitung" },
  { value: "COMIC", label: "Comic" },
  { value: "AUDIOBOOK", label: "Hörbuch" },
  { value: "EBOOK", label: "E-Book" },
  { value: "REFERENCE", label: "Nachschlagewerk" },
  { value: "OTHER", label: "Sonstiges" },
];

const FORMAT_OPTIONS = [
  { value: "HARDCOVER", label: "Hardcover" },
  { value: "PAPERBACK", label: "Taschenbuch" },
  { value: "POCKET", label: "Pocket" },
  { value: "LARGE_PRINT", label: "Großdruck" },
  { value: "OTHER", label: "Andere" },
];

const LANGUAGE_OPTIONS = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Französisch" },
  { value: "it", label: "Italienisch" },
  { value: "es", label: "Spanisch" },
  { value: "other", label: "Andere" },
];

interface BookFormData {
  isbn: string;
  title: string;
  author: string;
  publishingHouse: string;
  series: string;
  typePublication: string;
  publishedDate: string;
  pageCount: string;
  format: string;
  coverUrl: string;
  description: string;
  language: string;
  totalCopies: string;
}

interface School {
  id: string;
  name: string;
}

interface BookFormProps {
  initialData?: Partial<BookFormData> & { id?: string };
  schoolId?: string;
  schools?: School[];
  mode: "create" | "edit";
}

const empty: BookFormData = {
  isbn: "", title: "", author: "", publishingHouse: "", series: "",
  typePublication: "BOOK", publishedDate: "", pageCount: "",
  format: "HARDCOVER", coverUrl: "", description: "", language: "de",
  totalCopies: "1",
};

export function BookForm({ initialData, schoolId, schools = [], mode }: BookFormProps) {
  const [data, setData] = React.useState<BookFormData>({ ...empty, ...initialData });
  const [selectedSchoolId, setSelectedSchoolId] = React.useState<string>(schoolId ?? schools[0]?.id ?? "");
  const [loading, setLoading] = React.useState(false);
  const [isbnLoading, setIsbnLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<BookFormData>>({});
  const [coverMode, setCoverMode] = React.useState<"url" | "upload">(
    initialData?.coverUrl?.startsWith("/covers/") ? "upload" : "url"
  );
  const { addToast } = useToast();
  const router = useRouter();

  const set = (key: keyof BookFormData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fetchISBN = async (isbn: string) => {
    if (!isbn) return;
    setIsbnLoading(true);
    try {
      const res = await fetch(`/api/isbn?isbn=${encodeURIComponent(isbn)}`);
      if (res.ok) {
        const bookData = await res.json();
        setData((prev) => ({
          ...prev,
          isbn,
          title: bookData.title ?? prev.title,
          author: bookData.author ?? prev.author,
          publishingHouse: bookData.publishingHouse ?? prev.publishingHouse,
          publishedDate: bookData.publishedDate ?? prev.publishedDate,
          pageCount: bookData.pageCount?.toString() ?? prev.pageCount,
          coverUrl: bookData.coverUrl ?? prev.coverUrl,
          description: bookData.description ?? prev.description,
          language: bookData.language ?? prev.language,
        }));
        addToast("Buchdaten erfolgreich geladen", "success");
      } else {
        addToast("Buch nicht in der Datenbank gefunden", "warning");
      }
    } catch {
      addToast("Fehler beim Laden der Buchdaten", "error");
    } finally {
      setIsbnLoading(false);
    }
  };

  const deleteUploadedCover = async (url: string) => {
    const filename = url.replace("/covers/", "");
    try {
      await fetch(`/api/upload/cover?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (data.coverUrl?.startsWith("/covers/")) {
        await deleteUploadedCover(data.coverUrl);
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        addToast(err.error ?? "Fehler beim Hochladen", "error");
        return;
      }
      const { url } = await res.json();
      set("coverUrl", url);
      addToast("Cover hochgeladen", "success");
    } catch {
      addToast("Fehler beim Hochladen", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCoverDelete = async () => {
    if (!data.coverUrl?.startsWith("/covers/")) return;
    await deleteUploadedCover(data.coverUrl);
    set("coverUrl", "");
  };

  const validate = (): boolean => {
    const newErrors: Partial<BookFormData> = {};
    if (!data.title.trim()) newErrors.title = "Titel ist erforderlich";
    if (!data.author.trim()) newErrors.author = "Autor ist erforderlich";
    if (data.pageCount && isNaN(parseInt(data.pageCount))) newErrors.pageCount = "Muss eine Zahl sein";
    if (data.totalCopies && (isNaN(parseInt(data.totalCopies)) || parseInt(data.totalCopies) < 1)) {
      newErrors.totalCopies = "Muss mindestens 1 sein";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const url =
        mode === "edit" ? `/api/books/${initialData?.id}` : "/api/books";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, schoolId: selectedSchoolId || schoolId }),
      });

      if (!res.ok) {
        const err = await res.json();
        addToast(err.error ?? "Fehler beim Speichern", "error");
        return;
      }

      const book = await res.json();
      addToast(
        mode === "edit" ? "Buch aktualisiert" : "Buch hinzugefügt",
        "success"
      );
      router.push(`/books/${book.id}`);
      router.refresh();
    } catch {
      addToast("Fehler beim Speichern", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* School selector (only for admins with multiple schools) */}
      {schools.length > 1 && (
        <div className="card p-6">
          <Select
            label="Schulhaus"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            options={schools.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
      )}

      {/* ISBN + Scanner */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
            ISBN & Datenbank
          </h2>
          <ISBNScanner onScan={(isbn) => { set("isbn", isbn); fetchISBN(isbn); }} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="ISBN"
              value={data.isbn}
              onChange={(e) => set("isbn", e.target.value)}
              placeholder="978-3-..."
              leftIcon={<Hash size={15} />}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fetchISBN(data.isbn)}
              loading={isbnLoading}
              disabled={!data.isbn}
            >
              <Search size={16} />
              Laden
            </Button>
          </div>
        </div>

        {isbnLoading && (
          <div className="flex items-center gap-2 text-[13px] text-[#007AFF]">
            <Loader2 size={14} className="animate-spin" />
            Buchdetails werden geladen...
          </div>
        )}
      </div>

      {/* Book details */}
      <div className="card p-6 space-y-5">
        <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Buchdetails
        </h2>

        <Input
          label="Titel *"
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Titel des Buches"
          error={errors.title}
        />
        <Input
          label="Autor *"
          value={data.author}
          onChange={(e) => set("author", e.target.value)}
          placeholder="Vorname Nachname"
          error={errors.author}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Verlag"
            value={data.publishingHouse}
            onChange={(e) => set("publishingHouse", e.target.value)}
            placeholder="Verlagsname"
          />
          <Input
            label="Reihe / Serie"
            value={data.series}
            onChange={(e) => set("series", e.target.value)}
            placeholder="z.B. Harry Potter"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Publikationstyp"
            value={data.typePublication}
            onChange={(e) => set("typePublication", e.target.value)}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Format"
            value={data.format}
            onChange={(e) => set("format", e.target.value)}
            options={FORMAT_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Erscheinungsdatum"
            value={data.publishedDate}
            onChange={(e) => set("publishedDate", e.target.value)}
            placeholder="2023"
          />
          <Input
            label="Anzahl Seiten"
            type="number"
            value={data.pageCount}
            onChange={(e) => set("pageCount", e.target.value)}
            placeholder="320"
            error={errors.pageCount}
          />
          <Select
            label="Sprache"
            value={data.language}
            onChange={(e) => set("language", e.target.value)}
            options={LANGUAGE_OPTIONS}
          />
        </div>

        <Input
          label="Anzahl Exemplare"
          type="number"
          value={data.totalCopies}
          onChange={(e) => set("totalCopies", e.target.value)}
          min="1"
          error={errors.totalCopies}
          hint="Wie viele Exemplare dieses Buches besitzt die Bibliothek?"
        />
      </div>

      {/* Cover & Description */}
      <div className="card p-6 space-y-5">
        <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Cover & Beschreibung
        </h2>

        <div className="flex gap-4 items-start">
          {/* Cover preview */}
          <div className="relative flex-shrink-0">
            {data.coverUrl ? (
              <>
                <img
                  src={data.coverUrl}
                  alt="Cover Vorschau"
                  className="w-20 h-28 object-cover rounded-xl shadow-sm"
                />
                {data.coverUrl.startsWith("/covers/") && (
                  <button
                    type="button"
                    onClick={handleCoverDelete}
                    title="Cover löschen"
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF3B30] rounded-full flex items-center justify-center shadow"
                  >
                    <X size={10} className="text-white" />
                  </button>
                )}
              </>
            ) : (
              <div className="w-20 h-28 bg-[#F2F2F7] rounded-xl flex items-center justify-center">
                <ImageIcon size={24} className="text-[#C7C7CC]" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {/* Mode toggle */}
            <div className="flex bg-[#F2F2F7] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setCoverMode("url")}
                className={`flex-1 text-[13px] font-medium py-1.5 rounded-lg transition-all ${
                  coverMode === "url"
                    ? "bg-white shadow-sm text-[#1C1C1E]"
                    : "text-[#8E8E93]"
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setCoverMode("upload")}
                className={`flex-1 text-[13px] font-medium py-1.5 rounded-lg transition-all ${
                  coverMode === "upload"
                    ? "bg-white shadow-sm text-[#1C1C1E]"
                    : "text-[#8E8E93]"
                }`}
              >
                Hochladen
              </button>
            </div>

            {coverMode === "url" ? (
              <Input
                label="Cover URL"
                value={data.coverUrl}
                onChange={(e) => set("coverUrl", e.target.value)}
                placeholder="https://..."
                hint="URL zum Buchcover-Bild (wird automatisch gefüllt)"
              />
            ) : (
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block">
                  Bild hochladen
                </label>
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-colors ${uploading ? "border-[#007AFF] bg-[#F2F2F7]" : "border-[#C6C6C8] cursor-pointer hover:border-[#007AFF] hover:bg-[#F2F2F7]"}`}>
                  {uploading ? (
                    <div className="flex items-center gap-2 text-[13px] text-[#007AFF]">
                      <Loader2 size={16} className="animate-spin" />
                      Wird hochgeladen...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={20} className="text-[#8E8E93]" />
                      <span className="text-[13px] text-[#8E8E93]">Klicken oder Bild ablegen</span>
                      <span className="text-[11px] text-[#C7C7CC]">JPG, PNG, WebP – max. 5 MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                  />
                </label>
                {data.coverUrl?.startsWith("/covers/") && (
                  <button
                    type="button"
                    onClick={handleCoverDelete}
                    className="flex items-center gap-1.5 text-[13px] text-[#FF3B30] hover:opacity-75 transition-opacity"
                  >
                    <Trash2 size={13} />
                    Bild löschen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide block mb-2">
            Beschreibung
          </label>
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Kurzbeschreibung des Buches..."
            rows={4}
            className="w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 text-[14px] text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Abbrechen
        </Button>
        <Button type="submit" loading={loading}>
          <BookOpen size={16} />
          {mode === "edit" ? "Änderungen speichern" : "Buch hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
