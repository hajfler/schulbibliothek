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

// ─── Loan Extension ──────────────────────────────────────────────────────────

interface LoanExtensionData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  newDueDate: Date;
  schoolName: string;
  loanId: string;
}

export async function sendLoanExtensionEmail(data: LoanExtensionData) {
  const { to, userName, bookTitle, bookAuthor, newDueDate, schoolName, loanId } = data;

  const dueDateFormatted = newDueDate.toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const calendarUrl = `${process.env.NEXTAUTH_URL}/api/loans/${loanId}/calendar`;
  const subject = `Ausleihe verlängert: „${bookTitle}"`;

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
                <p style="color:#1C6A2E;font-size:15px;font-weight:600;margin:0;">✓ Deine Ausleihe wurde um 14 Tage verlängert.</p>
              </div>
              <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Buch</p>
                <p style="color:#1C1C1E;font-size:17px;font-weight:600;margin:0 0 2px;">${bookTitle}</p>
                <p style="color:#3A3A3C;font-size:14px;margin:0 0 16px;">${bookAuthor}</p>
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Neues Rückgabedatum</p>
                <p style="color:#1C1C1E;font-size:15px;font-weight:700;margin:0;">${dueDateFormatted}</p>
              </div>
              <div style="text-align:center;margin-bottom:16px;">
                <a href="${process.env.NEXTAUTH_URL}/my-loans"
                   style="display:inline-block;background-color:#007AFF;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Meine Ausleihen ansehen
                </a>
              </div>
              <div style="text-align:center;">
                <a href="${calendarUrl}"
                   style="display:inline-block;background-color:#F2F2F7;color:#1C1C1E;font-size:14px;font-weight:600;padding:10px 24px;border-radius:10px;text-decoration:none;">
                  📅 Zum Kalender hinzufügen
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

// ─── Loan Confirmation ───────────────────────────────────────────────────────

interface LoanConfirmationData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  borrowedAt: Date;
  dueDate: Date;
  schoolName: string;
  loanId: string;
}

export async function sendLoanConfirmationEmail(data: LoanConfirmationData) {
  const { to, userName, bookTitle, bookAuthor, borrowedAt, dueDate, schoolName, loanId } = data;
  const calendarUrl = `${process.env.NEXTAUTH_URL}/api/loans/${loanId}/calendar`;

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

              <div style="text-align:center;">
                <a href="${calendarUrl}"
                   style="display:inline-block;background-color:#F2F2F7;color:#1C1C1E;font-size:14px;font-weight:600;padding:10px 24px;border-radius:10px;text-decoration:none;">
                  📅 Zum Kalender hinzufügen
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

// ─── Loan Return ─────────────────────────────────────────────────────────────

interface LoanReturnData {
  to: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  returnedAt: Date;
  schoolName: string;
}

export async function sendLoanReturnEmail(data: LoanReturnData) {
  const { to, userName, bookTitle, bookAuthor, returnedAt, schoolName } = data;

  const returnedAtFormatted = returnedAt.toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const subject = `Rückgabe bestätigt: „${bookTitle}"`;

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
                <p style="color:#1C6A2E;font-size:15px;font-weight:600;margin:0;">✓ Deine Rückgabe wurde bestätigt.</p>
              </div>
              <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Buch</p>
                <p style="color:#1C1C1E;font-size:17px;font-weight:600;margin:0 0 2px;">${bookTitle}</p>
                <p style="color:#3A3A3C;font-size:14px;margin:0 0 16px;">${bookAuthor}</p>
                <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Zurückgegeben am</p>
                <p style="color:#1C1C1E;font-size:15px;font-weight:700;margin:0;">${returnedAtFormatted}</p>
              </div>
              <div style="text-align:center;">
                <a href="${process.env.NEXTAUTH_URL}/books"
                   style="display:inline-block;background-color:#007AFF;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Weitere Bücher entdecken
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
