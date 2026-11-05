// E-kirjade mallid Villaveski kujundusega. Puhas moodul (ilma serveri sõltuvusteta),
// et halduse leht saaks sama koodiga kirja eelvaadet näidata.
// Haldur muudab tekste (teema, pealkiri, sissejuhatus, nupp, lõpp); kujundus, õpitoa andmed ja
// nuppude lingid on fikseeritud, et kiri ei saaks katki minna.
import type { Workshop, WorkshopRegistration } from "../../../types/supabase";
import { formatDate, formatPrice, formatTime, splitLines } from "./opitoad";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.villaveski.ee").replace(/\/$/, "");

const ACCENT = "#be9f7a";

export type TemplateKey =
  | "registration_received"
  | "registration_confirmed"
  | "waitlist_received"
  | "registration_removed"
  | "admin_new_registration"
  | "admin_new_waitlist"
  | "admin_general_waitlist"
  | "admin_registration_removed";

export type TemplateTexts = {
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  button_label: string;
  outro: string;
};

export type EmailData = {
  workshop: Workshop | null;
  reg: WorkshopRegistration;
  seatsLeft?: number;
  note?: string;
  removedBy?: string;
  participantNotified?: boolean;
};

const SIGNATURE = "Villaste tervitustega\n**Egon ja Merike**\nSörve Villaveski";

export const TEMPLATE_DEFS: Record<
  TemplateKey,
  {
    label: string;
    recipient: "Osalejale" | "Haldurile";
    when: string;
    required: string[]; // muutujad, mis peavad mallis kindlasti olema
    extra?: string[]; // lisaks üldistele selles mallis kasutatavad muutujad
    defaults: TemplateTexts;
  }
