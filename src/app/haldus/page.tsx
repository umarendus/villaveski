"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, Images } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/app/lib/supabaseClient";
import { formatDate } from "@/app/lib/opitoad";

const abril = { fontFamily: "'Abril Fatface', serif" };

// Halduse avaleht: sisselogimine ja valik tootepiltide ning õpitubade vahel
export default function HaldusPage() {
  return <AdminShell>{(session) => <Overview email={session.user.email ?? ""} />}</AdminShell>;
}

function Overview({ email }: { email: string }) {
  const [photos, setPhotos] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [next, setNext] = useState<{ title: string; starts_at: string } | null>(null);

  useEffect(() => {
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setPhotos(count ?? 0));
    supabase
      .from("workshop_registrations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => setPending(count ?? 0));
    supabase
      .from("workshops")
      .select("title, starts_at")
      .gte("starts_at", new Date().toISOString())
      .neq("status", "draft")
      .order("starts_at", { ascending: true })
      .limit(1)
      .then(({ data }) => setNext(data?.[0] ?? null));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 md:py-16" style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
      <h1 className="text-4xl md:text-5xl text-black" style={abril}>
        Haldus
      </h1>
      <p className="text-gray-600 mt-2 mb-10">Tere! Oled sisse logitud kui {email}.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/haldus/opitoad"
          className="group bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-gray-300 transition flex flex-col"
        >
          <div className="flex items-start justify-between">
            <span className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </span>
            {pending !== null && pending > 0 && (
              <span className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-900">{pending} ootab kinnitust</span>
            )}
          </div>
          <h2 className="text-3xl text-black mt-6" style={abril}>
            Õpitoad
          </h2>
          <p className="text-gray-600 mt-2 flex-1">
            Õpitubade lisamine ja muutmine, registreeringute kinnitamine, huvilised, galerii ja e-kirjade mallid.
          </p>
          {next && (
            <p className="text-sm text-[#7a5f40] mt-4">
              Järgmine: {next.title} · <span className="first-letter:uppercase">{formatDate(next.starts_at)}</span>
            </p>
          )}
          <span className="mt-6 inline-flex items-center gap-2 text-black font-semibold">
            Ava õpitubade haldus <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/haldus/tooted"
          className="group bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-gray-300 transition flex flex-col"
        >
          <span className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
            <Images className="w-6 h-6" />
          </span>
          <h2 className="text-3xl text-black mt-6" style={abril}>
            Tooted
          </h2>
          <p className="text-gray-600 mt-2 flex-1">Toodete lehe ja avalehe pildid: lisamine ja kustutamine.</p>
          {photos !== null && <p className="text-sm text-[#7a5f40] mt-4">{photos} pilti</p>}
          <span className="mt-6 inline-flex items-center gap-2 text-black font-semibold">
            Ava tootepildid <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <Link href="/" target="_blank" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mt-10">
        <ExternalLink className="w-4 h-4" /> Vaata kodulehte
      </Link>
    </main>
  );
}
