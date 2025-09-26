import Footer from "@/components/Footer";
import Header from "../../components/Header";

export default function OpiToadPage() {
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
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
      >
  <p>
    Meie õpitoad pakuvad unikaalset võimalust sukelduda traditsioonilise villatööstuse maailma ja õppida käsitöö saladusi. Osalejad saavad tutvuda lõnga ketramise, kudumise ja villavorsti valmistamise protsessiga ning proovida ise villast tooteid luua. Õpitubades on võimalik valmistada isikupäraseid mütse, salle, sokke ja heide-vaipu, kasutades erinevaid värve ja tekstuure vastavalt oma soovile. 
  </p>
  <p>
    Õpitoad on mõeldud nii algajatele kui ka edasijõudnutele, pakkudes praktilist kogemust ja juhendamist igal sammul. Lisaks annab see võimaluse mõista, kuidas villa saab hoolikalt töödelda lõngaks ja toodeteks, tutvustades kogu villatööstuse protsessi alates villa ettevalmistamisest kuni valmis käsitöötoote loomiseni. Meie eesmärk on jagada teadmisi, innustada loovust ja hoida elus käsitöötraditsiooni, pakkudes samal ajal lõbusat ja õpetlikku kogemust kõigile osalejatele.
  </p>
  <p>
    Külastades meie õpitubasid või villaveskit, saab igaüks näha ja proovida, kuidas traditsiooniline käsitöö kohtub kaasaegse disaini ja praktiliste teadmistega. Lisaks käsitööle õpetame masinatel kudumist, dafting-masinaga vaibaloomist ning palju muud. Õpitubade kaudu loodame inspireerida inimesi väärtustama käsitöötooteid, mõistma villa väärtust ning kogema rõõmu oma kätega midagi ainulaadset luues.
  </p>
  <a
    href="/#kontakt"
    className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
  >
    Võta ühendust
  </a>
</div>
      <Footer/>
    </div>
  );
}
