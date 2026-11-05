"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";

const raleway = { fontFamily: "var(--font-raleway)", fontWeight: 500 };

// Halduslehtede ülemine menüü – sama sisselogimine kehtib kõigil halduslehtedel
export function AdminNav({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/haldus/tooted", label: "Tooted" },
    { href: "/haldus/opitoad", label: "Õpitoad" },
  ];
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200" style={raleway}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/haldus" className="flex items-center mr-2 sm:mr-4" title="Halduse avaleht">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sheep-black-l.svg" alt="" className="h-7" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sheep-black-r.svg" alt="" className="h-7" />
          </Link>
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-sm sm:text-base transition ${
                  active ? "bg-black text-white" : "text-gray-600 hover:text-black hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-1">{right}</div>
      </div>
    </nav>
  );
}

// Sisselogimise ümbris õpitubade halduslehtedele
export default function AdminShell({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setReady(true);
      if (!s) return setIsAdmin(null);
      if (event === "TOKEN_REFRESHED") return;
      // Supabase'i päringut ei tehta otse kuulaja sees (võib lukustuda), vaid järgmisel tsüklil
      setTimeout(() => {
        supabase.rpc("is_workshop_admin").then(({ data }) => setIsAdmin(data === true));
      }, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!email || !password) return setLoginError("Sisesta e-post ja parool.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setLoginError(error.message);
    setPassword("");
  }

  async function handleForgotPassword() {
    if (!email) return setLoginError("Sisesta esmalt oma e-post, siis vajuta uuesti.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/uus-parool`,
    });
    if (error) return setLoginError(error.message);
    setResetSent(true);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) return setPasswordError("Parool peab olema vähemalt 8 tähemärki.");
    if (newPassword !== newPassword2) return setPasswordError("Paroolid ei kattu.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) return setPasswordError(error.message);
    setNewPassword("");
    setNewPassword2("");
    setShowChangePassword(false);
  }

  async function logout() {
    if (!confirm("Kas logid välja?")) return;
    await supabase.auth.signOut({ scope: "local" });
  }

  const inputClass =
    "border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <AdminNav
        right={
          session && (
            <>
              <button
                onClick={() => setShowChangePassword(true)}
                className="hidden sm:block text-gray-600 py-2 px-3 rounded-md cursor-pointer hover:text-black text-sm"
                style={raleway}
              >
                Muuda parooli
              </button>
              <button
                onClick={logout}
                className="text-red-900 py-2 px-3 rounded-md cursor-pointer hover:text-red-700 text-sm"
                style={raleway}
              >
                Logi välja
              </button>
            </>
          )
        }
      />

      {ready && session && isAdmin && children(session)}

      {ready && session && isAdmin === false && (
        <div className="max-w-md mx-auto mt-24 px-6 text-center" style={raleway}>
          <h2 className="text-2xl text-black mb-3">Ligipääs puudub</h2>
          <p className="text-gray-600">
            Kontol {session.user.email} pole õpitubade halduse õigust. Vajadusel lisa e-post Supabase&apos;i tabelisse
            workshop_admins.
          </p>
        </div>
      )}

      {ready && !session && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleLogin}
            method="post"
            className="bg-white border border-gray-200 p-7 sm:p-8 rounded-xl shadow-lg w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col gap-4"
            style={raleway}
          >
            <div className="flex justify-center" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sheep-black-l.svg" alt="" className="h-8" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sheep-black-r.svg" alt="" className="h-8" />
            </div>
            <h2 className="text-2xl text-center text-black -mb-2" style={{ fontFamily: "'Abril Fatface', serif" }}>
              Villaveski haldus
            </h2>
            <p className="text-center text-sm text-gray-500 mb-1">Logi sisse</p>
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Parool"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {loginError && <p className="text-red-700 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="bg-gray-900 cursor-pointer text-white py-2 rounded-md font-medium hover:bg-gray-800 transition mt-2"
            >
              Logi sisse
            </button>
            {resetSent ? (
              <p className="text-center text-green-700 text-sm">
                Kui selle e-postiga konto on olemas, saatsime sinna parooli taastamise lingi.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-center text-sm text-gray-500 underline cursor-pointer hover:text-gray-700 transition"
              >
                Unustasid parooli?
              </button>
            )}
          </form>
        </div>
      )}

      {showChangePassword && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setShowChangePassword(false)}
        >
          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-gray-200 p-7 sm:p-8 rounded-xl shadow-lg w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col gap-4"
            style={raleway}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-center text-gray-900">Muuda parooli</h2>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Uus parool"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Korda parooli"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className={inputClass}
            />
            {passwordError && <p className="text-red-700 text-sm">{passwordError}</p>}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md cursor-pointer hover:bg-gray-50"
              >
                Tühista
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gray-900 text-white py-2 rounded-md cursor-pointer hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Salvestan..." : "Salvesta"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
