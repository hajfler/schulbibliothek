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
            <td style="background-color:#007AFF;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">📚</div>
              <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0;">${schoolName}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:4px 0 0;">Schulbibliothek</p>
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
                Diese E-Mail wurde automatisch von der Schulbibliothek ${schoolName} gesendet.
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
