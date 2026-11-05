"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Megaphone, X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { formatShortDate } from "@/app/lib/opitoad";
import { TEMPLATE_DEFS, renderEmail, sampleEmailData, type TemplateTexts } from "@/app/lib/emailTemplates";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import type { Workshop } from "../../../../types/supabase";

type Recipient = { name: string; email: string };

async function call(body: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/opitoad/teavita", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Päring ebaõnnestus");
  return json;
}

// "Teavita huvilisi": uue õpitoa kiri kõigile huviliste nimekirjas olijatele
export default function AnnounceModal({
  workshop,
  onClose,
  onSent,
}: {
  workshop: Workshop;
  onClose: () => void;
  onSent: (count: number) => void;
}) {
  useBodyScrollLock();
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [texts, setTexts] = useState<TemplateTexts>(TEMPLATE_DEFS.new_workshop_announcement.defaults);
  const [showList, setShowList] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);

  useEffect(() => {
    call({ workshopId: workshop.id, dryRun: true })
      .then((r) => setRecipients(r.recipients))
      .catch((e) => setError(e.message));
    supabase
      .from("email_templates")
      .select("*")
      .eq("key", "new_workshop_announcement")
      .maybeSingle()
      .then(({ data }) => data && setTexts(data));
  }, [workshop.id]);

  const preview = useMemo(() => {
    const d = sampleEmailData(workshop);
    if (recipients?.[0]) d.reg = { ...d.reg, name: recipients[0].name };
    return renderEmail("new_workshop_announcement", texts, d);
  }, [workshop, texts, recipients]);

  async function send() {
    setSending(true);
    setError("");
    try {
      const r = await call({ workshopId: workshop.id });
      setResult(r);
      onSent(r.sent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saatmine ebaõnnestus");
    } finally {
      setSending(false);
    }
  }

  const count = recipients?.length ?? 0;
  const seconds = Math.ceil(count * 1.2);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-stretch md:items-center justify-center md:p-6"
      onClick={() => !sending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announce-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-gray-800 w-full max-w-3xl flex flex-col h-[100dvh] md:h-auto md:max-h-[calc(100dvh-3rem)] md:rounded-2xl shadow-2xl overflow-hidden"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <div className="shrink-0 flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-200">
          <h2 id="announce-title" className="text-2xl text-black flex items-center gap-3" style={{ fontFamily: "'Abril Fatface', serif" }}>
            <Megaphone className="w-6 h-6" /> Teavita huvilisi
          </h2>
          <button type="button" onClick={onClose} disabled={sending} className="p-2 cursor-pointer text-gray-500 hover:text-black" aria-label="Sulge">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 md:p-6 space-y-5">
          {result ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto text-green-700" />
              <p className="text-2xl text-black mt-4" style={{ fontFamily: "'Abril Fatface', serif" }}>
                Saadetud {result.sent} kirja
              </p>
              {result.failed.length > 0 && (
                <p className="text-sm text-red-800 mt-3">Ei õnnestunud: {result.failed.join(", ")}</p>
              )}
              <p className="text-gray-600 mt-3">Huvilised saavad kirja nupuga „Registreeru“, mis viib otse selle õpitoa juurde.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-700">
                Kiri uuest õpitoast <strong className="text-black">{workshop.title}</strong> läheb kõigile, kes on end
                huviliste nimekirja pannud. Kes on sellele õpitoale juba registreerunud, ei saa kirja topelt.
              </p>

              {workshop.announced_at && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Sellest õpitoast on juba teavitatud {formatShortDate(workshop.announced_at)} ({workshop.announced_count}{" "}
                    inimest). Uuesti saates saavad needki inimesed kirja teist korda.
                  </p>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setShowList((v) => !v)}
                  disabled={!count}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
                >
                  <span>
                    {recipients === null ? (
                      "Laen huviliste nimekirja…"
                    ) : (
                      <>
                        Saajaid: <strong className="text-black text-lg">{count}</strong>
                      </>
                    )}
                  </span>
                  {count > 0 && (
                    <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${showList ? "rotate-180" : ""}`} />
                  )}
                </button>
                {showList && recipients && (
                  <ul className="border-t border-gray-100 max-h-48 overflow-y-auto px-4 py-2 text-sm">
                    {recipients.map((r) => (
                      <li key={r.email} className="py-1 flex justify-between gap-3">
                        <span className="text-black truncate">{r.name}</span>
                        <span className="text-gray-500 truncate">{r.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {count > 0 && (
                <p className="text-xs text-gray-500">
                  Kirjad saadetakse ükshaaval (~{seconds} s). EmailJS tasuta paketis on kuus kokku 200 kirja, sh kontaktivorm.
                  Kirja teksti saad muuta vahekaardil „E-kirjad“ → „Uus õpituba huvilistele“.
                </p>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Eelvaade · Teema: <span className="text-black font-semibold">{preview.subject}</span>
                </p>
                <iframe
                  title="Kirja eelvaade"
                  srcDoc={preview.html}
                  sandbox=""
                  className="w-full h-[420px] border border-gray-200 rounded-xl bg-[#f4f1ec]"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
        </div>

        <div className="shrink-0 flex justify-end gap-2 sm:gap-3 px-5 md:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-200">
          {result ? (
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full bg-black text-white cursor-pointer hover:bg-gray-800">
              Valmis
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 cursor-pointer hover:bg-gray-50 disabled:opacity-50"
              >
                Tühista
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || !count}
                className="px-6 py-2.5 rounded-full bg-black text-white cursor-pointer hover:bg-gray-800 disabled:opacity-40"
              >
                {sending ? `Saadan… (~${seconds} s)` : count ? `Saada ${count} kirja` : "Saajaid pole"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
