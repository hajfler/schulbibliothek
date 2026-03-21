import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — loanId (CUID) is unguessable; data returned is non-sensitive
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      book: {
        select: {
          title: true,
          author: true,
          school: { select: { name: true, address: true } },
        },
      },
    },
  });

  if (!loan || ["RETURNED", "LOST"].includes(loan.status)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { title, author, school } = loan.book;
  const location = [school.name, school.address].filter(Boolean).join(", ");

  const dueDate = loan.dueDate;
  const start = icsDateOnly(dueDate);
  const end = icsDateOnly(new Date(dueDate.getTime() + 24 * 60 * 60 * 1000));
  const stamp = icsDateTimeUtc(new Date());
  const uid = `loan-${id}@schulbibliothek`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Schulbibliothek Dietlikon//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:Buch zurückgeben: ${title}`,
    `DESCRIPTION:"${title}" von ${author} in der Schulbibliothek ${school.name} zurückgeben.`,
    `LOCATION:${location}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "TRIGGER:-P2DT16H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Erinnerung: Buch zurückgeben",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT16H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Buch heute zurückgeben",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="Rueckgabe-${title.replace(/[^a-z0-9]/gi, "_")}.ics"`,
    },
  });
}

function icsDateOnly(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function icsDateTimeUtc(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}
