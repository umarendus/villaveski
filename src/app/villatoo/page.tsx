import Footer from "@/components/Footer";
import Header from "../../components/Header";

export default function VillaTooPage() {
  return (
    <div>
      <Header />
<div
  className="mt-15 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/canva/card-1.webp')"
  }}
>
        <h2
          className="text-white text-4xl drop-shadow-lg"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontSize: "clamp(1.7rem, 4vw, 10rem)",
          }}
        >
          MEIE VILLATÖÖ
        </h2>
      </div>
   <div
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
      >
  <p>
    Sörve Villaveskis käsitleme hoolikalt villa, muutes Saaremaa ning teiste paikade lammaste villa kvaliteetseks lõngaks ja käsitöötoodeteks. Meie põhiline tegevus on lõnga ketramine, villavorsti valmistamine, heie- ja heide-vaipade loomine ning villast mütside, sallide ja muude aksessuaaride käsitööna valmistamine. Lisaks pakume külastajatele ja huvilistele õpitubasid, kus saab õppida lõnga ketramist, kudumist ning villatoodete valmistamist.
  </p>
  <p>
    Oluline on rõhutada, et me ei osta villa ega vaheta seda lõnga vastu – töötleme villa ainult teenusena ning oma villa kasutades valmistame lõnga vastavalt tellija soovile. Meie eesmärk on pakkuda kohalikele lammaste kasvatajatele väljundit ning luua piirkonnale kestlik ja väärtuslik tegevusvaldkond, säilitades traditsioonilise villatööstuse oskused ja kvaliteedi.
  </p>
  <p>
    Kohapeal ning erinevatel laatadel, kus oleme esindatud, saab osta meie käsitööna valmistatud ketratud lõnga, villavorsti, heie- ja heide-vaipu ning muid villatooteid. Samuti on võimalik esitada tellimustöid ja saata tellimusi üle maailma, pakkudes igale huvilisele võimalust nautida meie villatoodete unikaalsust ja kvaliteeti.
  </p>
</div>

      <Footer/>
    </div>
  );
}
