import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { ADMIN_EMAIL, buildEmail, sendMail } from "../../../lib/mail";

export const runtime = "nodejs";

const MIN_FILL_MS = 3000; // inimene ei täida vormi alla 3 sekundi
const MAX_PER_IP_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = {
  workshopId?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  participants?: number;
  extraParticipants?: { name?: string; email?: string; phone?: string }[];
  wantsMaterials?: boolean;
  message?: string;
  consent?: boolean;
  website?: string; // meepott – päris inimene seda välja ei näe
  startedAt?: number;
  turnstileToken?: string;
};

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile pole seadistatud – jäävad meepott, ajakontroll ja IP-piirang
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile kontroll ebaõnnestus", err);
    return false;
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Vigane päring." }, { status: 400 });
  }

  // Robot täitis peidetud välja – vastame "edukalt", et ta edasi ei prooviks
  if (body.website) return NextResponse.json({ status: "pending", seatsLeft: null });

  if (!body.startedAt || Date.now() - Number(body.startedAt) < MIN_FILL_MS) {
    return NextResponse.json({ error: "Vorm saadeti liiga kiiresti. Proovi palun uuesti." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 2000);
  const participants = Math.max(1, Math.min(20, Math.floor(Number(body.participants) || 1)));
  const extraParticipants = (Array.isArray(body.extraParticipants) ? body.extraParticipants : [])
    .slice(0, participants - 1)
    .map((p) => ({ name: clean(p?.name, 120), email: clean(p?.email, 200).toLowerCase(), phone: clean(p?.phone, 40) }));
  const workshopId = body.workshopId ? clean(body.workshopId, 64) : null;

  if (name.length < 2) return NextResponse.json({ error: "Palun sisesta oma nimi." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Palun kontrolli e-posti aadressi." }, { status: 400 });
  if (phone && !/^[+\d\s()-]{5,40}$/.test(phone)) {
    return NextResponse.json({ error: "Palun kontrolli telefoninumbrit." }, { status: 400 });
  }
  if (extraParticipants.length !== participants - 1 || extraParticipants.some((p) => p.name.length < 2)) {
    return NextResponse.json({ error: "Palun sisesta kõigi osalejate nimed." }, { status: 400 });
  }
  if (extraParticipants.some((p) => p.email && !EMAIL_RE.test(p.email))) {
    return NextResponse.json({ error: "Palun kontrolli kaasosaleja e-posti aadressi." }, { status: 400 });
  }
  if (!body.consent) {
    return NextResponse.json({ error: "Palun nõustu andmete töötlemisega." }, { status: 400 });
  }
  // Lingid sõnumis on tüüpiline spämm
  if ((message.match(/https?:\/\//gi) || []).length > 1) {
    return NextResponse.json({ error: "Sõnum ei tohi sisaldada linke." }, { status: 400 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Robotikontroll ebaõnnestus. Värskenda lehte ja proovi uuesti." }, { status: 400 });
  }

  const ipHash = createHash("sha256")
    .update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(-16))
    .digest("hex");

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registreerimine pole hetkel saadaval." }, { status: 503 });
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("workshop_registrations")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return NextResponse.json({ error: "Liiga palju registreeringuid. Proovi hiljem uuesti." }, { status: 429 });
  }

  const { data, error } = await supabase.rpc("register_for_workshop", {
    p_workshop_id: workshopId,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_participants: participants,
    p_wants_materials: Boolean(body.wantsMaterials),
    p_message: message,
    p_ip_hash: ipHash,
    p_extra_participants: extraParticipants,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Selle e-postiga on sellele õpitoale juba registreeritud." }, { status: 409 });
    }
    if (error.message.includes("workshop_not_found")) {
      return NextResponse.json({ error: "Õpituba ei leitud." }, { status: 404 });
    }
    console.error("register_for_workshop", error);
    return NextResponse.json({ error: "Registreerimine ebaõnnestus. Proovi palun uuesti." }, { status: 500 });
  }

  const result = data?.[0];
  if (!result) return NextResponse.json({ error: "Registreerimine ebaõnnestus." }, { status: 500 });

  // Kirjad – kui saatmine ebaõnnestub, jääb registreering siiski kehtima ja on halduse lehel näha
  try {
    const [{ data: reg }, { data: workshop }] = await Promise.all([
      supabase.from("workshop_registrations").select("*").eq("id", result.registration_id).single(),
      workshopId
        ? supabase.from("workshops").select("*").eq("id", workshopId).single()
        : Promise.resolve({ data: null }),
    ]);

    if (reg) {
      const mails: Promise<void>[] = [];
      const waitlistReason = !workshop
        ? undefined
        : workshop.status === "closed"
          ? ("closed" as const)
          : new Date(workshop.starts_at) < new Date()
            ? ("started" as const)
            : result.seats_left > 0
              ? ("group_too_big" as const)
              : ("full" as const);
      const data = { workshop: workshop ?? null, reg, seatsLeft: result.seats_left, waitlistReason };
      const waitlist = result.reg_status === "waitlist";
      const [toUser, toAdmin] = await Promise.all([
        buildEmail(waitlist ? "waitlist_received" : "registration_received", data),
        buildEmail(!workshop ? "admin_general_waitlist" : waitlist ? "admin_new_waitlist" : "admin_new_registration", data),
      ]);
      mails.push(sendMail(reg.email, toUser.subject, toUser.html));
      mails.push(sendMail(ADMIN_EMAIL, toAdmin.subject, toAdmin.html, reg.email));
      const results = await Promise.allSettled(mails);
      results.forEach((r) => r.status === "rejected" && console.error("E-kirja saatmine ebaõnnestus", r.reason));
    }
  } catch (err) {
    console.error("E-kirjade ettevalmistus ebaõnnestus", err);
  }

  return NextResponse.json({ status: result.reg_status, seatsLeft: result.seats_left });
}
