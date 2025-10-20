"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "../../components/Header";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import Image from "next/image";


type Photo = {
  id: number;
  title: string;
  image_url: string;
  created_at: string | null;
};

export default function TootedPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPhotos(data);
  }

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const showNext = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const showPrev = () =>
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <div>
      <Header />

      {/* Hero */}
      <div
        className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/canva/card-4.webp')",
        }}
      >
        <h2
          className="text-white text-4xl drop-shadow-lg"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontSize: "clamp(1.7rem, 4vw, 10rem)",
          }}
        >
          MEIE TOOTED
        </h2>
      </div>

      {/* Tekst */}
      <div className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6">
        <p>
          Sörve Villaveski tooted on käsitööna valmistatud, kõrge kvaliteediga
          ja ainulaadsed. Meie peamine valdkond on ketratud lõng, villavorst,
          heie- ja heide-vaibad ning lõngast valmistatud mütsid, sallid ja
          muud aksessuaarid. Iga toode on loodud hoolikalt ja inimlikult
          töödeldud villast, ühendades traditsioonilise käsitöö ja kaasaegse
          disaini.
        </p>
        <p>
          Meil on poolkamm ketrusmasinad, ehk villakiud on paralleelselt
          sirgu kammitud, mis annab lõngale sileda ja ühtlase struktuuri.
          Samuti kasutame dafting-masinat, mis võimaldab luua tihedamaid ja
          tugevamaid vaipu ning teisi tooteid. Meie tooted on saadaval
          erinevates värvitoonides ja paksustes, võimaldades igal kliendil
          leida just endale sobiv toode.
        </p>
        <p>
          Meie tooteid saab osta kohapeal villaveskis ja erinevatel
          laatadel, kus oleme esindatud. Lisaks on võimalik esitada
          tellimustöid ja saata tooteid üle maailma, võimaldades igal
          huvilisel nautida meie villatoodete unikaalsust ja käsitöö
          kvaliteeti. Iga toode peegeldab pühendumust käsitööle, traditsioonile
          ja kohaliku kogukonna toetamisele.
        </p>

        <Link
          href="/#kontakt"
          className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
        >
          Võta ühendust
        </Link>
      </div>

  
{/* Galerii */}
<div className="max-w-5xl mx-auto px-15 md:px-6 mb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
  {photos.map((photo, index) => (
    <div
      key={photo.id}
      className="group relative cursor-pointer overflow-hidden  shadow-lg"
      onClick={() => openModal(index)}
    >
      {/* Pilt */}
      <Image
        width={900}
        height={800}
        src={photo.image_url}
        alt={photo.title}
        className="w-full h-60 md:h-50 object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Hover-overlay ja pealkiri */}
      {photo.title && (
        <div
          className="
            absolute inset-0 
            sm:bg-black/50 bg-transparent
            opacity-100 sm:opacity-0 sm:group-hover:opacity-100 
            transition-opacity duration-300 
            flex items-end
          "
        >
          <p
            className="text-white text-sm font-medium p-3 w-full truncate"
            style={{
              fontFamily: "var(--font-raleway)",
              fontWeight: 600,
              textShadow: "3px 3px 6px rgba(0, 0, 0, 1.0)"
            }}
          >
            {photo.title}
          </p>
        </div>
      )}
    </div>
  ))}
</div>




      {/* Modaal */}

{modalOpen && photos[currentIndex] && (
  <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
    {/* Sulgemisnupp */}
    <button
      onClick={closeModal}
      className="absolute top-5 right-5 text-white text-3xl font-bold cursor-pointer"
    >
      ×
    </button>

    {/* Eelmine nupp */}
    <button
      onClick={showPrev}
      className="absolute left-5 text-white text-3xl font-bold cursor-pointer"
    >
      ‹
    </button>

    {/* Pilt */}
    <Image
      src={photos[currentIndex].image_url}
      alt={photos[currentIndex].title}
      width={900}
      height={600}
      className="max-h-[80vh] max-w-full object-contain rounded-md"
    />

    {/* Pildi pealkiri pildi all */}
<p
  className="mt-4 text-white text-lg text-center break-words"
  style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
>
  {photos[currentIndex].title}
</p>


    {/* Järgmine nupp */}
    <button
      onClick={showNext}
      className="absolute right-5 text-white text-3xl font-bold cursor-pointer"
    >
      ›
    </button>
  </div>
)}


      <Footer />
    </div>
  );
}
