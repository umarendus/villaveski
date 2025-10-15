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
    async function initSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        loadPhotos();
      } else {
        setShowLoginModal(true);
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
          setShowLoginModal(false);
          loadPhotos();
        }
      });

      return () => listener.subscription.unsubscribe();
    }

    initSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return alert("Sisesta e-post ja parool");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setShowLoginModal(false);
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
        
    {/* Suurtel ekraanidel absolute nupp */}
    <div className="hidden md:block">
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          setSession(null);
          setShowLoginModal(true);
        }}
        className="absolute top-12 right-4 text-red-900 py-2 px-4 rounded-md transition-transform duration-200 ease-in-out hover:scale-110"
        style={{
          fontFamily: "var(--font-raleway)",
          fontWeight: 500,
        }}
      >
        Logi välja
      </button>
    </div>

    {/* Väikestel ekraanidel nupp pealkirja all */}
    <div className="md:hidden flex justify-center mb-4">
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          setSession(null);
          setShowLoginModal(true);
        }}
        className="text-red-900 py-2 px-4 rounded-md transition-transform duration-200 ease-in-out hover:scale-110"
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
                className="mt-5 bg-gray-900 text-white font-medium py-2 px-4 rounded-4xl hover:bg-gray-800 transition w-full"
              >
                Lae üles
              </button>
            </form>

            {/* Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="cursor-pointer group relative overflow-hidden rounded-lg shadow-lg"
                  onClick={() => openPhotoModal(index)}
                >
<Image
  src={photo.image_url}
  alt={photo.title}
  width={400}   // soovitud laius px
  height={200}  // soovitud kõrgus px
  className="object-cover w-full h-44 transition-transform duration-300 group-hover:scale-105"
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
  className="absolute top-4 right-4 bg-black text-white text-xl rounded-full w-10 h-10 flex items-center justify-center opacity-100 transition hover:scale-110"
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

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg w-80 flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-center text-gray-900">Logi sisse</h2>

              <input
                type="email"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <input
                type="password"
                placeholder="Parool"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />

              <button
                onClick={handleLogin}
                className="bg-gray-900 text-white py-2 rounded-md font-medium hover:bg-gray-800 transition mt-2"
              >
                Logi sisse
              </button>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {photoModalOpen && photos[currentIndex] && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
            <button
              onClick={closePhotoModal}
              className="absolute top-5 right-5 text-white text-3xl font-bold"
            >
              ×
            </button>

            <button
              onClick={showPrevPhoto}
              className="absolute left-5 text-white text-3xl font-bold"
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
              className="absolute right-5 text-white text-3xl font-bold"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
