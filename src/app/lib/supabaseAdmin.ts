// AINULT serveris kasutamiseks (API route'id) – service role võti möödub RLS-ist
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/supabase";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL või SUPABASE_SERVICE_ROLE_KEY puudub");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Kontrollib halduri sessiooni (sama sisselogimine mis /tootepildid lehel)
export async function getAdminUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
