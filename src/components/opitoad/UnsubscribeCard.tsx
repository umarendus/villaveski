"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MailX } from "lucide-react";
import { SheepPair } from "./RegistrationForm";

const abril = { fontFamily: "'Abril Fatface', serif" };

type Props = {
  token: string | null;
  maskedEmail: string | null;
  activeWorkshops: string[];
  hasData: boolean;
};

// Teavitustest loobumise kinnitus: alles nupuvajutusel kustutatakse andmed
export default function UnsubscribeCard({ token, maskedEmail, activeWorkshops, hasData }: Props) {
  const [state, setState] = useState<"ask" | "busy" | "done" | "error">("ask");
  const [error, setError] = useState("");

  async function unsubscribe() {
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/opitoad/loobu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Midagi läks valesti.");
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Midagi läks valesti.");
      setState("error");
    }
  }

  const card = "w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#be9f7a]/30 p-7 sm:p-10 text-center";
  const text = { fontFamily: "var(--font-raleway)", fontWeight: 500 };

  if (!token) {
    return (
      <div className={card} style={text}>
        <SheepPair />
        <h1 className="text-3xl text-black mt-4 mb-3" style={abril}>
          Link ei kehti
        </h1>
        <p className="text-gray-700 leading-relaxed">
          See loobumise link on vigane või puudulik. Kasuta palun linki otse meie e-kirjast või kirjuta meile ja
          eemaldame sinu andmed käsitsi.
        </p>
        <a
          href="mailto:saaremaalong@gmail.com?subject=Teavitustest%20loobumine"
          className="inline-block mt-7 bg-black text-white rounded-full px-8 py-3.5 hover:bg-gray-800 transition-colors"
          style={{ fontWeight: 700 }}
        >
          Kirjuta meile
        </a>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className={card} style={text}>
        <CheckCircle2 className="w-14 h-14 mx-auto text-green-700" />
        <h1 className="text-3xl text-black mt-4 mb-3" style={abril}>
          Oled loobunud
        </h1>
        <p className="text-gray-700 leading-relaxed">
          Me ei saada sulle enam õpitubade teavitusi ning kõik sinuga seotud andmed on meie andmebaasist kustutatud.
        </p>
        <p className="text-gray-500 text-sm mt-4">Kui soovid kunagi uuesti tulla, oled alati oodatud – lihtsalt registreeru uuesti.</p>
        <Link
          href="/opitoad"
          className="inline-block mt-7 bg-black text-white rounded-full px-8 py-3.5 hover:bg-gray-800 transition-colors"
          style={{ fontWeight: 700 }}
        >
          Vaata õpitubasid
        </Link>
      </div>
    );
  }

  return (
    <div className={card} style={text}>
      <span className="w-14 h-14 mx-auto rounded-full bg-[#f7f4ef] border border-[#be9f7a]/50 text-[#7a5f40] flex items-center justify-center">
        <MailX className="w-7 h-7" />
      </span>
      <h1 className="text-3xl sm:text-4xl text-black mt-5 mb-3" style={abril}>
        Loobu teavitustest
      </h1>
      <p className="text-gray-700 leading-relaxed">
        Aadressile <strong className="text-black">{maskedEmail}</strong> ei saadeta enam Sörve Villaveski õpitubade
        teavitusi ning <strong className="text-black">kõik sinuga seotud andmed kustutatakse</strong> (huviliste nimekiri ja
        registreeringud).
      </p>

      {activeWorkshops.length > 0 && (
        <div className="flex gap-3 text-left bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mt-6 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Sul on registreering eelseisvale õpitoale: <strong>{activeWorkshops.join(", ")}</strong>. Loobudes kustutatakse
            ka see ning sinu koht vabaneb teistele.
          </p>
        </div>
      )}
      {!hasData && (
        <p className="text-sm text-gray-500 mt-4">Meie andmebaasis ei ole selle aadressiga seotud andmeid.</p>
      )}

      {state === "error" && (
        <p className="mt-5 text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/opitoad"
          className="flex-1 border border-gray-300 text-gray-700 rounded-full px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          Jätan teavitused alles
        </Link>
        <button
          type="button"
          onClick={unsubscribe}
          disabled={state === "busy"}
          className="flex-1 bg-black text-white rounded-full px-5 py-3.5 cursor-pointer hover:bg-gray-800 transition-colors disabled:opacity-60"
          style={{ fontWeight: 700 }}
        >
          {state === "busy" ? "Kustutan…" : "Loobu ja kustuta andmed"}
        </button>
      </div>
    </div>
  );
}
