// Õpitoa lisamine kalendrisse: Google'i kalendri link ja .ics fail (iPhone, Mac, Outlook, Android)
import { formatPrice, splitLines } from "./opitoad";
import { SITE_URL } from "./emailTemplates";

type CalendarWorkshop = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_text: string;
  location: string;
  price_eur: number;
  payment_note: string;
  includes: string;
};

const DEFAULT_HOURS = 3;

// Kestus tekstist ("umbes 4 tundi", "2,5 h"), muidu 3 tundi
export function workshopEndIso(w: Pick<CalendarWorkshop, "starts_at" | "duration_text">) {
  const m = w.duration_text.match(/(\d+(?:[.,]\d+)?)\s*(?:h\b|tund)/i);
  const hours = m ? Math.min(12, Math.max(0.5, Number(m[1].replace(",", ".")))) : DEFAULT_HOURS;
  return new Date(new Date(w.starts_at).getTime() + hours * 3600_000).toISOString();
}

// 2026-11-28T10:00:00.000Z -> 20261128T100000Z
function calStamp(iso: string) {
  // Andmebaas annab "+00:00" kujul – teisendame alati UTC "Z" kujule
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Eesti aeg kalendri jaoks: 2026-11-28T10:00:00Z -> 20261128T120000 (Europe/Tallinn)
function tallinnStamp(iso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Tallinn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

// Eesti ajavöönd (talveaeg EET +2, suveaeg EEST +3)
const VTIMEZONE_TALLINN = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Tallinn",
  "BEGIN:STANDARD",
  "DTSTART:19701025T040000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:EET",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:EEST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

function details(w: CalendarWorkshop) {
  const includes = splitLines(w.includes);
  return [
    w.description,
    `Hind: ${formatPrice(w.price_eur)} – ${w.payment_note}`,
    includes.length ? `Hinna sees: ${includes.join(", ")}` : "",
    `${SITE_URL}/opitoad/${w.id}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function googleCalendarUrl(w: CalendarWorkshop) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${w.title} – Sörve Villaveski`,
    dates: `${tallinnStamp(w.starts_at)}/${tallinnStamp(workshopEndIso(w))}`,
    details: details(w),
    location: w.location,
    ctz: "Europe/Tallinn",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function icsUrl(id: string) {
  return `${SITE_URL}/api/opitoad/kalender/${id}`;
}

function icsEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// RFC 5545: read max 75 baiti, jätkurida algab tühikuga
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest, "utf8") > 74) {
    let cut = 74;
    while (Buffer.byteLength(rest.slice(0, cut), "utf8") > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(w: CalendarWorkshop) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sorve Villaveski//Opitoad//ET",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_TALLINN,
    "BEGIN:VEVENT",
    `UID:opituba-${w.id}@villaveski.ee`,
    `DTSTAMP:${calStamp(new Date().toISOString())}`,
    `DTSTART;TZID=Europe/Tallinn:${tallinnStamp(w.starts_at)}`,
    `DTEND;TZID=Europe/Tallinn:${tallinnStamp(workshopEndIso(w))}`,
    `SUMMARY:${icsEscape(`${w.title} – Sörve Villaveski`)}`,
    `LOCATION:${icsEscape(w.location)}`,
    `DESCRIPTION:${icsEscape(details(w))}`,
    `URL:${SITE_URL}/opitoad/${w.id}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(`Homme: ${w.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
