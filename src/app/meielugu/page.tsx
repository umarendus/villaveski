import Footer from "@/components/Footer";
import Header from "../../components/Header";

export default function MeieLuguPage() {
  return (
    <div>
      <Header />
      <div
        className="mt-15 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/meielugu-banner.webp')" }}
      >
        <h2
          className="text-white text-4xl drop-shadow-lg"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontSize: "clamp(1.7rem, 4vw, 10rem)",
          }}
        >
          MEIE LUGU
        </h2>
      </div>

         <div
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
        style={{
          fontFamily: "var(--font-glacial)", // kõik p kasutavad Glacial Indifference
          fontWeight: 300, // LIGHT variant
        }}
      >
        <p>
          Sörve Villaveski lugu sai alguse soovist anda Saaremaa lammaste villale uus elu ning luua piirkonnale väärtuslik ja kestlik tegevusvaldkond. Meie eesmärk on käsitleda villa inimlikult, muutes selle kvaliteetseks lõngaks ja eripärasteks nišitoodeteks, mis ühendavad traditsioonilise käsitöö ja kaasaegse disaini. 
        </p>
        <p>
          Villaveski loomise taga on pühendumus kohalikele lammaste kasvatajatele – pakkudes neile väljundi ja tuge, saame koos luua võimaluse, et iga villaühik leiab oma tee lõngaks, vaibaks või käsitöötooteks. Me ei osta villa ega vaheta seda lõnga vastu; töötleme villa teenusena ja vajadusel ketrame ka oma villa vastavalt tellija soovile.
        </p>
        <p>
          Meie õpitubades ja külastuskogemustes saab igaüks näha, kuidas villast saab lõng, villavorst või heie- ja heide-vaip, ning õppida lõnga ketramist ja kudumist. Lisaks saab kohapeal ning erinevatel laatadel osta käsitööna valmistatud lõnga, villavorsti, vaipu ja muid villatooteid, esitada tellimustöid ning tellimusi saame saata üle maailma.
        </p>
        <p>
          Nii sündiski Sörve Villaveski – koht, kus väärindame Saaremaa ja teiste paikade lammaste villa inimlikult, pakkudes unikaalseid tooteid, hoides elus traditsioonilist villatööstust ning andes piirkonnale uue eluvaldkonna. Meie lugu on pühendumus käsitööle, kohalikule kogukonnale ja kvaliteetsele villatoodetele.
        </p>
      </div>
      <Footer/>
    </div>
  );
}
