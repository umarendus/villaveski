// AINULT serveris: e-kirjade saatmine (SMTP). Mallid on failis emailTemplates.ts,
// halduri muudetud tekstid tulevad tabelist email_templates.
import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { TEMPLATE_DEFS, renderEmail, type EmailData, type TemplateKey, type TemplateTexts } from "./emailTemplates";

export { SITE_URL } from "./emailTemplates";
export const ADMIN_EMAIL = process.env.WORKSHOP_ADMIN_EMAIL || "saaremaalong@gmail.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP_HOST, SMTP_USER või SMTP_PASS puudub");
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

// Kaks võimalust: EmailJS (sama konto mis avalehe kontaktivormil) või mistahes SMTP teenus.
// Kasutab olemasolevat EmailJS teenust ja avalikku võtit; privaatvõti on vajalik ainult siis,
// kui EmailJS-is on "Use Private Key" sisse lülitatud.
// EmailJS mall peab sisaldama: To = {{to_email}}, Subject = {{subject}}, Reply-To = {{reply_to}}, sisu = {{{html}}}
const EMAILJS_TEMPLATE = process.env.EMAILJS_HTML_TEMPLATE_ID;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

async function sendViaEmailJs(to: string, subject: string, html: string, replyTo: string) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE,
      user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      ...(EMAILJS_PRIVATE_KEY ? { accessToken: EMAILJS_PRIVATE_KEY } : {}),
      template_params: { to_email: to, subject, html, reply_to: replyTo },
    }),
  });
  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
}

export async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  if (EMAILJS_TEMPLATE) {
    return sendViaEmailJs(to, subject, html, replyTo || ADMIN_EMAIL);
  }
  const from = process.env.MAIL_FROM || `Sörve Villaveski <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject, html, replyTo: replyTo || ADMIN_EMAIL });
}

// Halduri muudetud tekstid; puuduvad väljad tulevad vaikimisi mallist
export async function loadTemplateTexts(key: TemplateKey): Promise<TemplateTexts> {
  const defaults = TEMPLATE_DEFS[key].defaults;
  try {
    const { data } = await getSupabaseAdmin().from("email_templates").select("*").eq("key", key).maybeSingle();
    if (!data) return defaults;
    return {
      subject: data.subject || defaults.subject,
      preheader: data.preheader ?? defaults.preheader,
      heading: data.heading || defaults.heading,
      intro: data.intro ?? defaults.intro,
      button_label: data.button_label || defaults.button_label,
      outro: data.outro ?? defaults.outro,
    };
  } catch (err) {
    console.error("E-kirja malli laadimine ebaõnnestus, kasutan vaikimisi teksti", err);
    return defaults;
  }
}

export async function buildEmail(key: TemplateKey, data: EmailData) {
  return renderEmail(key, await loadTemplateTexts(key), data);
}
