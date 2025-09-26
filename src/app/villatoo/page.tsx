"use client";
import { useState } from "react";
import Footer from "@/components/Footer";

import Header from "../../components/Header";
import Image from "next/image";

export default function VillaTooPage() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Header />
<div
  className="md:mt-15 mt-12 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
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




      <div className="max-w-4xl mx-auto my-12 px-6 space-y-16">
        {/* Section 1: Text left, Image right */}
        <div className="items-center gap-8">
 
            <p className="text-black text-xl leading-relaxed">
              Meil on seitse erinevat masinat:<strong> villa pesumasin, kuivati, hunt, kraas, kamm, ketramise/korrutamise masin ning vihtimise/poolimise masin.</strong> Selleks, et vill saaks lõngaks töödeldud, peab see läbima kõik seitse masinat. Lisaks pakume ka teenust heideloori ja heidivorsti valmistamiseks. Lõnga saame teha väga erinevaid paksuseid, kuid villakiu pikkus peab jääma vahemikku <br /><strong>7–40 cm</strong>, sest meie masinad on mõeldud pikale kiule. Valmiv lõng on kerge ja ilma rasvata.
  </p>
    

        </div>

        {/* Section 2: Text right, Image left */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8">

            <p className="text-black text-xl leading-relaxed">
              Lisaks lambavillale oleme töötlenud ka <strong>kähriku, rebase, kaamli ja albaka villa. Koera ja jänese villa</strong> puhul tuleb see segada <strong>pooleks lambavillaga, </strong>kuna kiud on liiga peenikesed ja lühikesed. Kui on huvi töötleda ka teiste loomade kiude, võtke meiega ühendust ja arutame.
             <strong> Oluline on rõhutada, et me ei osta villa ega vaheta seda lõnga vastu – töötleme villa ainult teenusena ning oma villa kasutades valmistame lõnga vastavalt tellija soovile.</strong>
  </p>
       

        </div>

        {/* Section 3: Text left, Image right */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <p className="text-black text-xl leading-relaxed">
            Miinimumkogus on üks kilo villa. Keerde teeme vastavalt vajadusele – kas lauget või tugevat. Lõnga ketramissuunana saame valmistada nii<strong> Z- kui S-keerdu </strong>(vt vasakult pildilt). Z-keerdu kasutati vanasti eriti saartel, sest kudumi tekstuur jääb erinev tavapärasest S-keerust. Kui Z- ja S-keeru omavahel kombineerida, tekib eriline efektilõng (vt paremalt pildilt).<br /><strong>KLIKI PILDILE, ET NÄHA SUUREMALT</strong>
             
  </p>
          </div>
    <>
      <div className="md:w-1/2 flex justify-center">
        <Image
          src="/villatoo3.webp"
          alt="Villa töötlemine"
          width={350}
          height={350}
          className="rounded-lg object-cover cursor-pointer"
          draggable={false}
          onClick={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
  <div
    className="fixed inset-0 bg-black/80 bg-opacity-80 flex items-center justify-center z-50"
  >
    <div className="relative">
      {/* Sulgemise nupp */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-2 cursor-pointer right-2 text-white text-3xl font-bold z-50"
      >
        &times;
      </button>

      <Image
        src="/villatoo3.webp"
        alt="Villa töötlemine suurendatud"
        width={800} // suurem pilt
        height={800}
        className="object-contain"
        draggable={false}
      />
    </div>
  </div>
)}
    </>
        </div>

        {/* Section 4: Text right, Image left */}

            <div className="max-w-4xl mx-auto my-12 px-6 text-center space-y-6">
  <p className="text-gray-900 text-xl leading-relaxed border-t pt-12">
    Teenuse hind sõltub mitmest tegurist, peamiselt villa liigist ja tööst, mida soovite teostada. 
    Erinevate loomade villa töötlemine nõuab erinevat lähenemist ning seadmete seadistamist, näiteks 
    pikemad või lühemad kiud, peenemad või jämedamad lõngad, segamine lambavillaga jms. 
    Samuti mõjutab lõnga paksus, keerdetugevus ja ketramissuund teenuse hinda.
    <br /><br />
    Kuna iga tellimus on omanäoline, ei saa me pakkuda ühtset fikseeritud hinda. 
    Selleks, et saaksime anda teile täpse ja õiglaselt arvutatud hinnapakkumise, 
    palume teil meiega ühendust võtta. Kirjutage meile oma soovidest ja vajadustest – 
    millist villa töötlemist vajate, millises koguses ning millist lõnga tulemust ootate. 
    Me vaatame teie soovid üle, arvestame villa omadustega ning lepime kokku konkreetse hinna ja teenuse tingimused.
  </p>

  <a
    href="/#kontakt"
    className="inline-block bg-black text-white rounded-full px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
  >
    Võta ühendust
  </a>
</div>

        
          

        
      </div>




      <Footer/>
    </div>
  );
}
