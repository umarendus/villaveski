"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import type { EmailOtpType } from "@supabase/supabase-js";

type Status = "checking" | "ready" | "invalid" | "done";

export default function UusParoolPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Uue kirja saatmine, kui link on aegunud
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  // Loeme hashi kohe esimesel renderdusel - supabase-js pühib selle ära
  // niipea kui ta on tokenid sisse lugenud, seega hiljem oleks juba hilja.
  const hash = useRef<string>(typeof window === "undefined" ? "" : window.location.hash);

  useEffect(() => {
    // Link võib jõuda kahel kujul:
    //  a) ?token_hash=...&type=invite|recovery  - e-kirja mall ehitab lingi ise
    //  b) #access_token=...&type=recovery       - Supabase /verify suunas siia
    const query = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.current.replace(/^#/, ""));

    const linkType = query.get("type") ?? hashParams.get("type");
    if (linkType === "invite" || linkType === "signup") setIsInvite(true);

    const listener = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    async function verifyLink() {
      const tokenHash = query.get("token_hash");

      if (tokenHash && linkType) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: linkType as EmailOtpType,
        });
        setStatus(error ? "invalid" : "ready");
        // Koristame tokeni URL-ist ära, et see ei jääks ajalukku
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      // getSession() ootab ära hashi töötlemise, seega siit saame lõpliku vastuse
      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? "ready" : "invalid");
    }

    verifyLink();

    return () => listener.data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Parool peab olema vähemalt 8 tähemärki.");
    if (password !== password2) return setError("Paroolid ei kattu.");

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) return setError(updateError.message);
    setStatus("done");
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail) return;
    await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/uus-parool`,
    });
    // Ei ütle kunagi, kas e-post oli olemas - muidu saaks kontosid nuhkida
    setResendSent(true);
  }

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
    >
      <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm w-full max-w-md flex flex-col gap-4">
        {status === "checking" && (
          <p className="text-center text-gray-500">Kontrollin linki...</p>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-2xl font-semibold text-center text-gray-900">
              Link ei kehti
            </h1>
            <p className="text-center text-gray-600 text-sm">
              See link on aegunud või juba ära kasutatud. Telli allpool uus.
            </p>

            {resendSent ? (
              <p className="text-center text-green-700 text-sm mt-2">
                Kui selle e-postiga konto on olemas, saatsime sinna uue lingi.
              </p>
            ) : (
              <form onSubmit={handleResend} className="flex flex-col gap-3 mt-2">
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="E-post"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white py-2 rounded-md font-medium cursor-pointer hover:bg-gray-800 transition"
                >
                  Saada uus link
                </button>
              </form>
            )}

            <Link href="/tootepildid" className="text-center text-sm text-gray-500 underline mt-2">
              Tagasi sisselogimisse
            </Link>
          </>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-2xl font-semibold text-center text-gray-900">
              {isInvite ? "Määra oma parool" : "Uus parool"}
            </h1>
            <p className="text-center text-gray-600 text-sm">
              {isInvite
                ? "Tere tulemast! Vali endale parool, millega edaspidi sisse logid."
                : "Sisesta uus parool. Pärast salvestamist oled kohe sisse logitud."}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="Uus parool"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Korda parooli"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />

              {error && <p className="text-red-700 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="bg-gray-900 text-white py-2 rounded-md font-medium cursor-pointer hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? "Salvestan..." : "Salvesta parool"}
              </button>
            </form>
          </>
        )}

        {status === "done" && (
          <>
            <h1 className="text-2xl font-semibold text-center text-gray-900">Parool salvestatud</h1>
            <p className="text-center text-gray-600 text-sm">
              Oled sisse logitud. Brauser võib nüüd pakkuda uue parooli salvestamist – võta pakkumine vastu.
            </p>
            <Link
              href="/tootepildid"
              className="bg-gray-900 text-white py-2 rounded-md font-medium text-center hover:bg-gray-800 transition mt-2"
            >
              Pildihaldusse
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