> = {
  registration_received: {
    label: "Registreering saabunud",
    recipient: "Osalejale",
    when: "Kohe pärast registreerimisvormi saatmist, kui kohti on vabu.",
    required: ["{nimi}", "{opituba}"],
    defaults: {
      subject: "Täname registreerumast – {opituba}",
      preheader: "Saime sinu registreeringu kätte. Anname kinnituse peagi.",
      heading: "Saime sinu registreeringu kätte!",
      intro:
        "Tere, {nimi}!\n\nAitäh, et soovid meiega kaasa lüüa. Sinu registreering on kenasti kohale jõudnud ja koht on sulle esialgu hoitud. Vaatame selle üle ning saadame sulle peagi eraldi kinnituskirja.",
      button_label: "Vaata õpitoa infot",
      outro: `Küsimuste korral vasta lihtsalt sellele kirjale.\n\n${SIGNATURE}`,
    },
  },
  registration_confirmed: {
    label: "Osalemine kinnitatud",
    recipient: "Osalejale",
    when: "Kui haldur vajutab registreeringu juures „Kinnita“.",
    required: ["{nimi}", "{opituba}", "{kuupaev}", "{kellaaeg}"],
    defaults: {
      subject: "Oled kinnitatud! {opituba} – {kuupaev}",
      preheader: "Ootame sind {kuupaev} kell {kellaaeg}.",
      heading: "Sinu koht on kinnitatud!",
      intro:
        "Tere, {nimi}!\n\nSuur rõõm teatada – sinu koht õpitoas on **kinnitatud**. Ootame sind väga Lepiku tallu, kus villa lõhn, soe tee ja hea seltskond juba ootavad.",
      button_label: "Vaata õpitoa infot",
      outro: `Riietu mugavalt ning võta kaasa hea tuju – kõik muu on meie poolt olemas. Tasumine toimub kohapeal.\n\nKui sinu plaanid muutuvad, anna palun meile teada, vastates sellele kirjale – nii saame koha pakkuda järgmisele huvilisele.\n\nKohtumiseni!\n**Egon ja Merike**\nSörve Villaveski`,
    },
  },
  waitlist_received: {
    label: "Huviliste nimekirja lisatud",
    recipient: "Osalejale",
    when: "Kui kohad on täis, registreerimine suletud või avatud õpituba puudub.",
    required: ["{nimi}", "{pohjus}"],
    extra: ["{pohjus}"],
    defaults: {
      subject: "Oled meie huviliste nimekirjas – Sörve Villaveski",
      preheader: "Anname märku, kui avame uue õpitoa.",
      heading: "Paneme sind kirja!",
      intro:
        "Tere, {nimi}!\n\nAitäh huvi eest! {pohjus} Lisasime sind huviliste nimekirja ja kui avame uue õpitoa, anname sulle esimesena teada.",
      button_label: "Vaata õpitubasid",
      outro: SIGNATURE,
    },
  },
  registration_removed: {
    label: "Osaleja eemaldatud",
    recipient: "Osalejale",
    when: "Kui haldur eemaldab osaleja õpitoast ja jätab teavituse sisse.",
    required: ["{nimi}", "{opituba}"],
    defaults: {
      subject: "Sind eemaldati õpitoast – {opituba}",
      preheader: "Sinu registreering õpitoale {opituba} on tühistatud.",
      heading: "Sinu registreering on tühistatud",
      intro:
        "Tere, {nimi}!\n\nAnname teada, et sinu registreering õpitoale **{opituba}** on tühistatud ja sind on osalejate nimekirjast eemaldatud.",
      button_label: "Registreeru uuesti",
      outro: `Kui soovid siiski osaleda või registreeruda mõnele järgmisele õpitoale, vajuta ülaloleval nupul. Kui arvad, et tegemist on eksitusega, vasta lihtsalt sellele kirjale.\n\n${SIGNATURE}`,
    },
  },
  admin_new_registration: {
    label: "Uus registreering",
    recipient: "Haldurile",
    when: "Kui keegi registreerub vabale kohale.",
    required: ["{nimi}", "{opituba}", "{vabu_kohti}"],
    defaults: {
      subject: "Uus registreering: {nimi} – {opituba} (vabu kohti {vabu_kohti})",
      preheader: "{nimi} registreerus. Vabu kohti alles: {vabu_kohti} / {kohti_kokku}",
      heading: "Uus registreering",
      intro: "Registreering ootab sinu kinnitust. Pärast kinnitamist saadetakse osalejale automaatselt kinnituskiri.",
      button_label: "Kinnita osalejad",
      outro: "",
    },
  },
  admin_new_waitlist: {
    label: "Uus huviline (kohad täis)",
    recipient: "Haldurile",
    when: "Kui keegi registreerub täis või suletud õpitoale.",
    required: ["{nimi}", "{opituba}"],
    defaults: {
      subject: "Uus huviline (kohad täis) – {opituba}",
      preheader: "{nimi} soovib tulla, kuid kohad on täis.",
      heading: "Uus huviline järjekorras",
      intro: "Kohad on täis, seega lisasime ta huviliste nimekirja. Uue õpitoa loomisel saad ta sinna tõsta.",
      button_label: "Ava õpitoa haldus",
      outro: "",
    },
  },
  admin_general_waitlist: {
    label: "Uus üldine huviline",
    recipient: "Haldurile",
    when: "Kui avatud õpituba pole ja keegi jätab oma kontaktid.",
    required: ["{nimi}"],
    defaults: {
      subject: "Uus õpitubade huviline: {nimi}",
      preheader: "{nimi} soovib tulevastest õpitubadest teada saada.",
      heading: "Uus huviline",
      intro: "Avatud õpituba hetkel pole, kuid keegi soovib järgmisest õpitoast teada saada.",
      button_label: "Ava õpitubade haldus",
      outro: "",
    },
  },
  admin_registration_removed: {
    label: "Osaleja eemaldati",
    recipient: "Haldurile",
    when: "Alati, kui haldur eemaldab osaleja õpitoast.",
    required: ["{nimi}", "{opituba}", "{vabu_kohti}"],
    extra: ["{eemaldaja}"],
    defaults: {
      subject: "Osaleja eemaldatud: {nimi} – {opituba} (vabu kohti {vabu_kohti})",
      preheader: "{nimi} eemaldati õpitoast. Vabu kohti nüüd: {vabu_kohti} / {kohti_kokku}",
      heading: "Osaleja eemaldati",
      intro: "Vabanenud kohad on lehel taas registreerimiseks avatud. Huviliste nimekirjast saad kellegi õpitoale tõsta.",
      button_label: "Ava õpitoa haldus",
      outro: "",
    },
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATE_DEFS) as TemplateKey[];

export const PLACEHOLDERS: { token: string; label: string; special?: boolean }[] = [
  { token: "{nimi}", label: "Registreerija nimi" },
  { token: "{email}", label: "Registreerija e-post" },
  { token: "{osalejaid}", label: "Osalejate arv" },
  { token: "{opituba}", label: "Õpitoa nimi" },
  { token: "{kuupaev}", label: "Kuupäev" },
  { token: "{kellaaeg}", label: "Kellaaeg" },
  { token: "{koht}", label: "Toimumiskoht" },
  { token: "{hind}", label: "Hind" },
  { token: "{vabu_kohti}", label: "Vabu kohti" },
  { token: "{kohti_kokku}", label: "Kohti kokku" },
  { token: "{pohjus}", label: "Huviliste nimekirja põhjus", special: true },
  { token: "{eemaldaja}", label: "Kes eemaldas", special: true },
];

// Mallis kasutatavad muutujad: üldised + malli eripärased
export function availablePlaceholders(key: TemplateKey) {
  const extra = TEMPLATE_DEFS[key].extra ?? [];
  return PLACEHOLDERS.filter((p) => !p.special || extra.includes(p.token));
}

export const TEXT_FIELDS: (keyof TemplateTexts)[] = ["subject", "preheader", "heading", "intro", "button_label", "outro"];

// Kontroll enne salvestamist (brauseris ja serveris sama loogika)
export function validateTemplate(key: TemplateKey, texts: TemplateTexts) {
  const errors: string[] = [];
  const all = TEXT_FIELDS.map((f) => texts[f] ?? "").join("\n");
  const missing = TEMPLATE_DEFS[key].required.filter((t) => !all.includes(t));
  if (missing.length) errors.push(`Puuduvad kohustuslikud muutujad: ${missing.join(", ")}`);
  const allowed = new Set(availablePlaceholders(key).map((p) => p.token));
  const unknown = [...new Set(all.match(/\{[^{}\s]*\}/g) ?? [])].filter((t) => !allowed.has(t));
  if (unknown.length) errors.push(`Tundmatud muutujad: ${unknown.join(", ")}`);
  if (!texts.subject.trim()) errors.push("Teema ei tohi olla tühi.");
  if (!texts.heading.trim()) errors.push("Pealkiri ei tohi olla tühi.");
  if (!texts.button_label.trim()) errors.push("Nupu tekst ei tohi olla tühi.");
  if (TEXT_FIELDS.some((f) => (texts[f] ?? "").length > 5000)) errors.push("Tekst on liiga pikk.");
  return { missing, errors };
}

// ---------------------------------------------------------------------------
// Abifunktsioonid
// ---------------------------------------------------------------------------
function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeholderValues(d: EmailData): Record<string, string> {
  const w = d.workshop;
  const seatsLeft = d.seatsLeft ?? 0;
  const pohjus = !w
    ? "Hetkel ei ole meil avatud õpitubasid."
    : seatsLeft > 0
      ? `Õpitoa ${w.title} (${formatDate(w.starts_at)}) registreerimine on kahjuks suletud.`
      : `Õpitoa ${w.title} (${formatDate(w.starts_at)}) kohad on kahjuks juba täis.`;
  return {
    nimi: d.reg.name,
    email: d.reg.email,
    osalejaid: String(d.reg.participants),
    opituba: w?.title ?? "õpituba",
    kuupaev: w ? formatDate(w.starts_at) : "",
    kellaaeg: w ? formatTime(w.starts_at) : "",
    koht: w?.location ?? "",
    hind: w ? formatPrice(w.price_eur) : "",
    vabu_kohti: String(seatsLeft),
    kohti_kokku: String(w?.capacity ?? ""),
    pohjus,
    eemaldaja: d.removedBy ?? "",
  };
}

// Lihttekst (teema, eelvaate rida): ainult kohatäited
function fillPlain(text: string, values: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m));
}

