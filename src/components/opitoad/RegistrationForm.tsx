"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, MailCheck } from "lucide-react";
import Turnstile, { turnstileEnabled } from "./Turnstile";
import Select from "@/components/ui/Select";
import { formatPrice } from "@/app/lib/opitoad";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import Portal from "@/components/ui/Portal";

type Props = {
  workshopId: string | null;
  mode: "register" | "waitlist";
  maxParticipants: number;
  priceEur?: number;
  queue?: boolean; // ootel rohkem inimesi kui vabu kohti
  onRegistered?: (seatsLeft: number | null) => void;
};

type Extra = { name: string; email: string; phone: string };

const inputClass =
  "w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";

const labelClass = "block text-sm text-gray-700 mb-1.5 tracking-wide";

export default function RegistrationForm({ workshopId, mode, maxParticipants, priceEur, queue, onRegistered }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    participants: 1,
    wantsMaterials: false,
    message: "",
    consent: false,
    website: "",
  });
  const [extras, setExtras] = useState<Extra[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "pending" | "waitlist">(null);
  const [showModal, setShowModal] = useState(false);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => setStartedAt(Date.now()), []);

  // Iga lisaosaleja saab oma väljad
  function setParticipants(n: number) {
    set("participants", n);
    setExtras((prev) => Array.from({ length: n - 1 }, (_, i) => prev[i] ?? { name: "", email: "", phone: "" }));
  }

  function setExtra(index: number, key: keyof Extra, value: string) {
    setExtras((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (extras.some((p) => p.name.trim().length < 2)) return setError("Palun sisesta kõigi osalejate nimed.");
    if (turnstileEnabled && !token) return setError("Palun kinnita, et sa pole robot.");

    setLoading(true);
    try {
      const res = await fetch("/api/opitoad/registreeru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, extraParticipants: extras, workshopId, startedAt, turnstileToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Midagi läks valesti. Proovi palun uuesti.");
        setToken("");
        setResetKey((k) => k + 1);
        return;
      }
      setSentTo(form.email.trim());
      setDone(data.status === "waitlist" ? "waitlist" : "pending");
      setShowModal(true);
      onRegistered?.(data.seatsLeft ?? null);
    } catch {
      setError("Ühendus ebaõnnestus. Kontrolli internetiühendust ja proovi uuesti.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <>
      <Portal>
        <AnimatePresence>
          {showModal && <SentModal mode={done} email={sentTo} queue={queue} onClose={() => setShowModal(false)} />}
        </AnimatePresence>
      </Portal>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#be9f7a]/40 rounded-2xl p-8 md:p-10 text-center"
      >
        <SheepPair />
        <h3 className="text-2xl md:text-3xl text-black mt-4 mb-3" style={{ fontFamily: "'Abril Fatface', serif" }}>
          {done === "waitlist" ? "Oled kirjas!" : "Aitäh, registreering on saadetud!"}
        </h3>
        <p className="text-gray-700 text-lg leading-relaxed max-w-lg mx-auto">
          {done === "waitlist"
            ? "Lisasime sind huviliste nimekirja. Kui avame uue õpitoa, anname sulle esimesena teada."
            : "Saatsime sulle e-kirja. Villaveski vaatab registreeringu üle ja oled õpitoasse registreeritud alles siis, kui saad meilt kinnituskirja."}
        </p>
      </motion.div>
      </>
    );
  }

  const participantOptions = Array.from({ length: Math.max(1, Math.min(maxParticipants, 6)) }, (_, i) => i + 1);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm text-left"
      style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      noValidate
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-name" className={labelClass}>
            Nimi *
          </label>
          <input
            id="reg-name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            placeholder="Ees- ja perekonnanimi"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className={labelClass}>
            E-post *
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
            placeholder="nimi@näide.ee"
          />
        </div>
        <div>
          <label htmlFor="reg-phone" className={labelClass}>
            Telefon
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
            placeholder="+372 ..."
          />
        </div>
        <div>
          <label htmlFor="reg-participants" className={labelClass}>
            Osalejate arv
          </label>
          <Select
            id="reg-participants"
            value={String(form.participants)}
            onChange={(v) => setParticipants(Number(v))}
            options={participantOptions.map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "inimene" : "inimest"}` }))}
          />
          {mode === "register" && priceEur !== undefined && priceEur > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Kokku:{" "}
              <span className="text-black font-semibold">
                {form.participants > 1
                  ? `${form.participants} × ${formatPrice(priceEur)} = ${formatPrice(priceEur * form.participants)}`
                  : formatPrice(priceEur)}
              </span>{" "}
              · maksmine kohapeal
            </p>
          )}
        </div>
      </div>

      {extras.length > 0 && (
        <div className="mt-6 space-y-4">
          {extras.map((p, i) => (
            <motion.fieldset
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#be9f7a]/40 bg-[#faf7f2] rounded-xl p-4 md:p-5"
            >
              <legend className="px-2 text-sm uppercase tracking-widest text-[#8a6f4f]">{i + 2}. osaleja</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={`reg-extra-name-${i}`} className={labelClass}>
                    Nimi *
                  </label>
                  <input
                    id={`reg-extra-name-${i}`}
                    required
                    value={p.name}
                    onChange={(e) => setExtra(i, "name", e.target.value)}
                    className={inputClass}
                    placeholder="Ees- ja perekonnanimi"
                  />
                </div>
                <div>
                  <label htmlFor={`reg-extra-email-${i}`} className={labelClass}>
                    E-post
                  </label>
                  <input
                    id={`reg-extra-email-${i}`}
                    type="email"
                    value={p.email}
                    onChange={(e) => setExtra(i, "email", e.target.value)}
                    className={inputClass}
                    placeholder="soovi korral"
                  />
                </div>
                <div>
                  <label htmlFor={`reg-extra-phone-${i}`} className={labelClass}>
                    Telefon
                  </label>
                  <input
                    id={`reg-extra-phone-${i}`}
                    type="tel"
                    value={p.phone}
                    onChange={(e) => setExtra(i, "phone", e.target.value)}
                    className={inputClass}
                    placeholder="soovi korral"
                  />
                </div>
              </div>
            </motion.fieldset>
          ))}
        </div>
      )}

      {mode === "register" && (
        <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.wantsMaterials}
            onChange={(e) => set("wantsMaterials", e.target.checked)}
            className="mt-1 w-5 h-5 accent-black cursor-pointer"
          />
          <span className="text-gray-800">
            Soovin osta ka materjale juurde (tapikangaspuud, villavorst)
          </span>
        </label>
      )}

      <div className="mt-6">
        <label htmlFor="reg-message" className={labelClass}>
          {mode === "waitlist" ? "Millisest õpitoast oled huvitatud? (soovi korral)" : "Lisainfo või küsimus (soovi korral)"}
        </label>
        <textarea
          id="reg-message"
          rows={4}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Meepott robotitele – inimesed seda ei näe */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="reg-website">Veebileht</label>
        <input
          id="reg-website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-1 w-5 h-5 accent-black cursor-pointer"
          required
        />
        <span className="text-gray-700 text-sm leading-relaxed">
          Nõustun, et Sörve Villaveski kasutab minu andmeid ainult õpitoa korraldamiseks ja minuga
          ühenduse võtmiseks. *
        </span>
      </label>

      <div className="mt-6">
        <Turnstile onToken={setToken} resetKey={resetKey} />
      </div>

      {error && (
        <p role="alert" className="mt-5 text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-8 text-center">
        <button
          type="submit"
          disabled={loading}
          className="inline-block bg-black text-white rounded-full px-10 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
        >
          {loading ? "Saadan..." : mode === "waitlist" ? "Pane mind kirja" : queue ? "Registreeru järjekorda" : "Registreeru õpitoale"}
        </button>
        {mode === "register" && (
          <p className="mt-4 text-sm text-gray-500">Maksmine toimub kohapeal. Registreerimine on tasuta ja kohustustevaba.</p>
        )}
      </div>
    </form>
  );
}

export function SheepPair({ size = "2rem" }: { size?: string }) {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sheep-black-l.svg" alt="" style={{ height: size }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sheep-black-r.svg" alt="" style={{ height: size }} />
    </div>
  );
}

// Pärast vormi saatmist: selgitus, et registreerimine kehtib alles Villaveski kinnituskirjaga
function SentModal({
  mode,
  email,
  queue,
  onClose,
}: {
  mode: "pending" | "waitlist";
  email: string;
  queue?: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const steps =
    mode === "pending"
      ? [
          { icon: <Check className="w-4 h-4" strokeWidth={3} />, title: "Registreerumise kiri on teele pandud", text: `Saatsime kinnituse kättesaamise kohta kirja aadressile ${email}.`, done: true },
          {
            icon: <Mail className="w-4 h-4" />,
            title: queue ? "Oled järjekorras" : "Villaveski vaatab registreeringu üle",
            text: queue
              ? "Registreerunuid on rohkem kui vabu kohti – kinnitame saabumise järjekorras. Kui kohad täituvad, jääd huviliste nimekirja ja saad sellest kirja."
              : "Tavaliselt vastame paari päeva jooksul.",
            done: false,
          },
          { icon: <MailCheck className="w-4 h-4" />, title: "Kinnituskiri = oled registreeritud", text: "Alles kinnituskirja saamisel on sinu koht õpitoas kindel ja vabade kohtade arv lehel väheneb.", done: false },
        ]
      : [
          { icon: <Check className="w-4 h-4" strokeWidth={3} />, title: "Oled huviliste nimekirjas", text: `Saatsime kinnituse aadressile ${email}.`, done: true },
          { icon: <MailCheck className="w-4 h-4" />, title: "Anname märku", text: "Kui avame uue õpitoa või vabaneb koht, kirjutame sulle esimesena.", done: false },
        ];

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sent-modal-title"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-7 md:p-9 text-left"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <SheepPair />
        <h2
          id="sent-modal-title"
          className="text-2xl md:text-3xl text-black text-center mt-4 mb-6"
          style={{ fontFamily: "'Abril Fatface', serif" }}
        >
          {mode === "pending" ? "Aitäh! Kiri on teel" : "Oled kirjas!"}
        </h2>

        <ol className="space-y-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                  s.done ? "bg-black text-white" : "bg-[#f7f4ef] text-[#8a6f4f] border border-[#be9f7a]/50"
                }`}
              >
                {s.icon}
              </span>
              <span>
                <span className="block text-black font-semibold">{s.title}</span>
                <span className="block text-gray-600 text-sm leading-relaxed mt-0.5">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        {mode === "pending" && (
          <p className="mt-6 text-sm text-[#7a5f40] bg-[#f7f4ef] rounded-xl px-4 py-3">
            Kui kirja ei tule, vaata ka rämpsposti kausta.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-7 w-full bg-black text-white rounded-full py-3.5 text-lg cursor-pointer hover:bg-gray-800 transition-colors"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
        >
          Selge
        </button>
      </motion.div>
    </motion.div>
  );
}
