// Serveris: eelseisev õpituba jagamise eelvaate (Facebook, Messenger jne) jaoks.
// Kasutab avalikku vaadet, seega piisab avalikust võtmest.
import type { WorkshopPublic } from "../../../types/supabase";
import { formatDate, formatPrice, formatTime, splitLines } from "./opitoad";

export async function getNextWorkshop(): Promise<WorkshopPublic | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const params = new URLSearchParams({
      select: "*",
      starts_at: `gte.${new Date().toISOString()}`,
      order: "starts_at.asc",
      limit: "5",
    });
    const res = await fetch(`${url}/rest/v1/workshops_public?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const list = (await res.json()) as WorkshopPublic[];
    // Eelistame õpituba, kuhu saab veel registreeruda
    return list.find((w) => w.status === "published" && w.seats_left > 0) ?? list[0] ?? null;
  } catch {
    return null;
  }
}

export function isOpen(w: WorkshopPublic) {
  return w.status === "published" && w.seats_left > 0;
}

export function shareTitle(w: WorkshopPublic | null) {
  if (!w) return "Õpitoad | Sörve Villaveski";
  return `${w.title} – ${formatDate(w.starts_at).replace(/^\w/, (c) => c.toUpperCase())} | Sörve Villaveski`;
}

export function shareDescription(w: WorkshopPublic | null) {
  if (!w) {
    return "Tapikangaspuu ja villatöö õpitoad Lepiku talus Saaremaal. Pane end huviliste nimekirja – anname märku, kui avame uue õpitoa.";
  }
  const includes = splitLines(w.includes).join(", ");
  const seats = isOpen(w) ? `Vabu kohti ${w.seats_left}/${w.capacity} – registreeru!` : "Kohad on täis – pane end huviliste nimekirja.";
  return [
    `${formatDate(w.starts_at)} kell ${formatTime(w.starts_at)}, ${w.location}.`,
    `Hind ${formatPrice(w.price_eur)} (${w.payment_note.toLowerCase()})${includes ? `, hinna sees: ${includes.toLowerCase()}` : ""}.`,
    seats,
  ]
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
