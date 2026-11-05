import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnsubscribeCard from "@/components/opitoad/UnsubscribeCard";
import { verifyUnsubscribeToken } from "../lib/unsubscribe";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";
import { formatDate } from "../lib/opitoad";

export const metadata: Metadata = {
  title: "Loobu teavitustest | Sörve Villaveski",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// Kuvame e-posti osaliselt peidetuna, kui link peaks kellegi teise kätte sattuma
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

async function activeRegistrations(email: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: regs } = await supabase
      .from("workshop_registrations")
      .select("workshop_id, status")
      .eq("email", email)
      .in("status", ["pending", "confirmed"]);
    const ids = [...new Set((regs ?? []).map((r) => r.workshop_id).filter(Boolean))] as string[];
    if (!ids.length) return { total: await countAll(email), active: [] as string[] };
    const { data: workshops } = await supabase
      .from("workshops")
      .select("title, starts_at")
      .in("id", ids)
      .gte("starts_at", new Date().toISOString());
    return {
      total: await countAll(email),
      active: (workshops ?? []).map((w) => `${w.title} (${formatDate(w.starts_at)})`),
    };
  } catch {
    return { total: 0, active: [] as string[] };
  }
}

async function countAll(email: string) {
  const { count } = await getSupabaseAdmin()
    .from("workshop_registrations")
    .select("id", { count: "exact", head: true })
    .eq("email", email);
  return count ?? 0;
}

export default async function LoobuPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  let email: string | null = null;
  try {
    email = verifyUnsubscribeToken(t);
  } catch (err) {
    console.error(err);
  }
  const info = email ? await activeRegistrations(email) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f4ef]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16 md:pt-36 md:pb-24">
        <UnsubscribeCard
          token={email ? t! : null}
          maskedEmail={email ? maskEmail(email) : null}
          activeWorkshops={info?.active ?? []}
          hasData={(info?.total ?? 0) > 0}
        />
      </main>
      <Footer />
    </div>
  );
}
