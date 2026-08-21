import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Sessioon (access + refresh token) jääb localStorage'i ka peale brauseri sulgemist
    persistSession: true,
    // Aegunud access token uuendatakse automaatselt refresh tokeniga -> uuesti sisse logima ei pea
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "villaveski-auth",
  },
});