// Sisutekst: kohatäited, **paks**, tühi rida = uus lõik, reavahetus = <br>
function fillRich(text: string, values: Record<string, string>) {
  if (!text.trim()) return "";
  const html = esc(fillPlain(text, values)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return html
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px;">${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

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

function button(href: string, label: string, variant: "primary" | "secondary" = "primary") {
  if (!label.trim()) return "";
  const primary = variant === "primary";
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:${primary ? "28px" : "12px"} auto ${primary ? "24px" : "8px"};">
<tr><td style="background:${primary ? "#000" : "#fff"};border:2px solid #000;border-radius:999px;">
<a href="${esc(href)}" style="display:inline-block;padding:12px 32px;font-family:Raleway,Arial,sans-serif;font-weight:700;font-size:15px;color:${primary ? "#fff" : "#000"};text-decoration:none;border-radius:999px;">${esc(label)}</a>
</td></tr></table>`;
}

function mailtoButton(email: string, label: string, subject: string) {
  return button(`mailto:${email}?subject=${encodeURIComponent(subject)}`, label, "secondary");
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
    .map((p) => `${esc(p.name)}${p.email ? ` · ${esc(p.email)}` : ""}${p.phone ? ` · ${esc(p.phone)}` : ""}`)
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
<ul style="margin:0 0 16px;padding-left:20px;">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function seatsBadge(seatsLeft: number, capacity: number | string) {
  return `<div style="text-align:center;margin:8px 0 24px;">
  <div style="font-family:'Abril Fatface',Georgia,serif;font-size:56px;line-height:1;color:#000;">${esc(seatsLeft)}</div>
  <div style="font-family:Raleway,Arial,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:${ACCENT};">vaba kohta ${esc(capacity)}-st</div>
</div>`;
}

function adminRegistrationRows(d: EmailData): [string, string][] {
  const { reg: r, workshop: w } = d;
  return [
    ["Nimi", `<strong>${esc(r.name)}</strong>`],
    ["E-post", esc(r.email)],
    ["Telefon", esc(r.phone || "–")],
    ["Osalejaid", participantsHtml(r)],
    ["Materjalid juurde", r.wants_materials ? "Jah, soovib osta" : "Ei"],
    ["Sõnum", esc(r.message || "–").replace(/\n/g, "<br>")],
    ...(w
      ? ([["Õpituba", `${esc(w.title)} · ${esc(formatDate(w.starts_at))} kell ${esc(formatTime(w.starts_at))}`]] as [
          string,
          string,
        ][])
      : []),
  ];
}

// ---------------------------------------------------------------------------
// Kirja koostamine
// ---------------------------------------------------------------------------
export function renderEmail(key: TemplateKey, texts: TemplateTexts, d: EmailData) {
  const v = placeholderValues(d);
  const w = d.workshop;
  const r = d.reg;
  const intro = fillRich(texts.intro, v);
  const outro = fillRich(texts.outro, v);
  const label = fillPlain(texts.button_label, v);
  const seatsLeft = d.seatsLeft ?? 0;
  const haldus = w ? `${SITE_URL}/opitoad/haldus/${w.id}` : `${SITE_URL}/opitoad/haldus`;

  let body = "";
  let image: string | null = null;

  switch (key) {
    case "registration_received":
      image = w?.image_url ?? null;
      body = `${intro}${w ? detailsTable([...workshopRows(w), ["Osalejaid", participantsHtml(r)]]) : ""}${button(`${SITE_URL}/opitoad`, label)}${outro}`;
      break;
    case "registration_confirmed":
      image = w?.image_url ?? null;
      body = `${intro}${w ? detailsTable([...workshopRows(w), ["Osalejaid", participantsHtml(r)]]) : ""}${w ? includesList(w) : ""}${
        w?.extras ? `<p style="margin:0 0 16px;">${esc(w.extras)}</p>` : ""
      }${button(`${SITE_URL}/opitoad`, label)}${outro}`;
      break;
    case "waitlist_received":
      image = w?.image_url ?? null;
      body = `${intro}${button(`${SITE_URL}/opitoad`, label)}${outro}`;
      break;
    case "registration_removed":
      image = w?.image_url ?? null;
      body = `${intro}${
        d.note
          ? `<p style="background:#f7f4ef;border-left:3px solid ${ACCENT};padding:12px 16px;margin:0 0 16px;">${esc(d.note).replace(/\n/g, "<br>")}</p>`
          : ""
      }${w ? detailsTable([...workshopRows(w), ["Osalejaid", participantsHtml(r)]]) : ""}${button(`${SITE_URL}/opitoad#registreeru`, label)}${outro}`;
      break;
    case "admin_new_registration":
    case "admin_new_waitlist":
      body = `${w ? seatsBadge(seatsLeft, w.capacity) : ""}${intro}${detailsTable(adminRegistrationRows(d))}${button(haldus, label)}${mailtoButton(
        r.email,
        "Kirjuta osalejale",
        w?.title ?? "Sörve Villaveski õpituba"
      )}${outro}`;
      break;
    case "admin_general_waitlist":
      body = `${intro}${detailsTable(adminRegistrationRows(d))}${button(`${SITE_URL}/opitoad/haldus`, label)}${mailtoButton(
        r.email,
        "Kirjuta huvilisele",
        "Sörve Villaveski õpitoad"
      )}${outro}`;
      break;
    case "admin_registration_removed":
      body = `${w ? seatsBadge(seatsLeft, w.capacity) : ""}${detailsTable([
        ...adminRegistrationRows(d).filter(([k]) => k !== "Materjalid juurde" && k !== "Sõnum"),
        ["Eemaldaja", esc(d.removedBy || "–")],
        ["Sõnum osalejale", esc(d.note || "–").replace(/\n/g, "<br>")],
        ["Osalejat teavitati", d.participantNotified ? "Jah, e-kirjaga" : "Ei"],
      ])}${intro}${button(haldus, label)}${mailtoButton(r.email, "Kirjuta osalejale", w?.title ?? "Õpituba")}${outro}`;
      break;
  }

  return {
    subject: fillPlain(texts.subject, v),
    html: layout({ preheader: fillPlain(texts.preheader, v), heading: fillPlain(texts.heading, v), body, image }),
  };
}

// Näidisandmed eelvaate ja testkirja jaoks
export function sampleEmailData(workshop?: Workshop | null): EmailData {
  const w: Workshop = workshop ?? {
    id: "naidis",
    title: "Tapikangaspuu õpituba",
    description: "",
    starts_at: "2026-11-28T10:00:00Z",
    duration_text: "",
    location: "Lepiku talu, Lõu küla, Saaremaa",
    price_eur: 30,
    payment_note: "Maksmine kohapeal",
    includes: "Õpetus ja juhendamine\nTee ja kohv\n40 × 90 cm villavaip, mille oled ise teinud",
    extras: "Tapikangaspuid ja villavorsti saab soovi korral ka eraldi juurde osta.",
    capacity: 7,
    reserved_offline: 2,
    image_url: "/opitoad/tapikangaspuu.webp",
    status: "published",
    created_at: "",
    updated_at: "",
  };
  return {
    workshop: w,
    reg: {
      id: "naidis",
      workshop_id: w.id,
      name: "Mari Maasikas",
      email: "mari@näide.ee",
      phone: "+372 5555 5555",
      participants: 2,
      extra_participants: [{ name: "Jaan Tamm", email: "", phone: "" }],
      wants_materials: true,
      message: "Kas koera võib kaasa võtta?",
      status: "pending",
      ip_hash: null,
      created_at: "",
      confirmed_at: null,
    },
    seatsLeft: 3,
    note: "Saame aru, et jäid haigeks – kosu kiiresti! Ootame sind järgmisesse õpituppa.",
    removedBy: "egon.sepp@gmail.com",
    participantNotified: true,
  };
}
