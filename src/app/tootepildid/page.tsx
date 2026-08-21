"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Image from "next/image";

type Photo = {
  id: number;
  title: string;
  image_url: string;
  created_at: string | null;
};

export default function PildidPage() {
 const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Väljalogimise kinnitus
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Parooli muutmine sisseloginult
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Parooli taastamine e-posti teel
  const [resetSent, setResetSent] = useState(false);

  // Photo modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Avab pildi modali
  function openPhotoModal(index: number) {
    setCurrentIndex(index);
    setPhotoModalOpen(true);
  }
  function closePhotoModal() {
    setPhotoModalOpen(false);
  }
  function showNextPhoto() {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }
  function showPrevPhoto() {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }

  useEffect(() => {
    // Kuulame kohe auth muutusi – supabase-js loeb salvestatud sessiooni
    // localStorage'ist ja saadab INITIAL_SESSION sündmuse
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (session) {
        setShowLoginModal(false);
        // TOKEN_REFRESHED korral on pildid juba laetud, ei tee uut päringut
        if (event !== "TOKEN_REFRESHED") loadPhotos();
      } else {
        setShowLoginModal(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return alert("Sisesta e-post ja parool");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      // Parooli ise me ei hoia – brauseri paroolihaldur pakub selle salvestamist,
      // sessioon jääb localStorage'i ja uueneb automaatselt
      setPassword("");
      setShowLoginModal(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) return alert("Sisesta esmalt oma e-post, siis vajuta uuesti.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/uus-parool`,
    });
    if (error) return alert(error.message);
    // Ei paljasta kunagi, kas selline konto on olemas
    setResetSent(true);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) return setPasswordError("Parool peab olema vähemalt 8 tähemärki.");
    if (newPassword !== newPassword2) return setPasswordError("Paroolid ei kattu.");

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) return setPasswordError(error.message);

    setNewPassword("");
    setNewPassword2("");
    setShowChangePassword(false);
    alert("Parool on muudetud. Brauser võib pakkuda uue parooli salvestamist.");
  }

  async function confirmLogout() {
    setLoggingOut(true);
    // scope: "local" – logib välja ainult sellest seadmest, teised seadmed jäävad sisse
    const { error } = await supabase.auth.signOut({ scope: "local" });
    setLoggingOut(false);
    if (error) return alert("Väljalogimine ebaõnnestus: " + error.message);
    setShowLogoutConfirm(false);
    setPhotos([]);
    setSession(null);
    setShowLoginModal(true);
  }

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPhotos(data);
  }

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert("Lisa pilt");

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("product-photos")
      .upload(filePath, file, { contentType: file.type, cacheControl: "3600", upsert: false });

    if (uploadError) return alert(uploadError.message);

    const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    await supabase.from("photos").insert([{ title: title || "", image_url: publicUrl }]);

    setTitle("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadPhotos();
  }

