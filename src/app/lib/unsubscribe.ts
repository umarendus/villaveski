// AINULT serveris: teavitustest loobumise link. Link sisaldab e-posti ja allkirja,
// et keegi ei saaks teise inimese andmeid kustutada.
import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "./emailTemplates";

function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET või SUPABASE_SERVICE_ROLE_KEY puudub");
  return s;
}

function sign(email: string) {
  return createHmac("sha256", secret()).update(`unsubscribe:${email}`).digest("base64url").slice(0, 32);
}

export function makeUnsubscribeToken(email: string) {
  const e = email.trim().toLowerCase();
  return `${Buffer.from(e).toString("base64url")}.${sign(e)}`;
}

export function makeUnsubscribeUrl(email: string) {
  return `${SITE_URL}/loobu?t=${makeUnsubscribeToken(email)}`;
}

// Tagastab e-posti, kui allkiri on õige; muidu null
export function verifyUnsubscribeToken(token: string | null | undefined) {
  if (!token || token.length > 600) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return email;
}
