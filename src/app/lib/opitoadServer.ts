// Serveris: eelseisev õpituba jagamise eelvaate (Facebook, Messenger jne) jaoks.
// Kasutab avalikku vaadet, seega piisab avalikust võtmest.
import type { WorkshopPublic } from "../../../types/supabase";
import { formatDate, formatPrice, formatTime, hasStarted, splitLines } from "./opitoad";

async function queryWorkshops(params: Record<string, string>): Promise<WorkshopPublic[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/workshops_public?${new URLSearchParams({ select: "*", ...params })}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    return res.ok ? ((await res.json()) as WorkshopPublic[]) : [];
  } catch {
    return [];
  }
}

export async function getNextWorkshop(): Promise<WorkshopPublic | null> {
  const list = await queryWorkshops({
    starts_at: `gte.${new Date().toISOString()}`,
    order: "starts_at.asc",
    limit: "5",
  });
  // Eelistame õpituba, kuhu saab veel registreeruda
  return list.find(isOpen) ?? list[0] ?? null;
}

export async function getWorkshopById(id: string): Promise<WorkshopPublic | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const list = await queryWorkshops({ id: `eq.${id}`, limit: "1" });
  return list[0] ?? null;
}

export function isOpen(w: WorkshopPublic) {
  return w.status === "published" && w.seats_left > 0 && !hasStarted(w.starts_at);
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
  const seats = isOpen(w)
    ? `Vabu kohti ${w.seats_left}/${w.capacity} – registreeru!`
    : hasStarted(w.starts_at)
      ? "Õpituba on toimunud – pane end järgmise õpitoa huviliseks."
      : "Kohad on täis – pane end huviliste nimekirja.";
  return [
    `${formatDate(w.starts_at)} kell ${formatTime(w.starts_at)}, ${w.location}.`,
    `Hind ${formatPrice(w.price_eur)} (${w.payment_note.toLowerCase()})${includes ? `, hinna sees: ${includes.toLowerCase()}` : ""}.`,
    seats,
  ]
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
