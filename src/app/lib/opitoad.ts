// Õpitubade ühised abifunktsioonid (kasutatakse nii brauseris kui serveris)

const TZ = "Europe/Tallinn";

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("et-EE", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("et-EE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("et-EE", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export function formatPrice(eur: number) {
  return `${Number(eur).toLocaleString("et-EE", { maximumFractionDigits: 2 })} €`;
}

// ISO -> "YYYY-MM-DDTHH:mm" Tallinna ajas (datetime-local välja jaoks)
export function toLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return parts.replace(" ", "T");
}

// "YYYY-MM-DDTHH:mm" Tallinna ajas -> ISO (arvestab suve-/talveaega)
const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

// Tallinna aja nihe UTC suhtes antud hetkel (ei sõltu brauseri ajavööndist)
function tallinnOffsetMs(at: Date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(at).map((x) => [x.type, Number(x.value)]));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

export function fromLocalInput(value: string) {
  const asUtc = new Date(`${value}:00Z`).getTime();
  // Esimene hinnang, siis nihe tegeliku hetke järgi (suve-/talveaja vahetuse ümber)
  const guess = asUtc - tallinnOffsetMs(new Date(asUtc));
  return new Date(asUtc - tallinnOffsetMs(new Date(guess))).toISOString();
}

export function splitLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export const STATUS_LABELS = {
  pending: "Ootab kinnitust",
  confirmed: "Kinnitatud",
  cancelled: "Tühistatud",
  waitlist: "Huviliste nimekiri",
} as const;

export const WORKSHOP_PHOTO_BUCKET = "workshop-photos";

// Tänase päeva algus Tallinna ajas (ISO). Õpituba on lehel nähtav kuni toimumispäeva lõpuni,
// järgmisest päevast kaob.
export function startOfTodayTallinnIso() {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
  return fromLocalInput(`${today}T00:00`);
}

export function hasStarted(iso: string) {
  return new Date(iso).getTime() <= Date.now();
}
