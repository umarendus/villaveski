'use client'

import Header from "../components/Header";
import React from "react";
import Link from "next/link";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";



import { Monitor, Pencil, Cpu, Smartphone } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: <Monitor size={60} />,
    title: "Kaardistamine",
    text: "Räägime koos läbi sinu ettevõtte eesmärgid ja ootused. Uurime, millised on sinu kliendid ja mida nad veebilehelt otsivad. Selle põhjal selgitame välja, millist veebilahendust sul tegelikult vaja on.",
  },
  {
    id: 2,
    icon: <Pencil size={60} />,
    title: "Disain",
    text: "Loome disainilahenduse, mis toetab sinu brändi ja kõnetab sihtrühma. Kujundus on kaasaegne, kasutajasõbralik ja mobiilisõbralik.",
  },
  {
    id: 3,
    icon: <Cpu size={60} />,
    title: "AI-ga ehitus",
    text: "Ehitusprotsessis kasutame kaasaegseid tööriistu ja AI lahendusi, et saavutada efektiivne, kiire ja kvaliteetne veebilehe arendus.",
  },
  {
    id: 4,
    icon: <Smartphone size={60} />,
    title: "Testimine ja ülekandmine",
    text: "Testime veebilehte erinevatel seadmetel ja brauseritel, et tagada laitmatu toimivus. Seejärel viime lahenduse live-keskkonda.",
  },
];

export const services = [
  {
    title: "Disain",
    img: "/canva/card-1.webp", 
  },
  {
    title: "Veebiarendus",
    img: "/canva/card-2.webp",
  },
  {
    title: "Wordpress arendus",
    img: "/canva/card-3.webp",
  },
  {
    title: "Kodulehe Haldus",
    img: "/canva/card-4.webp",
  },
];
export default function Home() {

const videoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  // Käivitub niipea kui esimesed kaadrid on saadaval
  const handleLoadedData = () => {

    video.play();
  };

  video.addEventListener("loadeddata", handleLoadedData);

  // Ensure video plays when it comes into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(video);

  return () => {
    video.removeEventListener("loadeddata", handleLoadedData);
    observer.unobserve(video);
  };
}, []);


  const [active, setActive] = useState(1);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  // Check if screen is desktop size (lg breakpoint: 1024px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Auto-advance steps every 3 seconds on desktop only if no user interaction
  useEffect(() => {
    if (!userInteracted && isDesktop) {
      timerRef.current = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setActive(prev => (prev >= steps.length ? 1 : prev + 1));
          setIsTransitioning(false);
        }, 300); // Half of transition duration
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userInteracted, isDesktop]);




  // Handle user click - pause auto-advance and resume after 10 seconds
  const handleStepClick = (stepId: number) => {
    setActive(stepId);
    setUserInteracted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Resume auto-advance after 10 seconds of inactivity
    setTimeout(() => {
      setUserInteracted(false);
    }, 10000);
  };

  const [isShortScreen, setIsShortScreen] = useState(false);

useEffect(() => {
  const checkHeight = () => setIsShortScreen(window.innerHeight < 760);
  checkHeight();
  window.addEventListener("resize", checkHeight);
  return () => window.removeEventListener("resize", checkHeight);
}, []);

