import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { message } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Nachricht ist leer" }, { status: 400 });
  }

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      book: { select: { title: true, author: true } },
    },
  });

  if (!loan || !loan.user.email) {
    return NextResponse.json({ error: "Ausleihe nicht gefunden" }, { status: 404 });
  }

  const senderName = session.user?.name ?? "Bibliothek";
  const senderEmail = session.user?.email;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F7;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;border-bottom:1px solid #F2F2F7;">
            <img src="${process.env.NEXTAUTH_URL}/logo.svg" alt="Schule Dietlikon" style="height:32px;width:auto;margin-bottom:8px;" />
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:40px;">
            <p style="color:#1C1C1E;font-size:16px;margin:0 0 20px;">Hallo ${loan.user.name ?? ""},</p>
            <div style="background-color:#F2F2F7;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#8E8E93;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;">Betreffendes Buch</p>
              <p style="color:#1C1C1E;font-size:16px;font-weight:600;margin:0 0 2px;">${loan.book.title}</p>
              <p style="color:#3A3A3C;font-size:14px;margin:0;">${loan.book.author}</p>
            </div>
            <p style="color:#3A3A3C;font-size:15px;line-height:1.7;margin:0 0 24px;white-space:pre-wrap;">${message.trim()}</p>
            <p style="color:#8E8E93;font-size:14px;margin:0;">Mit freundlichen Grüssen<br><strong style="color:#1C1C1E;">${senderName}</strong><br>Bibliothek</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F2F2F7;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <a href="${process.env.NEXTAUTH_URL}/my-loans" style="color:#007AFF;font-size:13px;text-decoration:none;">Meine Ausleihen ansehen</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await transporter.sendMail({
    from: `"Bibliothek" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    replyTo: senderEmail ? `"${senderName}" <${senderEmail}>` : undefined,
    to: loan.user.email,
    subject: `Nachricht zur Ausleihe: "${loan.book.title}"`,
    html,
  });

  return NextResponse.json({ success: true });
}
