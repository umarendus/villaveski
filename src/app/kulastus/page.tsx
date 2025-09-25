import Footer from "@/components/Footer";
import Header from "../../components/Header";

export default function KulastusPage() {
  return (
    <div>
      <Header />
<div
  className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/canva/card-3.webp')"
  }}
>
        <h2
          className="text-white text-4xl drop-shadow-lg"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontSize: "clamp(1.7rem, 4vw, 10rem)",
          }}
        >
          KÜLASTA MEID
        </h2>
      </div>
   <div
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
        
      >
  <p>
    Sörve Villaveski külastus pakub ainulaadset võimalust näha kogu villatööstuse protsessi oma silmaga. Külastajad saavad vaadata, kuidas villa töödeldakse lõngaks, kuidas valmivad villavorst ja heie- ning heide-vaibad ning kuidas käsitöötooted, nagu mütsid ja sallid, tekivad käsitöömeistrite käe all. See on hariv ja inspireeriv kogemus, mis võimaldab mõista traditsioonilise villatööstuse väärtust ning käsitöö olulisust tänapäeva maailmas.
  </p>
  <p>
    Enne külastust palume oma tulekust teada anda, et saaksime kõiki huvilisi mugavalt vastu võtta. Kohapeal on võimalik osta käsitööna valmistatud ketratud lõnga, villavorsti, vaipu ning muid villatooteid ning esitada ka tellimustöid, mida saame vajadusel saata üle maailma. Külastus annab võimaluse saada praktiline ülevaade villa töötlemisest ja valmistada isegi osa tootevalmistamisest ise, kui soovid aktiivsemat kogemust.
  </p>
  <p>
    Külastamine sobib nii lastele kui täiskasvanutele, algajatele ja kogenud käsitööhuvilistele, pakkudes inspiratsiooni, teadmisi ja elamusi kogu perele. See on suurepärane võimalus mõista, kuidas traditsiooniline käsitöö kohtub tänapäevase disaini ja kvaliteetse villa tootmisega, ning kogeda rõõmu ja uhkust oma silmaga näha, kuidas villa saab väärtuslikeks toodeteks muundada.
  </p>
</div>

      <Footer/>
    </div>
  );
}
