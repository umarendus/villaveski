import { NextResponse } from "next/server";
import { getAdminUser, getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { registrationConfirmedEmail, sendMail } from "../../../../lib/mail";
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
  };
  if (!body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Vigane staatus." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from("workshop_registrations").select("*").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Registreeringut ei leitud." }, { status: 404 });

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
        const mail = registrationConfirmedEmail(workshop, updated);
        await sendMail(updated.email, mail.subject, mail.html);
        emailSent = true;
      } catch (err) {
        console.error("Kinnituskirja saatmine ebaõnnestus", err);
        emailError = "Staatus muudeti, kuid kinnituskirja saatmine ebaõnnestus.";
      }
    }
  }

  return NextResponse.json({ registration: updated, emailSent, emailError });
}