async function removePhoto(id: number, imageUrl: string) {
  if (!confirm("Oled sa kindel, et soovid kustutada selle pildi?")) return;

  try {
    // Eemalda fail bucketist
    const filePath = imageUrl.split("/product-photos/")[1]; // võtab failinime
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from("product-photos")
        .remove([filePath]);
      if (deleteError) throw deleteError;
    }

    // Kustuta tabelist
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) throw error;

    loadPhotos();
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert("Kustutamisel tekkis viga: " + err.message);
    } else {
      alert("Kustutamisel tekkis tundmatu viga");
    }
  }
}


  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  return (
    
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center py-12 px-4">
      <div className="max-w-5xl w-full">
        <h1
          className="text-3xl font-semibold text-center md:mb-10 text-gray-900 tracking-tight"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
        >
          Pildihaldus toodete lehel
        </h1>

        {session && (
          
          <>
        
    {/* Suurtel ekraanidel absolute nupud */}
    <div className="hidden md:flex absolute top-12 right-4 items-center gap-2">
      <button
        onClick={() => setShowChangePassword(true)}
        className="text-gray-600 py-2 px-4 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
        style={{
          fontFamily: "var(--font-raleway)",
          fontWeight: 500,
        }}
      >
        Muuda parooli
      </button>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="text-red-900 py-2 px-4 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
        style={{
          fontFamily: "var(--font-raleway)",
          fontWeight: 500,
        }}
      >
        Logi välja
      </button>
    </div>

    {/* Väikestel ekraanidel nupud pealkirja all */}
    <div className="md:hidden flex justify-center gap-2 mb-4">
      <button
        onClick={() => setShowChangePassword(true)}
        className="text-gray-600 py-2 px-4 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
        style={{
          fontFamily: "var(--font-raleway)",
          fontWeight: 500,
        }}
      >
        Muuda parooli
      </button>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="text-red-900 py-2 px-4 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
        style={{
          fontFamily: "var(--font-raleway)",
          fontWeight: 500,
        }}
      >
        Logi välja
      </button>
    </div>
 
           
            {/* Upload form */}
            <form
              onSubmit={uploadPhoto}
              className="mb-12 bg-white border border-gray-200 p-6 rounded-xl shadow-sm"
              style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
            >
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg h-56 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {file ? (
                  <>
                   <div className="relative w-full h-56 rounded-lg overflow-hidden">
  <Image
    src={URL.createObjectURL(file)}
    alt="Eelvaade"
    fill
    className="object-cover transition-transform duration-300"
  />
</div>

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium opacity-0 hover:opacity-100 transition">
                      {file.name}
                    </div>
                  </>
                ) : (
                  <p className="text-center z-10">📂 Lohista siia pilt või kliki, et valida</p>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />

              <input
                type="text"
                placeholder="Pealkiri"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-300 rounded-md p-3 w-full mt-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />

              <button
                type="submit"
                className="mt-5 bg-gray-900 text-white font-medium py-2 px-4 cursor-pointer rounded-4xl hover:bg-gray-800 transition w-full"
              >
                Lae üles
              </button>
            </form>

            {/* Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="cursor-pointer group relative overflow-hidden shadow-lg"
                  onClick={() => openPhotoModal(index)}
                >
<Image
  src={photo.image_url}
  alt={photo.title}
  width={400}   // soovitud laius px
  height={200}  // soovitud kõrgus px
  className="object-cover w-full md:h-44 h-84 transition-transform duration-300 group-hover:scale-105"
/>

                  {photo.title && (
                    <div className="absolute bottom-0 left-0 w-full text-white p-1 text-left truncate"
                      style={{
    fontFamily: "var(--font-raleway)",
    fontWeight: 600,
    textShadow: "3px 3px 6px rgba(0, 0, 0, 1.0)"
  }}>
                      {photo.title}
                    </div>
                  )}

                  <button
  onClick={(e) => {
    e.stopPropagation(); // Peatab klikisündmuse edasikandumise div-ile
    removePhoto(photo.id, photo.image_url);
  }}
  className="absolute top-4 right-4 bg-black text-white text-xl cursor-pointer rounded-full w-10 h-10 flex items-center justify-center opacity-100 transition hover:scale-110"
  title="Kustuta"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20px"
    height="20px"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M19 5L4.99998 19M5.00001 5L19 19"
      stroke="#ffffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</button>


                </div>
              ))}
            </div>
          </>
        )}

        {/* Parooli muutmise modaal */}
        {showChangePassword && (
          <div
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
            onClick={() => !savingPassword && setShowChangePassword(false)}
          >
            <form
              onSubmit={handleChangePassword}
              className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg w-80 flex flex-col gap-4"
              style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-center text-gray-900">Muuda parooli</h2>

              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="Uus parool"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Korda parooli"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />

              {passwordError && <p className="text-red-700 text-sm">{passwordError}</p>}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  disabled={savingPassword}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md font-medium cursor-pointer hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-md font-medium cursor-pointer hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {savingPassword ? "Salvestan..." : "Salvesta"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Väljalogimise kinnitusmodaal */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
            onClick={() => !loggingOut && setShowLogoutConfirm(false)}
          >
            <div
              className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg w-80 flex flex-col gap-4"
              style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-center text-gray-900">
                Kas oled kindel?
              </h2>
              <p className="text-center text-gray-600 text-sm">
                Pärast väljalogimist pead järgmisel korral uuesti e-posti ja parooli sisestama.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md font-medium cursor-pointer hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Tühista
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={loggingOut}
                  className="flex-1 bg-red-900 text-white py-2 rounded-md font-medium cursor-pointer hover:bg-red-800 transition disabled:opacity-50"
                >
                  {loggingOut ? "Login välja..." : "Logi välja"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <form
              onSubmit={handleLogin}
              method="post"
              className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg w-80 flex flex-col gap-4"
            >
              <h2 className="text-2xl font-semibold text-center text-gray-900">Logi sisse</h2>

              <input
                type="email"
                name="email"
                id="login-email"
                autoComplete="username"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <input
                type="password"
                name="password"
                id="login-password"
                autoComplete="current-password"
                placeholder="Parool"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />

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

        {/* Photo Modal */}
        {photoModalOpen && photos[currentIndex] && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
            <button
              onClick={closePhotoModal}
              className="absolute top-5 right-5 text-white text-3xl font-bold cursor-pointer"
            >
              ×
            </button>

            <button
              onClick={showPrevPhoto}
              className="absolute left-5 text-white text-3xl font-bold cursor-pointer"
            >
              ‹
            </button>

            <Image
              src={photos[currentIndex].image_url}
              alt={photos[currentIndex].title}
              className="max-h-[80vh] max-w-full object-contain rounded-md"
              width={800}
              height={600}
            />

            {photos[currentIndex].title && (
              <p className="mt-4 text-white text-lg text-center">{photos[currentIndex].title}</p>
            )}

            <button
              onClick={showNextPhoto}
              className="absolute right-5 text-white text-3xl font-bold cursor-pointer"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
