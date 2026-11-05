"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Mail, Monitor, RotateCcw, Save, Send, Smartphone } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import Select from "@/components/ui/Select";
import {
  TEMPLATE_DEFS,
  TEMPLATE_KEYS,
  availablePlaceholders,
  renderEmail,
  sampleEmailData,
  validateTemplate,
  type TemplateKey,
  type TemplateTexts,
} from "@/app/lib/emailTemplates";
import type { EmailTemplateRow, Workshop } from "../../../../types/supabase";

const FIELDS: { key: keyof TemplateTexts; label: string; hint?: string; rows?: number }[] = [
  { key: "subject", label: "Teema", hint: "Kirja pealkiri postkastis" },
  { key: "preheader", label: "Eelvaate rida", hint: "Lühike tekst, mida postkast näitab teema järel" },
  { key: "heading", label: "Pealkiri kirjas" },
  { key: "intro", label: "Sissejuhatus", hint: "Enne õpitoa andmeid. Tühi rida = uus lõik, **tekst** = paks", rows: 6 },
  { key: "button_label", label: "Nupu tekst", hint: "Nupu link on fikseeritud" },
  { key: "outro", label: "Lõpp ja allkiri", hint: "Pärast nuppu", rows: 6 },
];

const inputClass =
  "w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent";

async function api(method: "PUT" | "POST" | "DELETE", body?: object, query = "") {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/opitoad/mallid${query}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Päring ebaõnnestus");
  return json;
}

