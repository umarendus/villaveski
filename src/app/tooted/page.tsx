import Footer from "@/components/Footer";
import Header from "../../components/Header";
import Link from "next/link";

export default function TootedPage() {
  return (
    <div>
      <Header />
<div
  className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/canva/card-4.webp')"
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

   <div
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
      >
  <p>
    Sörve Villaveski tooted on käsitööna valmistatud, kõrge kvaliteediga ja ainulaadsed. Meie peamine valdkond on ketratud lõng, villavorst, heie- ja heide-vaibad ning lõngast valmistatud mütsid, sallid ja muud aksessuaarid. Iga toode on loodud hoolikalt ja inimlikult töödeldud villast, ühendades traditsioonilise käsitöö ja kaasaegse disaini. 
  </p>
  <p>
  Meil on poolkamm ketrusmasinad, ehk villakiud on paralleelselt sirgu kammitud, mis annab lõngale sileda ja ühtlase struktuuri. Samuti kasutame dafting-masinat, mis võimaldab luua tihedamaid ja tugevamaid vaipu ning teisi tooteid. Meie tooted on saadaval erinevates värvitoonides ja paksustes, võimaldades igal kliendil leida just endale sobiv toode.
  </p>

  <p>
    Meie tooteid saab osta kohapeal villaveskis ja erinevatel laatadel, kus oleme esindatud. Lisaks on võimalik esitada tellimustöid ja saata tooteid üle maailma, võimaldades igal huvilisel nautida meie villatoodete unikaalsust ja käsitöö kvaliteeti. Iga toode peegeldab pühendumust käsitööle, traditsioonile ja kohaliku kogukonna toetamisele.
  </p>
    <Link
    href="/#kontakt"
    className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
  >
    Võta ühendust
  </Link>
</div>

      <Footer/>
    </div>
  );
}
