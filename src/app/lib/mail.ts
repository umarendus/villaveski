// AINULT serveris: e-kirjade saatmine (SMTP) ja Villaveski kujundusega kirjapõhjad
import nodemailer from "nodemailer";
import type { Workshop, WorkshopRegistration } from "../../../types/supabase";
import { formatDate, formatPrice, formatTime, splitLines } from "./opitoad";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.villaveski.ee").replace(/\/$/, "");
export const ADMIN_EMAIL = process.env.WORKSHOP_ADMIN_EMAIL || "saaremaalong@gmail.com";

const ACCENT = "#be9f7a";

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

export async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  const from = process.env.MAIL_FROM || `Sörve Villaveski <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject, html, replyTo: replyTo || ADMIN_EMAIL });
}

function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Kirjapõhi: valge paber, mustad lambad, Abril-laadne serif pealkiri, kuldne aktsent
// ---------------------------------------------------------------------------
function layout(opts: { preheader: string; heading: string; body: string; image?: string | null }) {
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : `${SITE_URL}${opts.image}`) : null;
  return `<!doctype html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600;700&display=swap" rel="stylesheet">
<title>${esc(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
    <tr><td align="center" style="padding:32px 24px 8px;">
      <img src="${SITE_URL}/icon1.png" width="72" height="72" alt="Sörve Villaveski" style="display:block;border:0;">
    </td></tr>
    <tr><td align="center" style="padding:0 24px 24px;font-family:'Abril Fatface',Georgia,'Times New Roman',serif;color:#000;">
      <div style="font-size:30px;line-height:1.1;letter-spacing:1px;">SÖRVE</div>
      <div style="font-size:18px;line-height:1.2;letter-spacing:2px;">VILLAVESKI</div>
    </td></tr>
    ${
      image
        ? `<tr><td><img src="${esc(image)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;max-height:320px;object-fit:cover;border:0;"></td></tr>`
        : `<tr><td style="border-top:1px solid ${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>`
    }
    <tr><td style="padding:36px 36px 8px;font-family:'Abril Fatface',Georgia,serif;font-size:26px;line-height:1.25;color:#000;text-align:center;">
      ${esc(opts.heading)}
    </td></tr>
    <tr><td style="padding:8px 36px 36px;font-family:Raleway,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.65;color:#222;">
      ${opts.body}
    </td></tr>
    <tr><td align="center" style="background:#000;padding:28px 24px;font-family:Raleway,Arial,sans-serif;font-size:13px;line-height:1.6;color:#d8d2c8;">
      <div style="font-family:'Abril Fatface',Georgia,serif;font-size:16px;color:#fff;letter-spacing:1px;">SÜDA JA HING IGA LÕNGA SEES</div>
      <div style="margin-top:8px;">Sörve Villaveski · Lepiku talu, Lõu küla, Saaremaa</div>
      <div><a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">www.villaveski.ee</a></div>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;">
<tr><td style="background:#000;border-radius:999px;">
<a href="${esc(href)}" style="display:inline-block;padding:14px 34px;font-family:Raleway,Arial,sans-serif;font-weight:700;font-size:15px;color:#fff;text-decoration:none;border-radius:999px;">${esc(label)}</a>
</td></tr></table>`;
}

function detailsTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #e8e2d8;">
${rows
  .map(
    ([k, v]) => `<tr>
<td style="padding:10px 12px 10px 0;border-bottom:1px solid #e8e2d8;font-family:Raleway,Arial,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${ACCENT};white-space:nowrap;vertical-align:top;">${esc(k)}</td>
<td style="padding:10px 0;border-bottom:1px solid #e8e2d8;font-family:Raleway,Arial,sans-serif;font-size:15px;color:#111;">${v}</td>
</tr>`
  )
  .join("")}
</table>`;
}

function participantsHtml(r: WorkshopRegistration) {
  const extras = r.extra_participants ?? [];
  if (!extras.length) return esc(r.participants);
  const list = extras
    .map((p) => `${esc(p.name)}${p.email ? ` · <a href="mailto:${esc(p.email)}" style="color:#000;">${esc(p.email)}</a>` : ""}${p.phone ? ` · ${esc(p.phone)}` : ""}`)
    .join("<br>");
  return `${esc(r.participants)}<br><span style="color:#555;">${esc(r.name)}<br>${list}</span>`;
}

function workshopRows(w: Workshop): [string, string][] {
  return [
    ["Õpituba", `<strong>${esc(w.title)}</strong>`],
    ["Kuupäev", esc(formatDate(w.starts_at))],
    ["Kellaaeg", esc(formatTime(w.starts_at)) + (w.duration_text ? ` · ${esc(w.duration_text)}` : "")],
    ["Koht", esc(w.location)],
    ["Hind", `${esc(formatPrice(w.price_eur))} · ${esc(w.payment_note)}`],
  ];
}

function includesList(w: Workshop) {
  const items = splitLines(w.includes);
  if (!items.length) return "";
  return `<p style="margin:16px 0 6px;"><strong>Hinna sees:</strong></p>
<ul style="margin:0 0 12px;padding-left:20px;">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

// ---------------------------------------------------------------------------
// Kirjad
// ---------------------------------------------------------------------------

// 1) Registreerijale kohe pärast vormi saatmist
export function registrationReceivedEmail(w: Workshop, r: WorkshopRegistration) {
  return {
    subject: `Täname registreerumast – ${w.title}`,
    html: layout({
      preheader: "Saime sinu registreeringu kätte. Anname kinnituse peagi.",
      heading: "Saime sinu registreeringu kätte!",
      image: w.image_url,
      body: `<p>Tere, ${esc(r.name)}!</p>
<p>Aitäh, et soovid meiega kaasa lüüa. Sinu registreering on kenasti kohale jõudnud ja koht on sulle esialgu hoitud. Vaatame selle üle ning saadame sulle peagi eraldi kinnituskirja.</p>
${detailsTable([...workshopRows(w), ["Osalejaid", participantsHtml(r)]])}
<p style="margin-top:20px;">Küsimuste korral vasta lihtsalt sellele kirjale.</p>
<p>Villaste tervitustega<br><strong>Egon ja Merike</strong><br>Sörve Villaveski</p>`,
    }),
  };
}

// 2) Haldurile: uus registreering + link kinnitamislehele
export function adminNewRegistrationEmail(w: Workshop, r: WorkshopRegistration, seatsLeft: number) {
  const waitlist = r.status === "waitlist";
  return {
    subject: waitlist
      ? `Uus huviline (kohad täis) – ${w.title}`
      : `Uus registreering: ${r.name} – ${w.title} (vabu kohti ${seatsLeft})`,
    html: layout({
      preheader: `${r.name} registreerus. Vabu kohti alles: ${seatsLeft} / ${w.capacity}`,
      heading: waitlist ? "Uus huviline järjekorras" : "Uus registreering",
      body: `<div style="text-align:center;margin:8px 0 24px;">
  <div style="font-family:'Abril Fatface',Georgia,serif;font-size:56px;line-height:1;color:#000;">${esc(seatsLeft)}</div>
  <div style="font-family:Raleway,Arial,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:${ACCENT};">vaba kohta ${esc(w.capacity)}-st</div>
</div>
${detailsTable([
  ["Nimi", `<strong>${esc(r.name)}</strong>`],
  ["E-post", `<a href="mailto:${esc(r.email)}" style="color:#000;">${esc(r.email)}</a>`],
  ["Telefon", esc(r.phone || "–")],
  ["Osalejaid", participantsHtml(r)],
  ["Materjalid juurde", r.wants_materials ? "Jah, soovib osta" : "Ei"],
  ["Sõnum", esc(r.message || "–").replace(/\n/g, "<br>")],
  ["Õpituba", `${esc(w.title)} · ${esc(formatDate(w.starts_at))} kell ${esc(formatTime(w.starts_at))}`],
])}
${
  waitlist
    ? `<p>Kohad on täis, seega lisasime ta huviliste nimekirja. Uue õpitoa loomisel saad talle kirjutada.</p>`
    : `<p>Registreering ootab sinu kinnitust. Pärast kinnitamist saadetakse osalejale automaatselt kinnituskiri.</p>`
}
${button(`${SITE_URL}/opitoad/haldus/${w.id}`, waitlist ? "Ava õpitoa haldus" : "Kinnita osalejad")}`,
    }),
  };
}

// 2b) Haldurile: uus huviline üldisesse nimekirja (avatud õpituba puudub)
export function adminGeneralWaitlistEmail(r: WorkshopRegistration) {
  return {
    subject: `Uus õpitubade huviline: ${r.name}`,
    html: layout({
      preheader: `${r.name} soovib tulevastest õpitubadest teada saada.`,
      heading: "Uus huviline",
      body: `<p>Avatud õpituba hetkel pole, kuid keegi soovib järgmisest õpitoast teada saada.</p>
${detailsTable([
  ["Nimi", `<strong>${esc(r.name)}</strong>`],
  ["E-post", `<a href="mailto:${esc(r.email)}" style="color:#000;">${esc(r.email)}</a>`],
  ["Telefon", esc(r.phone || "–")],
  ["Osalejaid", esc(r.participants)],
  ["Sõnum", esc(r.message || "–").replace(/\n/g, "<br>")],
])}
${button(`${SITE_URL}/opitoad/haldus`, "Ava õpitubade haldus")}`,
    }),
  };
}

// 3) Registreerijale pärast halduri kinnitust
export function registrationConfirmedEmail(w: Workshop, r: WorkshopRegistration) {
  const extras = w.extras ? `<p>${esc(w.extras)}</p>` : "";
  return {
    subject: `Oled kinnitatud! ${w.title} – ${formatDate(w.starts_at)}`,
    html: layout({
      preheader: `Ootame sind ${formatDate(w.starts_at)} kell ${formatTime(w.starts_at)}.`,
      heading: "Sinu koht on kinnitatud!",
      image: w.image_url,
      body: `<p>Tere, ${esc(r.name)}!</p>
<p>Suur rõõm teatada – sinu koht õpitoas on <strong>kinnitatud</strong>. Ootame sind väga Lepiku tallu, kus villa lõhn, soe tee ja hea seltskond juba ootavad.</p>
${detailsTable([...workshopRows(w), ["Osalejaid", participantsHtml(r)]])}
${includesList(w)}
${extras}
<p>Riietu mugavalt ning võta kaasa hea tuju – kõik muu on meie poolt olemas. Tasumine toimub kohapeal.</p>
<p>Kui sinu plaanid muutuvad, anna palun meile teada, vastates sellele kirjale – nii saame koha pakkuda järgmisele huvilisele.</p>
<p style="margin-top:24px;">Kohtumiseni!<br><strong>Egon ja Merike</strong><br>Sörve Villaveski</p>`,
    }),
  };
}

// 4) Huvilisele, kui kohad on täis (või üldine huviliste nimekiri)
export function waitlistReceivedEmail(w: Workshop | null, r: WorkshopRegistration, seatsLeft = 0) {
  const reason = !w
    ? "Hetkel ei ole meil avatud õpitubasid, kuid"
    : seatsLeft > 0
      ? `Õpitoa <strong>${esc(w.title)}</strong> (${esc(formatDate(w.starts_at))}) registreerimine on kahjuks suletud, kuid`
      : `Õpitoa <strong>${esc(w.title)}</strong> (${esc(formatDate(w.starts_at))}) kohad on kahjuks juba täis, kuid`;
  return {
    subject: "Oled meie huviliste nimekirjas – Sörve Villaveski",
    html: layout({
      preheader: "Anname märku, kui avame uue õpitoa.",
      heading: "Paneme sind kirja!",
      image: w?.image_url ?? null,
      body: `<p>Tere, ${esc(r.name)}!</p>
<p>Aitäh huvi eest! ${reason} lisasime sind huviliste nimekirja. Kui avame uue õpitoa, anname sulle esimesena teada.</p>
<p>Villaste tervitustega<br><strong>Egon ja Merike</strong><br>Sörve Villaveski</p>`,
    }),
  };
}