export default function EmailTemplatesManager({ workshops }: { workshops: Workshop[] }) {
  const [saved, setSaved] = useState<Partial<Record<TemplateKey, EmailTemplateRow>>>({});
  const [active, setActive] = useState<TemplateKey>("registration_received");
  const [texts, setTexts] = useState<TemplateTexts>(TEMPLATE_DEFS.registration_received.defaults);
  const [previewWorkshopId, setPreviewWorkshopId] = useState<string>("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const focused = useRef<{ field: keyof TemplateTexts; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);

  useEffect(() => {
    supabase
      .from("email_templates")
      .select("*")
      .then(({ data }) => {
        const map: Partial<Record<TemplateKey, EmailTemplateRow>> = {};
        (data ?? []).forEach((row) => (map[row.key as TemplateKey] = row));
        setSaved(map);
        const row = map.registration_received;
        if (row) setTexts(rowToTexts(row));
      });
  }, []);

  function rowToTexts(row: EmailTemplateRow): TemplateTexts {
    return {
      subject: row.subject,
      preheader: row.preheader,
      heading: row.heading,
      intro: row.intro,
      button_label: row.button_label,
      outro: row.outro,
    };
  }

  function savedTexts(key: TemplateKey) {
    const row = saved[key];
    return row ? rowToTexts(row) : TEMPLATE_DEFS[key].defaults;
  }

  const dirty = JSON.stringify(texts) !== JSON.stringify(savedTexts(active));

  function select(key: TemplateKey) {
    if (dirty && !confirm("Salvestamata muudatused lähevad kaotsi. Jätkata?")) return;
    setActive(key);
    setTexts(savedTexts(key));
    setMessage(null);
  }

  // Muutuja lisamine viimati aktiivsesse välja kursori kohale
  function insert(token: string) {
    const f = focused.current;
    const field = f?.field ?? "intro";
    const current = texts[field];
    const start = f?.el.selectionStart ?? current.length;
    const end = f?.el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setTexts((t) => ({ ...t, [field]: next }));
    requestAnimationFrame(() => {
      if (!f) return;
      f.el.focus();
      f.el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const validation = useMemo(() => validateTemplate(active, texts), [active, texts]);
  const allText = Object.values(texts).join("\n");
  const def = TEMPLATE_DEFS[active];

  const previewWorkshop = workshops.find((w) => w.id === previewWorkshopId) ?? null;
  const preview = useMemo(
    () => renderEmail(active, texts, sampleEmailData(previewWorkshop)),
    [active, texts, previewWorkshop]
  );

  async function save() {
    if (validation.errors.length) return setMessage({ type: "error", text: validation.errors.join(" ") });
    setBusy(true);
    setMessage(null);
    try {
      await api("PUT", { key: active, texts });
      setSaved((s) => ({
        ...s,
        [active]: { key: active, ...texts, updated_at: new Date().toISOString(), updated_by: null },
      }));
      setMessage({ type: "ok", text: "Mall salvestatud. Uued kirjad kasutavad seda teksti." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Salvestamine ebaõnnestus" });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm("Taastada selle kirja vaikimisi tekst?")) return;
    setBusy(true);
    try {
      await api("DELETE", undefined, `?key=${active}`);
      setSaved((s) => {
        const next = { ...s };
        delete next[active];
        return next;
      });
      setTexts(TEMPLATE_DEFS[active].defaults);
      setMessage({ type: "ok", text: "Vaikimisi tekst taastatud." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Viga" });
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (validation.errors.length) return setMessage({ type: "error", text: validation.errors.join(" ") });
    setBusy(true);
    setMessage(null);
    try {
      const res = await api("POST", { key: active, texts, workshopId: previewWorkshopId || null });
      setMessage({ type: "ok", text: `Testkiri saadetud aadressile ${res.to}.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Saatmine ebaõnnestus" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* Mallide nimekiri */}
      {/* Telefonis rippmenüü, lauaarvutis nimekiri */}
      <div className="lg:hidden">
        <label className="block text-sm text-gray-600 mb-1.5">Vali kiri</label>
        <Select
          value={active}
          onChange={(v) => select(v as TemplateKey)}
          ariaLabel="Vali muudetav e-kiri"
          options={TEMPLATE_KEYS.map((k) => ({
            value: k,
            label: `${TEMPLATE_DEFS[k].recipient === "Haldurile" ? "Haldurile · " : ""}${TEMPLATE_DEFS[k].label}${saved[k] ? " (muudetud)" : ""}`,
          }))}
        />
      </div>
      <aside className="hidden lg:block space-y-4">
        {(["Osalejale", "Haldurile"] as const).map((group) => (
          <div key={group}>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 px-1">{group}</p>
            <div className="space-y-1">
              {TEMPLATE_KEYS.filter((k) => TEMPLATE_DEFS[k].recipient === group).map((k) => (
                <button
                  key={k}
                  onClick={() => select(k)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition ${
                    active === k ? "bg-black text-white" : "hover:bg-white text-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate text-sm">{TEMPLATE_DEFS[k].label}</span>
                  </span>
                  {saved[k] && (
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        active === k ? "bg-white/20" : "bg-[#f7f4ef] text-[#7a5f40]"
                      }`}
                    >
                      muudetud
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <div className="grid xl:grid-cols-2 gap-6 min-w-0">
        {/* Redaktor */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 min-w-0">
          <h2 className="text-2xl text-black" style={{ fontFamily: "'Abril Fatface', serif" }}>
            {def.label}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            {def.recipient} · {def.when}
          </p>

          {/* Muutujad */}
          <div className="mb-5">
            <p className="text-sm text-gray-600 mb-2">
              Muutujad – klõpsa, et lisada kursori kohale. <span className="text-red-800">Punased</span> on kohustuslikud.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availablePlaceholders(active).map((p) => {
                const required = def.required.includes(p.token);
                const present = allText.includes(p.token);
                return (
                  <button
                    key={p.token}
                    type="button"
                    title={p.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insert(p.token)}
                    className={`text-xs font-mono px-2 py-1 rounded-md border cursor-pointer transition flex items-center gap-1 ${
                      required
                        ? present
                          ? "border-green-300 bg-green-50 text-green-900"
                          : "border-red-300 bg-red-50 text-red-900"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {required && (present ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />)}
                    {p.token}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {FIELDS.map((f) => {
              const props = {
                id: `tpl-${f.key}`,
                value: texts[f.key],
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTexts((t) => ({ ...t, [f.key]: e.target.value })),
                onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  (focused.current = { field: f.key, el: e.target }),
                onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  (focused.current = { field: f.key, el: e.currentTarget }),
                className: `${inputClass} ${f.rows ? "resize-y" : ""}`,
              };
              return (
                <div key={f.key}>
                  <label htmlFor={`tpl-${f.key}`} className="block text-sm text-gray-700 mb-1">
                    {f.label}
                  </label>
                  {f.rows ? <textarea rows={f.rows} {...props} /> : <input {...props} />}
                  {f.hint && <p className="text-xs text-gray-500 mt-1">{f.hint}</p>}
                </div>
              );
            })}
          </div>

          {validation.errors.length > 0 && (
            <div className="mt-5 text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
              {validation.errors.map((e) => (
                <p key={e} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm rounded-lg px-4 py-3 border ${
                message.type === "ok" ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={save}
              disabled={busy || !dirty || validation.errors.length > 0}
              className="flex items-center gap-2 bg-black text-white rounded-full px-5 py-2.5 cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title={validation.errors.length ? "Paranda vead enne salvestamist" : undefined}
            >
              <Save className="w-4 h-4" /> Salvesta
            </button>
            <button
              onClick={sendTest}
              disabled={busy || validation.errors.length > 0}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-5 py-2.5 cursor-pointer hover:bg-gray-50 disabled:opacity-40"
            >
              <Send className="w-4 h-4" /> Saada testkiri endale
            </button>
            {saved[active] && (
              <button
                onClick={reset}
                disabled={busy}
                className="flex items-center gap-2 text-gray-600 hover:text-black px-3 py-2.5 cursor-pointer text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Taasta vaikimisi
              </button>
            )}
          </div>
        </section>

        {/* Eelvaade */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-lg text-black">Eelvaade</h3>
            <div className="flex items-center gap-2">
              <Select
                variant="pill"
                value={previewWorkshopId}
                onChange={setPreviewWorkshopId}
                ariaLabel="Millise õpitoa andmetega eelvaadet näidata"
                className="max-w-[220px]"
                options={[{ value: "", label: "Näidisõpituba" }, ...workshops.map((w) => ({ value: w.id, label: w.title }))]}
              />
              <div className="flex border border-gray-300 rounded-full overflow-hidden">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`p-1.5 px-2.5 cursor-pointer ${device === "desktop" ? "bg-black text-white" : "bg-white"}`}
                  aria-label="Arvuti vaade"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`p-1.5 px-2.5 cursor-pointer ${device === "mobile" ? "bg-black text-white" : "bg-white"}`}
                  aria-label="Telefoni vaade"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden xl:sticky xl:top-20">
            <div className="px-4 py-3 border-b border-gray-100 text-sm">
              <p className="text-gray-500">
                Teema: <span className="text-black font-semibold">{preview.subject}</span>
              </p>
            </div>
            <div className="bg-[#f4f1ec] flex justify-center">
              <iframe
                title="Kirja eelvaade"
                srcDoc={preview.html}
                sandbox=""
                className="border-0 bg-[#f4f1ec] transition-all"
                style={{ width: device === "mobile" ? 375 : "100%", height: 720 }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Eelvaates on näidisandmed (Mari Maasikas, 2 osalejat). Päris kirjas asenduvad muutujad registreerija andmetega.
          </p>
        </section>
      </div>
    </div>
  );
}
