"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Download, Euro, MapPin, Pencil } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import WorkshopEditor from "@/components/admin/opitoad/WorkshopEditor";
import ShareWorkshop from "@/components/opitoad/ShareWorkshop";
import RegistrationCard, { downloadCsv, registrationsToCsv, seatsTaken } from "@/components/admin/opitoad/RegistrationCard";
import { supabase } from "../../../lib/supabaseClient";
import { formatDate, formatPrice, formatTime } from "../../../lib/opitoad";
import type { RegistrationStatus, Workshop, WorkshopRegistration } from "../../../../../types/supabase";

const abril = { fontFamily: "'Abril Fatface', serif" };

const GROUPS: { status: RegistrationStatus; title: string; empty?: string }[] = [
  { status: "pending", title: "Ootavad kinnitust", empty: "Uusi registreeringuid pole." },
  { status: "confirmed", title: "Kinnitatud osalejad", empty: "Veel pole kedagi kinnitatud." },
  { status: "waitlist", title: "Järjekorras (kohad olid täis)" },
  { status: "cancelled", title: "Tühistatud" },
];

export default function OpitubaHaldus() {
  return <AdminShell>{() => <Detail />}</AdminShell>;
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [regs, setRegs] = useState<WorkshopRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const [w, r] = await Promise.all([
      supabase.from("workshops").select("*").eq("id", id).maybeSingle(),
      supabase.from("workshop_registrations").select("*").eq("workshop_id", id).order("created_at", { ascending: true }),
    ]);
    setWorkshop(w.data ?? null);
    setRegs(r.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse"><div className="h-48 bg-gray-200 rounded-2xl" /></div>;
  }

  if (!workshop) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-6">Õpituba ei leitud – see võib olla kustutatud.</p>
        <Link href="/haldus/opitoad" className="px-5 py-2.5 rounded-full bg-black text-white">
          Tagasi haldusesse
        </Link>
      </div>
    );
  }

  const taken = seatsTaken(workshop, regs);
  const left = Math.max(workshop.capacity - taken, 0);
  const pendingCount = regs.filter((r) => r.status === "pending").length;

  function updateReg(regId: string, reg: WorkshopRegistration | null) {
    setRegs((prev) => {
      if (!reg) return prev.filter((r) => r.id !== regId);
      // Teisele õpitoale tõstetud registreering kaob siit nimekirjast
      if (reg.workshop_id !== id) return prev.filter((r) => r.id !== regId);
      return prev.map((r) => (r.id === regId ? reg : r));
    });
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12" style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
      <Link href="/haldus/opitoad" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
        <ArrowLeft className="w-4 h-4" /> Kõik õpitoad
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm grid md:grid-cols-[280px_1fr]">
        <div className="relative h-48 md:h-auto bg-[#f7f4ef]">
          {workshop.image_url && <Image src={workshop.image_url} alt="" fill className="object-cover" sizes="280px" />}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl text-black" style={abril}>
              {workshop.title}
            </h1>
            <div className="flex gap-2 shrink-0">
            {workshop.status !== "draft" && <ShareWorkshop workshop={workshop} variant="admin" className="py-2" />}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-sm cursor-pointer hover:bg-gray-50 shrink-0"
            >
              <Pencil className="w-4 h-4" /> Muuda
            </button>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-gray-700 text-sm">
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {formatDate(workshop.starts_at)}, kell {formatTime(workshop.starts_at)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {workshop.location}
            </p>
            <p className="flex items-center gap-2">
              <Euro className="w-4 h-4" /> {formatPrice(workshop.price_eur)} · {workshop.payment_note}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat value={left} label="vaba kohta" accent />
            <Stat value={taken} label={`kinnitatud / ${workshop.capacity}`} />
            <Stat value={pendingCount} label="ootab kinnitust" warn={pendingCount > 0} />
          </div>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: workshop.capacity }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < taken ? "bg-black" : "bg-[#be9f7a]/30"}`} />
            ))}
          </div>
          {workshop.reserved_offline > 0 && (
            <p className="text-xs text-gray-500 mt-2">Sh {workshop.reserved_offline} kohta broneeritud väljaspool lehte.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        {regs.length > 0 && (
          <button
            onClick={() =>
              downloadCsv(
                `${workshop.title.replace(/[^\p{L}\d]+/gu, "-")}-osalejad.csv`,
                registrationsToCsv(regs, [workshop])
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm cursor-pointer hover:bg-white"
          >
            <Download className="w-4 h-4" /> Osalejad CSV-na
          </button>
        )}
      </div>

      {GROUPS.map((g) => {
        const list = regs.filter((r) => r.status === g.status);
        if (!list.length && !g.empty) return null;
        const people = list.reduce((s, r) => s + r.participants, 0);
        return (
          <section key={g.status} className="mt-8">
            <h2 className="text-xl text-black mb-3 flex items-center gap-3">
              {g.title}
              <span className="text-sm text-gray-500">
                {list.length} registreeringut{people !== list.length ? ` · ${people} inimest` : ""}
              </span>
            </h2>
            {list.length === 0 ? (
              <p className="text-gray-500 text-sm bg-white border border-dashed border-gray-300 rounded-xl px-4 py-6 text-center">
                {g.empty}
              </p>
            ) : (
              <div className="space-y-3">
                {list.map((r) => (
                  <RegistrationCard key={r.id} reg={r} onChanged={(reg) => updateReg(r.id, reg)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {editing && (
        <WorkshopEditor
          workshop={workshop}
          onClose={() => setEditing(false)}
          onSaved={(w) => {
            setWorkshop(w);
            setEditing(false);
          }}
          onDeleted={() => router.push("/haldus/opitoad")}
        />
      )}
    </main>
  );
}

function Stat({ value, label, accent, warn }: { value: number; label: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-xl py-3 ${accent ? "bg-black text-white" : warn ? "bg-amber-50 text-amber-900" : "bg-gray-50 text-black"}`}>
      <div className="text-3xl leading-none" style={abril}>
        {value}
      </div>
      <div className={`text-xs mt-1 ${accent ? "text-gray-300" : "text-gray-500"}`}>{label}</div>
    </div>
  );
}
