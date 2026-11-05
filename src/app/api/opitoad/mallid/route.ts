import { NextResponse } from "next/server";
import { getAdminUser, getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildEmail, sendMail } from "../../../lib/mail";
import {
  TEMPLATE_DEFS,
  TEXT_FIELDS,
  renderEmail,
  sampleEmailData,
  validateTemplate,
  type TemplateKey,
  type TemplateTexts,
} from "../../../lib/emailTemplates";

export const runtime = "nodejs";

type Body = { key?: string; texts?: Partial<TemplateTexts>; workshopId?: string | null };

async function auth(request: Request) {
  try {
    return await getAdminUser(request);
  } catch (err) {
    console.error(err);
    return null;
  }
}

function parse(body: Body) {
  const key = body.key as TemplateKey;
  if (!key || !(key in TEMPLATE_DEFS)) return { error: "Tundmatu mall." } as const;
  const texts = Object.fromEntries(
    TEXT_FIELDS.map((f) => [f, String(body.texts?.[f] ?? "").replace(/\r\n/g, "\n")])
  ) as TemplateTexts;
  return { key, texts } as const;
}

// Salvesta malli tekstid (kohustuslikud muutujad peavad olemas olema)
export async function PUT(request: Request) {
  const user = await auth(request);
  if (!user) return NextResponse.json({ error: "Logi uuesti sisse." }, { status: 401 });
  const parsed = parse(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { errors } = validateTemplate(parsed.key, parsed.texts);
  if (errors.length) return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("email_templates")
    .upsert({ key: parsed.key, ...parsed.texts, updated_at: new Date().toISOString(), updated_by: user.email ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Taasta vaikimisi tekst
export async function DELETE(request: Request) {
  const user = await auth(request);
  if (!user) return NextResponse.json({ error: "Logi uuesti sisse." }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key") as TemplateKey | null;
  if (!key || !(key in TEMPLATE_DEFS)) return NextResponse.json({ error: "Tundmatu mall." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("email_templates").delete().eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, texts: TEMPLATE_DEFS[key].defaults });
}

// Saada testkiri sisseloginud haldurile (näidisandmetega, kas salvestamata või salvestatud tekstiga)
export async function POST(request: Request) {
  const user = await auth(request);
  if (!user?.email) return NextResponse.json({ error: "Logi uuesti sisse." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Body;
  const parsed = parse(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let workshop = null;
  if (body.workshopId) {
    const { data } = await getSupabaseAdmin().from("workshops").select("*").eq("id", body.workshopId).maybeSingle();
    workshop = data;
  }
  const data = sampleEmailData(workshop);
  const mail = body.texts ? renderEmail(parsed.key, parsed.texts, data) : await buildEmail(parsed.key, data);
  try {
    await sendMail(user.email, `[TEST] ${mail.subject}`, mail.html);
  } catch (err) {
    console.error("Testkirja saatmine ebaõnnestus", err);
    return NextResponse.json(
      { error: "Testkirja saatmine ebaõnnestus – kontrolli SMTP seadeid (Vercel env)." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, to: user.email });
}
