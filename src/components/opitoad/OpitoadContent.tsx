import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";
import WorkshopsSection from "@/components/opitoad/WorkshopsSection";
import WorkshopGallery from "@/components/opitoad/WorkshopGallery";

// /opitoad ja jagatava lingi /opitoad/<id> ühine sisu
export default function OpitoadContent({ focusId }: { focusId?: string }) {
  return (
    <div>
      <Header />
<div
  className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/canva/card-2.webp')"
  }}
>
        <h2
          className="text-white text-4xl drop-shadow-lg"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontSize: "clamp(1.7rem, 4vw, 10rem)",
          }}
        >
          MEIE ÕPITOAD
        </h2>
      </div>

   <div
        className="text-black text-xl max-w-4xl mx-auto mt-12 mb-4 px-6 text-center space-y-6"
      >
  <p>
    Meie õpitoad pakuvad unikaalset võimalust sukelduda traditsioonilise villatööstuse maailma ja õppida käsitöö saladusi. Osalejad saavad tutvuda lõnga ketramise, kudumise ja villavorsti valmistamise protsessiga ning proovida ise villast tooteid luua. Õpitoad on mõeldud nii algajatele kui ka edasijõudnutele, pakkudes praktilist kogemust ja juhendamist igal sammul.
  </p>
  <a
    href="#registreeru"
    className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
    style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
  >
    Vaata eelseisvaid õpitubasid
  </a>
</div>

      <WorkshopsSection focusId={focusId} />

      <WorkshopGallery />

   <div
        className="text-black text-xl max-w-4xl mx-auto mb-16 px-6 text-center space-y-6"
      >
  <p>
    Külastades meie õpitubasid või villaveskit, saab igaüks näha ja proovida, kuidas traditsiooniline käsitöö kohtub kaasaegse disaini ja praktiliste teadmistega. Lisaks käsitööle õpetame masinatel kudumist, dafting-masinaga vaibaloomist ning palju muud. Soovid õpituba oma seltskonnale? Kirjuta meile!
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
