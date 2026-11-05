import { NextResponse } from "next/server";
import { getAdminUser, getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { ADMIN_EMAIL, buildEmail, sendMail } from "../../../../lib/mail";
import type { RegistrationStatus } from "../../../../../../types/supabase";

export const runtime = "nodejs";

const STATUSES: RegistrationStatus[] = ["pending", "confirmed", "cancelled", "waitlist"];

// Haldur muudab registreeringu staatust; kinnitamisel saadetakse osalejale kinnituskiri
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let user;
  try {
    user = await getAdminUser(request);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server pole seadistatud (SUPABASE_SERVICE_ROLE_KEY)." }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: "Logi uuesti sisse." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    status?: RegistrationStatus;
    notify?: boolean;
    workshopId?: string | null;
    force?: boolean; // haldur kinnitab teadlikult üle kohtade piiri
    note?: string; // eemaldamisel sõnum osalejale
  };
  if (!body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Vigane staatus." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from("workshop_registrations").select("*").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Registreeringut ei leitud." }, { status: 404 });

  // Kas registreering hakkab kohta hõivama (huvilistest/tühistatutest või teisele õpitoale)?
  const targetWorkshopId = body.workshopId !== undefined ? body.workshopId : current.workshop_id;
  const holdsSeat = (s: RegistrationStatus) => s === "pending" || s === "confirmed";
  const startsHolding =
    holdsSeat(body.status) && (!holdsSeat(current.status) || targetWorkshopId !== current.workshop_id);
  if (holdsSeat(body.status) && !targetWorkshopId) {
    return NextResponse.json({ error: "Vali enne õpituba, kuhu registreering kuulub." }, { status: 400 });
  }
  if (startsHolding && targetWorkshopId && !body.force) {
    const { data: taken } = await supabase.rpc("workshop_seats_taken", { w_id: targetWorkshopId });
    const { data: w } = await supabase.from("workshops").select("capacity").eq("id", targetWorkshopId).single();
    const left = (w?.capacity ?? 0) - (taken ?? 0);
    if (left < current.participants) {
      return NextResponse.json(
        { error: `Vabu kohti on ${Math.max(left, 0)}, registreeringus ${current.participants} inimest.`, code: "no_seats" },
        { status: 409 }
      );
    }
  }

  const update: { status: RegistrationStatus; confirmed_at?: string | null; workshop_id?: string | null } = {
    status: body.status,
  };
  if (body.status === "confirmed" && current.status !== "confirmed") update.confirmed_at = new Date().toISOString();
  if (body.status !== "confirmed") update.confirmed_at = null;
  // Huvilise saab tõsta teise õpitoa nimekirja
  if (body.workshopId !== undefined) update.workshop_id = body.workshopId;

  const { data: updated, error } = await supabase
    .from("workshop_registrations")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !updated) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Selle e-postiga on sellele õpitoale juba aktiivne registreering." }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || "Salvestamine ebaõnnestus." }, { status: 500 });
  }

  let emailSent = false;
  let emailError: string | null = null;
  if (body.status === "confirmed" && current.status !== "confirmed" && body.notify !== false && updated.workshop_id) {
    const { data: workshop } = await supabase.from("workshops").select("*").eq("id", updated.workshop_id).single();
    if (workshop) {
      try {
        const mail = await buildEmail("registration_confirmed", { workshop, reg: updated });
        await sendMail(updated.email, mail.subject, mail.html);
        emailSent = true;
      } catch (err) {
        console.error("Kinnituskirja saatmine ebaõnnestus", err);
        emailError = "Staatus muudeti, kuid kinnituskirja saatmine ebaõnnestus.";
      }
    }
  }

  // Osaleja eemaldamine: teavitus osalejale (kui soovitud) ja alati haldurile
  const removed = body.status === "cancelled" && (current.status === "pending" || current.status === "confirmed");
  if (removed && updated.workshop_id) {
    const { data: workshop } = await supabase.from("workshops").select("*").eq("id", updated.workshop_id).single();
    if (workshop) {
      const note = String(body.note ?? "").trim().slice(0, 1000);
      const notifyParticipant = body.notify !== false;
      const { data: taken } = await supabase.rpc("workshop_seats_taken", { w_id: workshop.id });
      const seatsLeft = Math.max(workshop.capacity - (taken ?? 0), 0);
      const mails: Promise<void>[] = [];
      const data = {
        workshop,
        reg: updated,
        seatsLeft,
        note,
        removedBy: user.email ?? "haldur",
        participantNotified: notifyParticipant,
      };
      if (notifyParticipant) {
        const toUser = await buildEmail("registration_removed", data);
        mails.push(sendMail(updated.email, toUser.subject, toUser.html));
      }
      const toAdmin = await buildEmail("admin_registration_removed", data);
      mails.push(sendMail(ADMIN_EMAIL, toAdmin.subject, toAdmin.html, updated.email));
      const results = await Promise.allSettled(mails);
      results.forEach((res) => res.status === "rejected" && console.error("Eemaldamise kiri ebaõnnestus", res.reason));
      if (results.some((res) => res.status === "rejected")) {
        emailError = "Osaleja eemaldati, kuid kõiki teavituskirju ei õnnestunud saata.";
      } else {
        emailSent = notifyParticipant;
      }
    }
  }

  return NextResponse.json({ registration: updated, emailSent, emailError });
}
