export interface BookData {
  isbn?: string;
  title?: string;
  author?: string;
  publishingHouse?: string;
  publishedDate?: string;
  pageCount?: number;
  coverUrl?: string;
  description?: string;
  language?: string;
}

export async function lookupISBN(isbn: string): Promise<BookData | null> {
  const cleanISBN = isbn.replace(/[-\s]/g, "");

  // Try OpenLibrary first
  try {
    const olData = await fetchOpenLibrary(cleanISBN);
    if (olData) return { ...olData, isbn: cleanISBN };
  } catch {
    // Fall through to Google Books
  }

  // Try Google Books as fallback
  try {
    const gbData = await fetchGoogleBooks(cleanISBN);
    if (gbData) return { ...gbData, isbn: cleanISBN };
  } catch {
    // Both failed
  }

  return null;
}

async function fetchOpenLibrary(isbn: string): Promise<BookData | null> {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = await res.json();

  // Fetch author details
  let author = "";
  if (data.authors?.length > 0) {
    try {
      const authorRes = await fetch(
        `https://openlibrary.org${data.authors[0].key}.json`
      );
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        author = authorData.name ?? "";
      }
    } catch {
      // ignore
    }
  }

  // Fetch work details for description
  let description = "";
  if (data.works?.length > 0) {
    try {
      const workRes = await fetch(
        `https://openlibrary.org${data.works[0].key}.json`
      );
      if (workRes.ok) {
        const workData = await workRes.json();
        description =
          typeof workData.description === "string"
            ? workData.description
            : workData.description?.value ?? "";
      }
    } catch {
      // ignore
    }
  }

  const coverId = data.covers?.[0];
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : undefined;

  return {
    title: data.title ?? "",
    author: author || data.by_statement ?? "",
    publishingHouse: data.publishers?.[0] ?? "",
    publishedDate: data.publish_date ?? "",
    pageCount: data.number_of_pages ?? undefined,
    coverUrl,
    description,
    language: data.languages?.[0]?.key?.replace("/languages/", "") ?? "de",
  };
}

async function fetchGoogleBooks(isbn: string): Promise<BookData | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = await res.json();
  const book = data.items?.[0]?.volumeInfo;
  if (!book) return null;

  return {
    title: book.title ?? "",
    author: book.authors?.join(", ") ?? "",
    publishingHouse: book.publisher ?? "",
    publishedDate: book.publishedDate ?? "",
    pageCount: book.pageCount ?? undefined,
    coverUrl: book.imageLinks?.thumbnail?.replace("http://", "https://") ?? undefined,
    description: book.description ?? "",
    language: book.language ?? "de",
  };
}
