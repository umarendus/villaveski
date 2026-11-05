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
export function fromLocalInput(value: string) {
  const asUtc = new Date(`${value}:00Z`);
  const tallinn = new Date(asUtc.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = tallinn.getTime() - utc.getTime();
  return new Date(asUtc.getTime() - offsetMs).toISOString();
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
