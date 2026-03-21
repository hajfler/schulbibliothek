import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface ReminderEmailData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: Date;
  schoolName: string;
  daysLeft: number;
}

export async function sendReminderEmail(data: ReminderEmailData) {
  const { to, userName, bookTitle, bookAuthor, dueDate, schoolName, daysLeft } = data;

  const dueDateFormatted = dueDate.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let subject: string;
  let urgencyText: string;
  let urgencyColor: string;

  if (daysLeft < 0) {
    subject = `Buch überfällig: "${bookTitle}"`;
    urgencyText = `Das Buch ist seit ${Math.abs(daysLeft)} Tag(en) überfällig.`;
    urgencyColor = "#FF3B30";
  } else if (daysLeft === 0) {
    subject = `Buch heute fällig: "${bookTitle}"`;
    urgencyText = "Das Buch muss heute zurückgegeben werden.";
    urgencyColor = "#FF9500";
  } else {
    subject = `Erinnerung: "${bookTitle}" in ${daysLeft} Tag(en) fällig`;
    urgencyText = `Das Buch muss in ${daysLeft} Tag(en) zurückgegeben werden.`;
    urgencyColor = "#007AFF";
  }

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;border-bottom:1px solid #F2F2F7;">
              <img src="${process.env.NEXTAUTH_URL}/logo.svg" alt="Schule Dietlikon" style="height:32px;width:auto;margin-bottom:12px;" />
              <p style="color:#8E8E93;font-size:13px;margin:0;">Bibliothek · ${schoolName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;">
              <p style="color:#1C1C1E;font-size:16px;margin:0 0 24px;">Hallo ${userName},</p>

              <!-- Urgency Banner -->
              <div style="background-color:${urgencyColor};border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#FFFFFF;font-size:15px;font-weight:600;margin:0;">${urgencyText}</p>
              </div>

              <!-- Book Info -->
              <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Buch</p>
                <p style="color:#1C1C1E;font-size:17px;font-weight:600;margin:0 0 4px;">${bookTitle}</p>
                <p style="color:#3A3A3C;font-size:15px;margin:0 0 12px;">${bookAuthor}</p>
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Rückgabe bis</p>
                <p style="color:#1C1C1E;font-size:15px;font-weight:600;margin:0;">${dueDateFormatted}</p>
              </div>

              <p style="color:#3A3A3C;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Bitte bringe das Buch rechtzeitig in die Schulbibliothek zurück.
                Bei Fragen oder Problemen wende dich bitte an deinen Bibliothekar.
              </p>

              <div style="text-align:center;">
                <a href="${process.env.NEXTAUTH_URL}/my-loans"
                   style="display:inline-block;background-color:#007AFF;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Meine Ausleihen ansehen
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F2F2F7;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="color:#8E8E93;font-size:13px;margin:0;">
                Diese E-Mail wurde automatisch von der Bibliothek ${schoolName} gesendet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Schulbibliothek ${schoolName}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function icsDateOnly(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function icsDateTimeUtc(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function generateIcs(bookTitle: string, bookAuthor: string, dueDate: Date, schoolName: string): string {
  const start = icsDateOnly(dueDate);
  // DTEND is exclusive for all-day events → next day
  const end = icsDateOnly(new Date(dueDate.getTime() + 24 * 60 * 60 * 1000));
  const stamp = icsDateTimeUtc(new Date());
  const uid = `loan-${stamp}-${Math.random().toString(36).slice(2)}@schulbibliothek`;
  const description = `"${bookTitle}" von ${bookAuthor} in der Schulbibliothek ${schoolName} zurückgeben.`;

  return [
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
    `SUMMARY:Buch zurückgeben: ${bookTitle}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${schoolName}`,
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Erinnerung: Buch zurückgeben",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleCalendarUrl(bookTitle: string, dueDate: Date, schoolName: string): string {
  const start = icsDateOnly(dueDate);
  const end = icsDateOnly(new Date(dueDate.getTime() + 24 * 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Buch zurückgeben: ${bookTitle}`,
    dates: `${start}/${end}`,
    location: schoolName,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Loan Confirmation ───────────────────────────────────────────────────────

interface LoanConfirmationData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  borrowedAt: Date;
  dueDate: Date;
  schoolName: string;
}

export async function sendLoanConfirmationEmail(data: LoanConfirmationData) {
  const { to, userName, bookTitle, bookAuthor, borrowedAt, dueDate, schoolName } = data;

  const dueDateFormatted = dueDate.toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const borrowedAtFormatted = borrowedAt.toLocaleDateString("de-CH", {
    day: "numeric", month: "long", year: "numeric",
  });

  const subject = `Ausleihe bestätigt: „${bookTitle}"`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;border-bottom:1px solid #F2F2F7;">
              <img src="${process.env.NEXTAUTH_URL}/logo.svg" alt="Schule Dietlikon" style="height:32px;width:auto;margin-bottom:12px;" />
              <p style="color:#8E8E93;font-size:13px;margin:0;">Bibliothek · ${schoolName}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;">
              <p style="color:#1C1C1E;font-size:16px;margin:0 0 24px;">Hallo ${userName},</p>
              <div style="background-color:#E3F9E8;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#1C6A2E;font-size:15px;font-weight:600;margin:0;">✓ Deine Ausleihe wurde bestätigt.</p>
              </div>
              <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Buch</p>
                <p style="color:#1C1C1E;font-size:17px;font-weight:600;margin:0 0 2px;">${bookTitle}</p>
                <p style="color:#3A3A3C;font-size:14px;margin:0 0 16px;">${bookAuthor}</p>
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Ausgeliehen am</p>
                <p style="color:#1C1C1E;font-size:14px;font-weight:500;margin:0 0 12px;">${borrowedAtFormatted}</p>
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Rückgabe bis</p>
                <p style="color:#1C1C1E;font-size:15px;font-weight:700;margin:0;">${dueDateFormatted}</p>
              </div>
              <div style="text-align:center;margin-bottom:16px;">
                <a href="${process.env.NEXTAUTH_URL}/my-loans"
                   style="display:inline-block;background-color:#007AFF;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Meine Ausleihen ansehen
                </a>
              </div>

              <!-- Calendar buttons -->
              <div style="text-align:center;">
                <p style="color:#8E8E93;font-size:13px;margin:0 0 12px;">Rückgabetermin zum Kalender hinzufügen:</p>
                <a href="${googleCalendarUrl(bookTitle, dueDate, schoolName)}"
                   target="_blank"
                   style="display:inline-block;background-color:#34A853;color:#FFFFFF;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;text-decoration:none;margin:0 4px;">
                  Google Kalender
                </a>
                <a href="cid:calendar.ics"
                   style="display:inline-block;background-color:#0078D4;color:#FFFFFF;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;text-decoration:none;margin:0 4px;">
                  Outlook / Apple Kalender
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F2F2F7;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="color:#8E8E93;font-size:13px;margin:0;">
                Diese E-Mail wurde automatisch von der Bibliothek ${schoolName} gesendet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const icsContent = generateIcs(bookTitle, bookAuthor, dueDate, schoolName);

  await transporter.sendMail({
    from: `"Schulbibliothek ${schoolName}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "Rueckgabe.ics",
        content: icsContent,
        contentType: "text/calendar; charset=utf-8; method=PUBLISH",
        cid: "calendar.ics",
      },
    ],
  });
}

// ─── Reservation Available ───────────────────────────────────────────────────

interface ReservationAvailableData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  bookId: string;
  schoolName: string;
}

export async function sendReservationAvailableEmail(data: ReservationAvailableData) {
  const { to, userName, bookTitle, bookAuthor, bookId, schoolName } = data;

  const subject = `Buch wieder verfügbar: „${bookTitle}"`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;border-bottom:1px solid #F2F2F7;">
              <img src="${process.env.NEXTAUTH_URL}/logo.svg" alt="Schule Dietlikon" style="height:32px;width:auto;margin-bottom:12px;" />
              <p style="color:#8E8E93;font-size:13px;margin:0;">Bibliothek · ${schoolName}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;">
              <p style="color:#1C1C1E;font-size:16px;margin:0 0 24px;">Hallo ${userName},</p>
              <div style="background-color:#FFF9E6;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#7A5C00;font-size:15px;font-weight:600;margin:0;">🎉 Das von dir reservierte Buch ist jetzt verfügbar!</p>
              </div>
              <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Buch</p>
                <p style="color:#1C1C1E;font-size:17px;font-weight:600;margin:0 0 2px;">${bookTitle}</p>
                <p style="color:#3A3A3C;font-size:14px;margin:0;">${bookAuthor}</p>
              </div>
              <p style="color:#3A3A3C;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Besuche die Bibliothek um das Buch auszuleihen. Die Reservierung wird automatisch entfernt, sobald jemand anderes das Buch ausleiht.
              </p>
              <div style="text-align:center;">
                <a href="${process.env.NEXTAUTH_URL}/books/${bookId}"
                   style="display:inline-block;background-color:#007AFF;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Zum Buch
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F2F2F7;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="color:#8E8E93;font-size:13px;margin:0;">
                Diese E-Mail wurde automatisch von der Bibliothek ${schoolName} gesendet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Schulbibliothek ${schoolName}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
