import { NextResponse } from "next/server";
import { getAdminUser, getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildEmail, sendMail } from "../../../lib/mail";
import type { WorkshopRegistration } from "../../../../../types/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_RECIPIENTS = 150; // EmailJS tasuta pakett: 200 kirja kuus kokku
const SEND_GAP_MS = 1100; // EmailJS lubab ~1 kirja sekundis

// Huvilised, kellele uuest õpitoast teada anda: unikaalsed e-postid huviliste nimekirjast,
// v.a need, kes on sellele õpitoale juba ootel või kinnitatud
async function getAnnounceRecipients(workshopId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: waitlist }, { data: active }] = await Promise.all([
    supabase
      .from("workshop_registrations")
      .select("*")
      .eq("status", "waitlist")
      .order("created_at", { ascending: false }),
    supabase
      .from("workshop_registrations")
      .select("email")
      .eq("workshop_id", workshopId)
      .in("status", ["pending", "confirmed"]),
  ]);
  const taken = new Set((active ?? []).map((r) => r.email.toLowerCase()));
  const byEmail = new Map<string, WorkshopRegistration>();
  for (const r of waitlist ?? []) {
    const key = r.email.toLowerCase();
    if (!taken.has(key) && !byEmail.has(key)) byEmail.set(key, r);
  }
  return [...byEmail.values()];
}

export async function POST(request: Request) {
  let user;
  try {
    user = await getAdminUser(request);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server pole seadistatud." }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: "Logi uuesti sisse." }, { status: 401 });

  const { workshopId, dryRun } = (await request.json().catch(() => ({}))) as { workshopId?: string; dryRun?: boolean };
  if (!workshopId || !/^[0-9a-f-]{36}$/i.test(workshopId)) {
    return NextResponse.json({ error: "Vigane päring." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: workshop } = await supabase.from("workshops").select("*").eq("id", workshopId).maybeSingle();
  if (!workshop) return NextResponse.json({ error: "Õpituba ei leitud." }, { status: 404 });
  if (workshop.status !== "published" || new Date(workshop.starts_at) <= new Date()) {
    return NextResponse.json(
      { error: "Teavitada saab ainult avalikust õpitoast, mis pole veel alanud ja kus registreerimine on avatud." },
      { status: 400 }
    );
  }

  const recipients = await getAnnounceRecipients(workshopId);
  if (dryRun) {
    return NextResponse.json({
      recipients: recipients.map((r) => ({ name: r.name, email: r.email })),
      announcedAt: workshop.announced_at,
      announcedCount: workshop.announced_count,
    });
  }
  if (recipients.length === 0) return NextResponse.json({ error: "Huviliste nimekiri on tühi." }, { status: 400 });
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Korraga saab saata kuni ${MAX_RECIPIENTS} kirja.` }, { status: 400 });
  }

  let sent = 0;
  const failed: string[] = [];
  for (const [i, reg] of recipients.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, SEND_GAP_MS));
    try {
      const mail = await buildEmail("new_workshop_announcement", { workshop, reg });
      await sendMail(reg.email, mail.subject, mail.html);
      sent += 1;
    } catch (err) {
      console.error("Teavituskiri ebaõnnestus", reg.email, err);
      failed.push(reg.email);
    }
  }

  await supabase
    .from("workshops")
    .update({ announced_at: new Date().toISOString(), announced_count: sent })
    .eq("id", workshopId);

  return NextResponse.json({ sent, failed });
}
