import nodemailer from "nodemailer";
import { shopConfig } from "@/lib/shop-config";

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const host = process.env.SMTP_HOST;
  if (!host || !to) {
    console.warn("Email skipped: SMTP is not configured.");
    return;
  }

  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER;
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      auth: user ? { user, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || shopConfig().email,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Email failed", error);
  }
}
