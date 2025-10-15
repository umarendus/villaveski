"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
  e.preventDefault();
  if (!email || !password) return alert("Sisesta e-post ja parool");

  setLoading(true);
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  setLoading(false);

  if (error) {
    alert(error.message);
  } else {
    alert("Kasutaja loodud! Saad nüüd sisse logida.");
    router.push("/tootepildid");
  }
}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <form
        className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 rounded-xl shadow-lg"
        onSubmit={handleRegister}
      >
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
          Registreeri
        </h2>

        <div className="flex flex-col">
          <label htmlFor="email" className="mb-1 text-gray-700 font-medium">
            E-post
          </label>
          <input
            id="email"
            type="email"
            placeholder="sisesta oma e-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="password" className="mb-1 text-gray-700 font-medium">
            Parool
          </label>
          <input
            id="password"
            type="password"
            placeholder="sisesta oma parool"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        <button
          type="submit"
          className="mt-4 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
          disabled={loading}
        >
          {loading ? "Laeb..." : "Registreeri"}
        </button>
      </form>
    </div>
  );
}
