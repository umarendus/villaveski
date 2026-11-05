import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { ADMIN_EMAIL, buildEmail, sendMail } from "../../../lib/mail";
import { verifyUnsubscribeToken } from "../../../lib/unsubscribe";

export const runtime = "nodejs";

// Teavitustest loobumine: kustutab kõik selle e-postiga seotud registreeringud ja huviliste kirjed.
// Aktiivse (ootel/kinnitatud) registreeringu kustutamisest saab haldur teate.
export async function POST(request: Request) {
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };
  const email = verifyUnsubscribeToken(token);
  if (!email) return NextResponse.json({ error: "Link on vigane või aegunud." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: regs, error } = await supabase.from("workshop_registrations").select("*").eq("email", email);
  if (error) return NextResponse.json({ error: "Kustutamine ebaõnnestus. Proovi hiljem uuesti." }, { status: 500 });

  const active = (regs ?? []).filter((r) => (r.status === "pending" || r.status === "confirmed") && r.workshop_id);
  const { error: delError } = await supabase.from("workshop_registrations").delete().eq("email", email);
  if (delError) return NextResponse.json({ error: "Kustutamine ebaõnnestus. Proovi hiljem uuesti." }, { status: 500 });

  // Haldurile teade vabanenud kohtadest
  const results = await Promise.allSettled(
    active.map(async (reg) => {
      const { data: workshop } = await supabase.from("workshops").select("*").eq("id", reg.workshop_id!).single();
      if (!workshop) return;
      const { data: taken } = await supabase.rpc("workshop_seats_taken", { w_id: workshop.id });
      const mail = await buildEmail("admin_unsubscribed", {
        workshop,
        reg,
        seatsLeft: Math.max(workshop.capacity - (taken ?? 0), 0),
      });
      await sendMail(ADMIN_EMAIL, mail.subject, mail.html);
    })
  );
  results.forEach((r) => r.status === "rejected" && console.error("Loobumise teade haldurile ebaõnnestus", r.reason));

  return NextResponse.json({ deleted: regs?.length ?? 0 });
}
