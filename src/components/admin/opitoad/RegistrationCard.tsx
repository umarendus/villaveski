"use client";

import { useState } from "react";
import { Check, Mail, Phone, RotateCcw, ShoppingBasket, Trash2, Users, X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { STATUS_LABELS, formatShortDate } from "@/app/lib/opitoad";
import type { RegistrationStatus, Workshop, WorkshopRegistration } from "../../../../types/supabase";

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-900 border-amber-200",
  confirmed: "bg-green-50 text-green-900 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  waitlist: "bg-[#f7f4ef] text-[#7a5f40] border-[#be9f7a]/40",
};

export async function changeRegistrationStatus(
  id: string,
  status: RegistrationStatus,
  opts: { notify?: boolean; workshopId?: string | null; force?: boolean } = {}
) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/opitoad/registreeringud/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify({ status, ...opts }),
  });
  const json = await res.json();
  if (res.status === 409 && json.code === "no_seats" && !opts.force) {
    if (!confirm(`${json.error}\nKas lisad siiski üle kohtade piiri?`)) throw new Error("Tühistatud – vabu kohti pole.");
    return changeRegistrationStatus(id, status, { ...opts, force: true });
  }
  if (!res.ok) throw new Error(json.error || "Muutmine ebaõnnestus");
  return json as { registration: WorkshopRegistration; emailSent: boolean; emailError: string | null };
}

type Props = {
  reg: WorkshopRegistration;
  onChanged: (reg: WorkshopRegistration | null) => void;
  // huviliste nimekirjas: võimalus tõsta registreering mõnele õpitoale
  moveTargets?: Workshop[];
};

export default function RegistrationCard({ reg, onChanged, moveTargets }: Props) {
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");

  async function run(status: RegistrationStatus, opts: { notify?: boolean; workshopId?: string | null } = {}) {
    setBusy(true);
    setNote("");
    try {
      const res = await changeRegistrationStatus(reg.id, status, opts);
      onChanged(res.registration);
      if (res.emailError) setNote(res.emailError);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Viga");
    } finally {
      setBusy(false);
    }
  }

  // Kohtade piisavust kontrollib server; puuduse korral küsitakse kinnitust
  function confirmReg() {
    run("confirmed", { notify });
  }

  async function remove() {
    if (!confirm(`Kustutada ${reg.name} registreering jäädavalt?`)) return;
    setBusy(true);
    const { error } = await supabase.from("workshop_registrations").delete().eq("id", reg.id);
    setBusy(false);
    if (error) return setNote(error.message);
    onChanged(null);
  }

  return (
    <div
      className={`bg-white border rounded-xl p-4 md:p-5 transition ${busy ? "opacity-60" : ""} ${
        reg.status === "pending" ? "border-amber-300 shadow-sm" : "border-gray-200"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg text-black font-semibold">{reg.name}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[reg.status]}`}>
              {STATUS_LABELS[reg.status]}
            </span>
            <span className="text-xs text-gray-400">{formatShortDate(reg.created_at)}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-700">
            <a href={`mailto:${reg.email}`} className="flex items-center gap-1.5 hover:text-black">
              <Mail className="w-4 h-4" /> {reg.email}
            </a>
            {reg.phone && (
              <a href={`tel:${reg.phone}`} className="flex items-center gap-1.5 hover:text-black">
                <Phone className="w-4 h-4" /> {reg.phone}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {reg.participants} {reg.participants === 1 ? "osaleja" : "osalejat"}
            </span>
            {reg.wants_materials && (
              <span className="flex items-center gap-1.5 text-[#7a5f40]">
                <ShoppingBasket className="w-4 h-4" /> Soovib materjale osta
              </span>
            )}
          </div>
          {reg.extra_participants?.length > 0 && (
            <ul className="mt-3 text-sm text-gray-700 border-l-2 border-[#be9f7a]/50 pl-3 space-y-0.5">
              {reg.extra_participants.map((p, i) => (
                <li key={i}>
                  <span className="text-gray-400 mr-1">{i + 2}.</span>
                  {p.name}
                  {p.email && <span className="text-gray-500"> · {p.email}</span>}
                  {p.phone && <span className="text-gray-500"> · {p.phone}</span>}
                </li>
              ))}
            </ul>
          )}
          {reg.message && (
            <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-line">{reg.message}</p>
          )}
          {note && <p className="mt-2 text-sm text-red-800">{note}</p>}
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-2 md:min-w-[200px]">
          {(reg.status === "pending" || reg.status === "waitlist") && reg.workshop_id && (
            <>
              <button
                onClick={confirmReg}
                disabled={busy}
                className="flex items-center justify-center gap-2 bg-black text-white rounded-full px-5 py-2.5 cursor-pointer hover:bg-gray-800 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Kinnita
              </button>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none justify-center md:justify-end">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-black" />
                Saada kinnituskiri
              </label>
            </>
          )}

          {moveTargets && moveTargets.length > 0 && reg.status === "waitlist" && (
            <select
              disabled={busy}
              value=""
              onChange={(e) => e.target.value && run("pending", { workshopId: e.target.value })}
              className="border border-gray-300 rounded-full px-3 py-2 text-sm cursor-pointer bg-white"
            >
              <option value="">Tõsta õpitoale…</option>
              {moveTargets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} · {formatShortDate(w.starts_at)}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1 justify-center md:justify-end">
            {reg.status !== "cancelled" ? (
              <button
                onClick={() => confirm(`Tühistada ${reg.name} registreering?`) && run("cancelled")}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black px-2 py-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> Tühista
              </button>
            ) : (
              <button
                onClick={() => run(reg.workshop_id ? "pending" : "waitlist")}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black px-2 py-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Taasta
              </button>
            )}
            {reg.status === "confirmed" && (
              <button
                onClick={() => run("pending")}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black px-2 py-1 cursor-pointer"
                title="Tagasi ootele"
              >
                <RotateCcw className="w-4 h-4" /> Ootele
              </button>
            )}
            <button
              onClick={remove}
              disabled={busy}
              className="flex items-center gap-1 text-sm text-red-800 hover:text-red-600 px-2 py-1 cursor-pointer"
              title="Kustuta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function registrationsToCsv(regs: WorkshopRegistration[], workshops: Workshop[] = []) {
  const titles = new Map(workshops.map((w) => [w.id, w.title]));
  const header = ["Nimi", "E-post", "Telefon", "Osalejaid", "Kaasosalejad", "Materjalid", "Staatus", "Õpituba", "Sõnum", "Registreeritud"];
  const rows = regs.map((r) => [
    r.name,
    r.email,
    r.phone,
    String(r.participants),
    (r.extra_participants ?? []).map((p) => [p.name, p.email, p.phone].filter(Boolean).join(" / ")).join("; "),
    r.wants_materials ? "Jah" : "Ei",
    STATUS_LABELS[r.status],
    r.workshop_id ? titles.get(r.workshop_id) ?? "" : "Üldine huviliste nimekiri",
    r.message,
    new Date(r.created_at).toLocaleString("et-EE"),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${csvSafe(String(v ?? "")).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  return "﻿" + csv;
}

// Excel ei tohi avalike väljade sisu valemina käivitada (=, +, -, @ algus)
function csvSafe(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function seatsTaken(w: Workshop, regs: WorkshopRegistration[]) {
  return (
    w.reserved_offline +
    regs
      .filter((r) => r.workshop_id === w.id && (r.status === "pending" || r.status === "confirmed"))
      .reduce((sum, r) => sum + r.participants, 0)
  );
}
