import Footer from "@/components/Footer";
import Header from "../../components/Header";
import Image from "next/image";
import Link from "next/link";

export default function MeieLuguPage() {
  return (
    <div>
      <Header />
      <div
        className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
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

      <div className="max-w-6xl mx-auto my-12 px-6 space-y-16">
        {/* Section 1: Text left, Image right */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <p className="text-black text-xl leading-relaxed">
              Sörve Villaveski lugu sai alguse soovist anda Saaremaa lammaste villale uus elu ning luua piirkonnale väärtuslik ja kestlik tegevusvaldkond.<strong> Meie eesmärk on käsitleda villa, muutes selle kvaliteetseks lõngaks või eripärasteks nišitoodeteks, mis ühendavad traditsioonilise käsitöö ja kaasaegse disaini.</strong>
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/meielugu1.webp"
              alt="Egon ja Merike Sepp"
              width={350}
              height={350}
              className="rounded-full object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Section 2: Text right, Image left */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="md:w-1/2">
            <p className="text-black text-xl leading-relaxed">
              Sõrve Villaveski rajamine algas<strong> 2013. aastal,</strong> kui Egon ja Merike Sepp soetasid oma kodu juurde uue ja täiesti ainulaadse väikese villatööstuse. Tööstuses kasutatakse <strong>tipptasemel seadmeid,</strong> mis võimaldavad villa töötlust läbi seitsme erineva masina enne lõngaks saamist.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/meielugu2.webp"
              alt="Villatööstuse seadmed"
              width={350}
              height={350}
              className="rounded-full object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Section 3: Text left, Image right */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <p className="text-black text-xl leading-relaxed">
              Villaveski loomise taga on pühendumus kohalikele lammaste kasvatajatele – pakkudes neile väljundi. Lõime võimaluse, et iga villak leiab oma tee lõngaks, vaibaks või käsitöötooteks. <br /><strong>Me ei osta villa ega vaheta seda lõnga vastu; töötleme villa teenusena ja vajadusel ketrame ka oma villa vastavalt tellija soovile.</strong>
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/meielugu3.webp"
              alt="Villa töötlemine"
              width={350}
              height={350}
              className="rounded-full object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Section 4: Text right, Image left */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="md:w-1/2">
            <p className="text-black text-xl leading-relaxed">
              Nii sündiski <strong>Sörve Villaveski – </strong>koht, kus väärindame Saaremaa ja teiste paikade lammaste villa, pakkudes unikaalseid tooteid, hoides elus traditsioonilist villatööstust ning andes piirkonnale uue eluvaldkonna. Meie lugu on pühendumus käsitööle, kohalikule kogukonnale ja kvaliteetsele villatoodetele.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/meielugu4.webp"
              alt="Õpitubade tegevused"
              width={350}
              height={350}
              className="rounded-full object-cover"
              draggable={false}
            />
          </div>
          
        </div>
   <div
        className="text-black text-xl max-w-4xl mx-auto my-12 px-6 text-center space-y-6"
        
      >
  <Link
    href="/#kontakt"
    className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
  >
    Võta ühendust
  </Link>
</div>
        
      </div>
      
      <Footer/>
    </div>
  );
}