const [formData, setFormData] = useState({
    nimi: "",
    number: "",
    email: "",
    projekt: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(false);

emailjs.send(
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
  formData,
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
)
      .then(
        () => {
          setLoading(false);
          setSuccess(true);
          setFormData({ nimi: "", number: "", email: "", projekt: "" }); // puhasta vorm
        },
        () => {
          setLoading(false);
          setError(true);
        }
      );
  };

  return (
    
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
<section id="meist" className="relative h-screen flex items-center">
  {/* Background Image */}
  <div 
    className="absolute inset-0 bg-cover bg-left bg-no-repeat"
    style={{
      backgroundImage: `url('/section1-bg.webp')`
    }}
  />

  {/* Content Overlay */}
  <div className="relative z-10 w-full px-6 pt-0">
<div
  className={`max-w-2xl hero-content text-left ml-0 lg:ml-12 ${
    isShortScreen ? "-mt-30" : "-mt-30 md:-mt-80"
  }`}
>
  <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-lg text-left font-light">
    Aitame väikeettevõtetel{" "}
    <span className="block">
      <span className="font-bold">nähtavaks</span> saada
    </span>
  </h1>

  <p className="text-lg md:text-xl text-white/95 mb-10 max-w-lg drop-shadow-md text-left">
    Loome AI-toega kaasaegseid veebilehti, 
    mis aitavad sul jõuda klientideni soodsama hinnaga.
  </p>

  <div className="text-left">
    <Link href="#teenused" scroll={true}>
      <button className="bg-white/85 hover:bg-white text-gray-900 px-10 py-4 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl">
        Vaata lähemalt
      </button>
    </Link>
  </div>
</div>

  </div>
</section>


<section
  id="teenused"
  className="w-full text-black relative flex items-stretch min-h-[900px] overflow-hidden"
>
  {/* Taustapilt – peidus väiksematel ekraanidel */}
  <div
    className="hidden lg:block absolute inset-0 bg-center bg-no-repeat bg-cover max-w-[1920px] mx-auto"
    style={{
      backgroundImage: `url('/service-background.svg')`,
    }}
  />

  {/* Dekoratiivne SVG – mobiil vasakul, desktop paremal */}
  <div className="absolute top-0 right-0 lg:right-0 pointer-events-none z-0">
    <Image
      src="/screen-settings.svg"
      alt="Screen Settings"
      width={100}
      height={100}
      className="w-[80px] h-auto lg:w-[100px] lg:h-auto"
    />
  </div>

  {/* Grid sisu */}
  <div className="relative w-full max-w-7xl mx-auto px-6 md:grid md:grid-cols-12 gap-10 h-full z-10">
    {/* VASAK POOL */}
    <div className="relative md:col-span-8 flex flex-col justify-center py-20 md:py-0 md:mt-20">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-center">
        TEENUSED
      </h2>

      <p className="text-gray-700 max-w-xl text-lg mb-10 mx-auto text-center">
        Pakume terviklikke veebilahendusi, mis katavad kogu protsessi alates
        disainist kuni lõpliku veebileheni. Loome kasutajasõbraliku ja kaasaegse UX/UI disaini,
        arendame nii kohandatud veebilehti kui ka WordPressi lahendusi ning pakume veebilehe
        haldust, et sinu sait oleks alati ajakohane ja toimiv.
      </p>

      {/* Kaardid */}
      <div className="flex md:grid md:grid-cols-4 gap-6 md:gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x">
        {services.map((s) => (
          <div
            key={s.title}
            className="relative rounded-2xl overflow-hidden shadow-md group 
                       flex-shrink-0 w-[50%] sm:w-[40%] md:w-auto aspect-[2/3] snap-start mx-2 md:mx-0"
          >
            <Image
              src={s.img}
              alt={s.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 
                            bg-black/80 text-white py-3 rounded-full 
                            text-base font-bold text-center w-[calc(100%-16px)]">
              {s.title}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* PAREM POOL */}
    <div className="relative md:col-span-4 flex flex-col justify-center py-10 md:py-0 text-lg pl-6 md:pl-10 md:mt-23">
      <p className="text-gray-700 mb-4">
        <strong>Meie eesmärk</strong> on teha <br />veebilahendus sinu jaoks lihtsalt kiirelt <br />ja odavalt.
      </p>
      <p className="text-gray-700 mb-4 relative">
        Olgu see <br />
        uue veebilehe kavandamine, <br />
        olemasoleva täiustamine<br />
        või täisfunktsionaalse e-poe rajamine.
        <span className="absolute -bottom-6 left-0 w-[30%] border-b-1 border-black"></span>
      </p>
      <p className="text-gray-700 mb-6">
        <br />
        Viime projekti lõpuni nii, et tulemus oleks kasutajasõbralik, kaasaegne ja sinu ärile kasulik.
      </p>
      <div className="flex justify-start">
        <button className="px-5 py-2 mb-20 md:mb-0 rounded-full border border-black bg-black text-white font-bold 
                           translate-y-8 hover:bg-gray-800 transform hover:translate-y-7
                           transition-all duration-300 ease-in-out">
          <Link href="#kontakt">
            Kirjuta meile
          </Link>
        </button>
      </div>
    </div>
  </div>

  {/* Alumine joon */}
  <hr className="absolute left-0 w-full border-t bottom-[570px] md:bottom-[180px]" />
</section>



 <section
  id="protsess"
  className="w-full text-white relative min-h-[900px] flex items-stretch py-16 text-center bg-[#272324] lg:bg-transparent overflow-hidden"
>
  {/* Background image with overlay */}
  <div className="hidden lg:block absolute inset-0 max-w-[1920px] mx-auto">
    <div className="absolute inset-0 bg-black opacity-50"></div>
    <div className="absolute inset-0 bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url('/process-background.svg')` }} />
  </div>

  {/* Dekoratiivne SVG */}
  <div className="absolute top-0 right-0 lg:right-0 pointer-events-none z-0">
    <Image
      src="/screen-settings-w.svg"
      alt="Screen Settings"
      width={100}
      height={100}
      className="w-[80px] h-auto lg:w-[100px] lg:h-auto"
    />
  </div>

  {/* Desktop version */}
  <div className="hidden lg:block relative z-10 w-full">
    <h2 className="text-3xl md:text-5xl font-bold md:mt-7 mb-20 text-center">PROTSESS</h2>

    {/* Icons row */}
    <div className="flex justify-center gap-25 mb-12">
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => handleStepClick(step.id)}
          className="flex flex-col items-center space-y-2"
        >
          <div
            className={`p-4 rounded-full transition-colors ${
              active === step.id ? "text-white" : "text-gray-500"
            }`}
          >
            <div className="relative">
              {step.icon}
              <span
                className={`absolute -top-3 -right-3 text-sm font-bold ${
                  active === step.id ? "text-white" : "text-gray-500"
                }`}
              >
                {step.id}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>

    {/* Active content */}
    {active >= 1 && active <= steps.length && (
      <div className={`max-w-3xl mx-auto relative min-h-[200px] transition-opacity duration-600 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        <h3 className="text-3xl font-medium pb-2 mb-15 w-[80%] border-b mx-auto">
          {steps[active - 1].title}
        </h3>
        <p className="text-xl text-gray-300 leading-relaxed mb-32">
          {steps[active - 1].text}
        </p>
      </div>
    )}

    {/* Dots indicator */}
    <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2">
      {steps.map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            active === index + 1 ? "bg-white" : "bg-gray-500"
          }`}
        ></div>
      ))}
    </div>
  </div>

  {/* Mobile version - accordion style */}
  <div className="lg:hidden relative z-10 w-full px-4">
      <h2 className="text-3xl font-bold mb-8">PROTSESS</h2>

      {steps.map((step) => (
        <div key={step.id}>
          <button
            onClick={() => setActive(active === step.id ? 0 : step.id)}
            className="w-full text-left py-2 hover:bg-gray-700 transition-colors border-t border-white"
          >
            <div className="flex items-center gap-2">
              <div className={active === step.id ? "text-white" : "text-gray-400"}>
                {React.cloneElement(step.icon, { size: 32 })}
              </div>
              <h3 className="p-4 text-xl font-semibold">{step.id}. {step.title}</h3>
            </div>
          </button>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${active === step.id ? 'max-h-96' : 'max-h-0'}`}>
            <p className="p-4 text-gray-300 leading-relaxed">{step.text}</p>
          </div>
        </div>
      ))}
  </div>
</section>


      
<section
  id="hinnapoliitika"
  className="w-full text-black relative flex items-stretch md:min-h-[900px] py-19 overflow-hidden"
>
  {/* Taustapilt – peidus väiksematel ekraanidel */}
  <div className="hidden lg:block absolute inset-0 max-w-[1920px] mx-auto">
    <div className="absolute inset-0  opacity-20"></div> {/* Overlay */}
    <div
      className="absolute inset-0 bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: `url('/price-background.svg')` }}
    />
  </div>

  {/* Paremas ülanurgas SVG */}
<div className="absolute top-0 right-0 lg:top-0 lg:right-0 pointer-events-none z-0">
  <Image
    src="/screen-settings.svg"
    alt="Screen Settings"
    width={100}   // väike suurus
    height={100}
    className="w-[80px] h-auto lg:w-[100px] lg:h-auto"
  />
</div>

  <div className="max-w-3xl mx-auto px-0 relative z-10 space-y-8">
    <h2 className="text-3xl md:text-5xl font-bold md:mb-32 text-center">
      HINNAPOLIITIKA
    </h2>

    <div className="md:space-y-6 space-y-8 px-10 md:px-0 text-gray-800 text-left leading-relaxed text-xl">
      <p>
        <span className="font-bold">HINNA</span><br />
        arvutame sinu vajaduste ja disainisoovide põhjal – nende kaardistamisel
        selgub töömaht, mille järgi saame pakkuda sobiva lahenduse.
      </p>

      <p>
         <span className="font-bold">OLENEVALT EESMÄRGIST</span><br />
        võib see olla lihtne veebileht, mis jagab infot ja kuhu kliente suunata,
        või põhjalikum lahendus, mis aitab sul otsingutes silma paista.
      </p>

      <p>
        <span className="font-bold">HALDUSTEENUSE</span><br />
        puhul lepime kokku igakuise tasu, mis tagab, <br />
        et veebileht püsib alati ajakohane ja töökindel.
      </p>

      <p>
        Kokkuvõttes on see investeering sinu ettevõtte nähtavusse ja
        usaldusväärsusse – veebinähtavus on tänapäeval hädavajalik, et{" "}
        <span className="font-bold">konkurentidega sammu pidada.</span>
      </p>
    </div>
  </div>
</section>


<section
  id="kontakt"
  className="relative min-h-screen md:min-h-[900px] flex items-center justify-center p-6 overflow-hidden"
>
{/* Taustavideo */}

<div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
  {/* Background image */}
  <Image
    src="/see/video-background-pic.jpg"
    alt="Background preview"
    fill
    className="object-cover"
  />

  {/* Video */}
  <video
    ref={videoRef}
    src="/see/bg-video-dark.mp4"
    loop
    muted
    playsInline
    preload="auto"
    poster="/see/video-background-pic.jpg"
 
    className="absolute inset-0 w-full h-full object-cover"
  ></video>

  {/* Blur + helepruun overlay */}
  <div className="absolute inset-0 backdrop-blur-sm bg-[#fafafa]/10 pointer-events-none"></div>
</div>






  {/* Dekoratiivne SVG */}
  <div className="absolute top-0 right-0 lg:right-0 pointer-events-none z-0">
    <Image
      src="/screen-settings-w.svg"
      alt="Screen Settings"
      width={100}
      height={100}
      className="w-[80px] h-auto lg:w-[100px] lg:h-auto"
    />
  </div>

  {/* Tausta SVG */}
  <div className="absolute top-0 left-0 right-0 hidden lg:flex justify-center pointer-events-none z-10">
    <Image
      src="/contact-bg.svg"
      alt="Background"
      width={1000}
      height={1080}
      className="min-w-[1920px]"
    />
  </div>

  {/* Sisu */}
  <div className="relative max-w-4xl w-full grid md:grid-cols-2 gap-12 items-start z-20">
    {/* Vasak pool */}
    <div className="text-white md:mt-20">
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <h1 className="text-7xl font-extrabold leading-tight mb-6 md:mb-0 md:-translate-y-6">
            KIRJUTA <br /> MEILE
          </h1>
          <p className="mb-4 font-bold">
            Võta ühendust <br />
            kasvõi meili kaudu:
          </p>
          <a
            href="mailto:umarendus@gmail.com"
            className="inline-block bg-gray-200 text-black px-6 py-2 mb-2 rounded-full font-semibold hover:bg-gray-300 transition"
          >
            umarendus@gmail.com
          </a>
        </div>
        <div className="flex items-center justify-center md:translate-y-0 translate-y-3">
          <Image
            src="/logo-lower.svg"
            alt="Logo"
            width={160}
            height={160}
            className="w-full h-auto max-w-[160px]"
          />
        </div>
      </div>

      <div>
        <p className="mt-4 mb-2 font-bold">
          Kas sul on veebileht, mis ei too kliente, või pole lehte üldse?
        </p>
        <p className="border-t pt-2 border-gray-300 w-[70%]">
          Ära muretse, meie loome AI-toega kaasaegseid veebilehti, mis aitavad
          sul jõuda klientideni soodsama hinnaga.
        </p>
      </div>
    </div>

    {/* Parem pool (vorm brauseriakna stiilis) */}
    <div className="bg-white/95 rounded-lg shadow-md overflow-hidden  mb-40 md:mt-20 z-20">
      <div className="flex items-center px-6 py-4 border-b border-gray-600">
        <Image src="/home.svg" alt="Home" width={16} height={16} className="mr-2" />
        <span className="flex-1 text-center text-sm text-gray-600 border border-gray-700 rounded-full px-3 py-0.5 select-none">
          www.sinuleht.ee
        </span>
      </div>

<form onSubmit={handleSubmit} className="p-8 space-y-4 max-w-lg mx-auto">
      <div>
        <input
          type="text"
          name="nimi"
          placeholder="*Teie nimi"
          value={formData.nimi}
          onChange={handleChange}
          required
          className="w-full border-b border-black outline-none py-2 text-black placeholder-gray-500 text-sm"
        />
      </div>

      <div>
        <input
          type="text"
          name="number"
          placeholder="*Teie number"
          value={formData.number}
          onChange={handleChange}
          required
          className="w-full border-b border-black outline-none py-2 text-black placeholder-gray-500 text-sm"
        />
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="*Teie e-mail"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border-b border-black outline-none py-2 text-black placeholder-gray-500 text-sm"
        />
      </div>

      <div>
        <textarea
          name="projekt"
          placeholder="*Kirjeldage oma projekti"
          value={formData.projekt}
          onChange={handleChange}
          required
          className="w-full border border-black rounded-md p-2 text-black h-28 resize-none placeholder-gray-500 text-sm"
        />
      </div>
<div className="flex flex-col items-center space-y-2">
  <button
    type="submit"
    disabled={loading}
    className="bg-black text-white font-bold px-6 py-2 rounded-full hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
  >
    {loading ? "Saadan..." : "Kirjuta meile"}
  </button>

  {success && (
    <p className="text-gray-800 font-bold text-sm text-center">
      Sõnum saadetud! Võtame peagi ühendust.
    </p>
  )}
  {error && (
    <p className="text-red-600 font-bold text-sm text-center">
      Midagi läks valesti.
    </p>
  )}
</div>
    </form>
    </div>
  </div>

  <div className="absolute bottom-0 left-0 w-full border-t border-white flex justify-start items-center mb-20 gap-6 py-5 px-10 md:px-20 z-30">
    <a
      href="https://www.facebook.com/umarendus"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-70 transition"
    >
      <Image
        src="/facebook.svg"
        alt="Facebook"
        width={28}
        height={28}
        className="invert"
      />
    </a>
    <a
      href="http://linkedin.com/company/umarendus"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-70 transition"
    >
      <Image
        src="/linkedin.svg"
        alt="LinkedIn"
        width={28}
        height={28}
        className="invert"
      />
    </a>
  </div>
</section>


      


    </div>
  );
}
