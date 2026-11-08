"use client";

import { useState } from "react";
import { Check, ListPlus, Mail, Phone, RotateCcw, ShoppingBasket, Trash2, UserMinus, Users, X } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { supabase } from "@/app/lib/supabaseClient";
import { STATUS_LABELS, formatShortDate } from "@/app/lib/opitoad";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import Select from "@/components/ui/Select";
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
  opts: { notify?: boolean; workshopId?: string | null; force?: boolean; note?: string } = {}
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
  return json as {
    registration: WorkshopRegistration;
    emailSent: boolean;
    emailError: string | null;
    movedToWaitlist?: number;
  };
}

type Props = {
  reg: WorkshopRegistration;
  onChanged: (reg: WorkshopRegistration | null) => void;
  // huviliste nimekirjas: võimalus tõsta registreering mõnele õpitoale
  moveTargets?: Workshop[];
  // kui muudatus mõjutas ka teisi registreeringuid (nt kohad täitusid), laeb nimekirja uuesti
  onReload?: () => void;
};

export default function RegistrationCard({ reg, onChanged, moveTargets, onReload }: Props) {
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");
  const [info, setInfo] = useState("");
  const [removing, setRemoving] = useState(false);
  const [toWaitlist, setToWaitlist] = useState(false);

  async function run(
    status: RegistrationStatus,
    opts: { notify?: boolean; workshopId?: string | null; note?: string } = {}
  ) {
    setBusy(true);
    setNote("");
    setInfo("");
    try {
      const res = await changeRegistrationStatus(reg.id, status, opts);
      onChanged(res.registration);
      if (res.emailError) setNote(res.emailError);
      if (res.movedToWaitlist) {
        // Kohad täitusid: ülejäänud ootel registreeringud liikusid huviliste nimekirja
        alertMoved(res.movedToWaitlist);
        onReload?.();
      }
      return true;
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Viga");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const holdsSeat = reg.status === "pending" || reg.status === "confirmed";

  function alertMoved(n: number) {
    window.dispatchEvent(
      new CustomEvent("opitoad:info", {
        detail: `Kohad on nüüd täis – ${n} ootel ${n === 1 ? "registreering tõsteti" : "registreeringut tõsteti"} huviliste nimekirja ja neid teavitati e-kirjaga.`,
      })
    );
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
          {/* Broneeringu päis: staatus, kuupäev, inimeste arv */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[reg.status]}`}>
              {STATUS_LABELS[reg.status]}
            </span>
            {reg.participants > 1 && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="w-3.5 h-3.5" /> Broneering · {reg.participants} inimest
              </span>
            )}
            <span className="text-xs text-gray-400">{formatShortDate(reg.created_at)}</span>
            {reg.wants_materials && (
              <span className="flex items-center gap-1 text-xs text-[#7a5f40]">
                <ShoppingBasket className="w-3.5 h-3.5" /> Soovib materjale osta
              </span>
            )}
          </div>

          {/* Iga osaleja eraldi real */}
          <ol className={reg.participants > 1 ? "divide-y divide-gray-100 border border-gray-100 rounded-lg" : ""}>
            {registrationPeople(reg).map((p, i) => (
              <li key={i} className={reg.participants > 1 ? "px-3 py-2.5" : ""}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  {reg.participants > 1 && <span className="text-xs text-gray-400 w-4">{i + 1}.</span>}
                  <h3 className={`${i === 0 ? "text-lg" : "text-base"} text-black font-semibold`}>{p.name}</h3>
                  {reg.participants > 1 && i === 0 && <span className="text-xs text-gray-500">broneerija</span>}
                </div>
                {(p.email || p.phone) && (
                  <div className={`flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-700 mt-0.5 ${reg.participants > 1 ? "pl-6" : ""}`}>
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 hover:text-black min-w-0 break-all">
                        <Mail className="w-4 h-4 shrink-0" /> {p.email}
                      </a>
                    )}
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 hover:text-black">
                        <Phone className="w-4 h-4 shrink-0" /> {p.phone}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {reg.message && (
            <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-line">{reg.message}</p>
          )}
          {note && <p className="mt-2 text-sm text-red-800">{note}</p>}
          {info && <p className="mt-2 text-sm text-green-800">{info}</p>}
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
            <Select
              variant="pill"
              disabled={busy}
              value=""
              placeholder="Tõsta õpitoale…"
              ariaLabel="Tõsta õpitoale"
              onChange={(v) => v && run("pending", { workshopId: v })}
              options={moveTargets.map((w) => ({ value: w.id, label: `${w.title} · ${formatShortDate(w.starts_at)}` }))}
            />
          )}

          <div className="flex flex-wrap gap-1 justify-center md:justify-end">
            {reg.status === "pending" && reg.workshop_id && (
              <button
                onClick={() => setToWaitlist(true)}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-[#7a5f40] hover:text-black px-2 py-1 cursor-pointer"
                title="Kohti pole – tõsta huviliste nimekirja"
              >
                <ListPlus className="w-4 h-4" /> Huvilistesse
              </button>
            )}
            {holdsSeat ? (
              <button
                onClick={() => setRemoving(true)}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-red-900 hover:text-red-700 px-2 py-1 cursor-pointer"
              >
                <UserMinus className="w-4 h-4" /> Eemalda
              </button>
            ) : reg.status === "waitlist" ? (
              <button
                onClick={() => run("cancelled", { notify: false })}
                disabled={busy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black px-2 py-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> Eemalda nimekirjast
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
      {toWaitlist && (
        <Portal>
          <WaitlistModal
            reg={reg}
            busy={busy}
            onCancel={() => setToWaitlist(false)}
            onConfirm={async (notifyUser) => {
              const ok = await run("waitlist", { notify: notifyUser });
              if (ok) setToWaitlist(false);
            }}
          />
        </Portal>
      )}
      {removing && (
        <Portal>
        <RemoveModal
          reg={reg}
          busy={busy}
          onCancel={() => setRemoving(false)}
          onConfirm={async (notifyUser, message) => {
            const ok = await run("cancelled", { notify: notifyUser, note: message });
            if (ok) setRemoving(false);
          }}
        />
        </Portal>
      )}
    </div>
  );
}

// Ootel registreeringu tõstmine huviliste nimekirja (kohti pole), soovi korral kirjaga
function WaitlistModal({
  reg,
  busy,
  onCancel,
  onConfirm,
}: {
  reg: WorkshopRegistration;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (notify: boolean) => void;
}) {
  const [notifyUser, setNotifyUser] = useState(true);
  useBodyScrollLock();

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`waitlist-title-${reg.id}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 md:p-8"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <div className="w-12 h-12 rounded-full bg-[#f7f4ef] text-[#7a5f40] flex items-center justify-center mx-auto mb-4">
          <ListPlus className="w-6 h-6" />
        </div>
        <h2
          id={`waitlist-title-${reg.id}`}
          className="text-2xl text-black text-center mb-2"
          style={{ fontFamily: "'Abril Fatface', serif" }}
        >
          Tõsta huviliste nimekirja?
        </h2>
        <p className="text-center text-gray-600 mb-6">
          <strong className="text-black">{reg.name}</strong> registreering jääb kinnitamata ja liigub huviliste nimekirja.
          Kui mõni koht vabaneb, saad ta õpitoa lehel „Järjekorras“ alt kinnitada.
        </p>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyUser}
            onChange={(e) => setNotifyUser(e.target.checked)}
            className="mt-1 w-4 h-4 accent-black cursor-pointer"
          />
          <span className="text-sm text-gray-700">Saada kiri „Kohad said täis – oled huviliste nimekirjas“</span>
        </label>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-full cursor-pointer hover:bg-gray-50 disabled:opacity-50"
          >
            Tühista
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notifyUser)}
            disabled={busy}
            className="flex-1 bg-black text-white py-2.5 rounded-full cursor-pointer hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Tõstan..." : "Tõsta huvilistesse"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Osaleja eemaldamise kinnitus (nt haigestumise korral) – teavitab osalejat ja haldurit
function RemoveModal({
  reg,
  busy,
  onCancel,
  onConfirm,
}: {
  reg: WorkshopRegistration;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (notify: boolean, note: string) => void;
}) {
  const [notifyUser, setNotifyUser] = useState(true);
  const [message, setMessage] = useState("");
  useBodyScrollLock();

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`remove-title-${reg.id}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 md:p-8"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-900 flex items-center justify-center mx-auto mb-4">
          <UserMinus className="w-6 h-6" />
        </div>
        <h2
          id={`remove-title-${reg.id}`}
          className="text-2xl text-black text-center mb-2"
          style={{ fontFamily: "'Abril Fatface', serif" }}
        >
          Eemalda osaleja?
        </h2>
        <p className="text-center text-gray-600 mb-6">
          <strong className="text-black">{reg.name}</strong>
          {reg.participants > 1 ? ` (${reg.participants} inimest)` : ""} eemaldatakse õpitoast ja koht vabaneb
          teistele registreerijatele.
        </p>

        <label htmlFor={`remove-note-${reg.id}`} className="block text-sm text-gray-600 mb-1">
          Sõnum osalejale (soovi korral)
        </label>
        <textarea
          id={`remove-note-${reg.id}`}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="nt Saame aru, et jäid haigeks – kosu kiiresti! Ootame sind järgmisesse õpituppa."
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />

        <label className="flex items-start gap-3 mt-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyUser}
            onChange={(e) => setNotifyUser(e.target.checked)}
            className="mt-1 w-4 h-4 accent-black cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            Saada osalejale teavituskiri koos nupuga „Registreeru uuesti&ldquo;
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-2 ml-7">Haldurile (saaremaalong@gmail.com) läheb teade alati.</p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-full cursor-pointer hover:bg-gray-50 disabled:opacity-50"
          >
            Tühista
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notifyUser, message.trim())}
            disabled={busy}
            className="flex-1 bg-red-900 text-white py-2.5 rounded-full cursor-pointer hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? "Eemaldan..." : "Eemalda"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Broneeringu kõik inimesed eraldi (esimene on broneerija)
export function registrationPeople(reg: WorkshopRegistration) {
  return [
    { name: reg.name, email: reg.email, phone: reg.phone },
    ...(reg.extra_participants ?? []).map((p) => ({ name: p.name, email: p.email, phone: p.phone })),
  ];
}

// CSV: üks rida iga inimese kohta (ka grupibroneeringu liikmed eraldi)
export function registrationsToCsv(regs: WorkshopRegistration[], workshops: Workshop[] = []) {
  const titles = new Map(workshops.map((w) => [w.id, w.title]));
  const header = ["Nimi", "E-post", "Telefon", "Broneerija", "Staatus", "Õpituba", "Materjalid", "Sõnum", "Registreeritud"];
  const rows = regs.flatMap((r) =>
    registrationPeople(r).map((p, i) => [
      p.name,
      p.email,
      p.phone,
      i === 0 ? "" : r.name,
      STATUS_LABELS[r.status],
      r.workshop_id ? titles.get(r.workshop_id) ?? "" : "Üldine huviliste nimekiri",
      i === 0 ? (r.wants_materials ? "Jah" : "Ei") : "",
      i === 0 ? r.message : "",
      new Date(r.created_at).toLocaleString("et-EE"),
    ])
  );
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${csvSafe(String(v ?? "")).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  return "\uFEFF" + csv;
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
      // Kohta hõivab ainult kinnitatud registreering (sama loogika mis SQL workshop_seats_taken)
      .filter((r) => r.workshop_id === w.id && r.status === "confirmed")
      .reduce((sum, r) => sum + r.participants, 0)
  );
}
