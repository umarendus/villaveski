'use client'

import Header from "../components/Header";
import Footer from "../components/Footer";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";



const steps = [
  {
    id: 1,
    image: "/canva/card-1.webp",
    title: "Villatöö",
    text: "Me ketrame lõnga, valmistame villavorsti ja heideloori. Villa ei osta ega vaheta lõnga vastu – töötleme villast lõnga teenusena ning oma villa kasutades saame teha lõnga vastavalt tellija soovile.",
  },
  {
    id: 2,
    image: "/canva/card-2.webp",
    title: "Õpitoad",
    text: "Meie õpitubades saab õppida lõnga ketramist, kudumist, villavorsti ja heide-vaipade valmistamist ning isikupäraste villatoodete loomist. Kutsuge meid külla või tulge meie juurde Sörve poolsaarele!",
  },
  {
    id: 3,
    image: "/canva/card-3.webp",
    title: "Külastus",
    text: "Enne külastust palume oma tulekust teada anda, kohapeal saab osta villatooteid, vaadata villatööstust töös ning tutvuda lõnga ketramise, kudumise ja vaipade valmistamise protsessidega.",
  },
  {
    id: 4,
    image: "/canva/card-4.webp",
    title: "Tooted",
    text: "Kohapeal ja erinevatel laatadel, kus oleme esindatud, saab osta käsitööna valmistatud ketratud lõnga, villavorsti, heie- ja heide-vaipu ning villast mütse, salle ja muid aksessuaare, esitada tellimustöid ning tellimusi saame saata üle maailma.",
  },
];


export default function Home() {




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
        }, 500); // Half of transition duration
      }, 6000);
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
    }, 20000);
  };



const [formData, setFormData] = useState({
    nimi: "",
    email: "",
    kirjeldus: "",
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
          setFormData({ nimi: "", email: "", kirjeldus: "" }); // puhasta vorm
        },
        () => {
          setLoading(false);
          setError(true);
        }
      );
  };

  // algväärtus serveris → lihtsalt 180, client-side uuendatakse useEffect'iga
  const [xValue, setXValue] = useState(180);
  const [isLowHeight, setIsLowHeight] = useState(false);

useEffect(() => {
  // Laiuse ja x väärtuse piirid
  const MIN_W = 460;
  const MAX_W = 1160;
  const MIN_X = 70;
  const MAX_X = 180;

  const updateLayout = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Kontrolli kõrgust pt-87 vs pt-17 jaoks
    setIsLowHeight(h <= 475);

    // X-väärtuse arvutamine
    if (w <= MIN_W) {
      setXValue(MIN_X);
      return;
    }
    if (w >= MAX_W) {
      setXValue(MAX_X);
      return;
    }

    // Lineaarne interpolatsioon vahemikus [MIN_W, MAX_W] -> [MIN_X, MAX_X]
    const t = (w - MIN_W) / (MAX_W - MIN_W); // 0..1
    const x = MIN_X + t * (MAX_X - MIN_X);

    // Soovi korral võid ümardada:
    // setXValue(Math.round(x));
    setXValue(x);
  };

  updateLayout(); // kohe alguses
  window.addEventListener("resize", updateLayout);
  return () => window.removeEventListener("resize", updateLayout);
}, []);


  return (
    
    <div className="min-h-screen">
      <Header />
      

 <section id="kodu" className="relative h-screen flex items-center">

      {/* Taust */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/villaveski-bg.webp')`,
          filter: "brightness(0.9)",
         }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full px-6 pt-0">
        <div className={`flex flex-col items-center justify-center ${isLowHeight ? 'pt-17' : 'pt-87'} h-full text-center relative`}>

          {/* Desktop pealkiri koos lambadega */}
<div className="flex items-center justify-center mb-4 md:flex relative">

  

  {/* Vasak lambake */}
  <motion.div
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: -xValue }}
        transition={{
          opacity: { duration: 1.2, delay: 1.0 },
          x: { type: "spring", stiffness: 60, damping: 20, delay: 2.0, duration: 1.2 },
        }}
        className="relative"
        style={{ marginRight: "10px" }}
      >
        <Image
          src="/sheep-black-l.svg"
          alt="Sheep Left"
          width={0}
          height={0}
          sizes="100vh"
          className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
          style={{ filter: "invert(1) brightness(2)", height: "clamp(2.8rem, 8vw, 8rem)" }}
        />
      </motion.div>

  {/* Tekst */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1.5, delay: 2.6, ease: "easeOut" }}
  className="absolute text-center"
  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
>
  <h1
    className="text-white drop-shadow-2xl"
    style={{
      fontFamily: "'Abril Fatface'",
      fontSize: "clamp(2.6rem, 9vw, 6.5rem)",
      lineHeight: 1.1, // väiksem reavahe
    }}
  >
    SÖRVE
  </h1>
  <h2
    className="text-white drop-shadow-2xl"
    style={{
      fontFamily: "'Abril Fatface'",
      fontSize: "clamp(1.6rem, 5.5vw, 3.6rem)",
      lineHeight: 1.1, // väiksem reavahe
    }}
  >
    VILLAVESKI
  </h2>
</motion.div>



  {/* Parem lambake */}
   <motion.div
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: xValue }}
        transition={{
          opacity: { duration: 1.2, delay: 1.0 },
          x: { type: "spring", stiffness: 60, damping: 20, delay: 2.0, duration: 1.2 },
        }}
        className="relative"
        style={{ marginLeft: "10px" }}
      >
        <Image
          src="/sheep-black-r.svg"
          alt="Sheep Right"
          width={0}
          height={0}
          sizes="100vh"
          className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
          style={{ filter: "invert(1) brightness(2)", height: "clamp(2.8rem, 8vw, 8rem)" }}
        />
      </motion.div>
</div>

        </div>
      </div>
    </section>

    {/* Uudo täissuuruses pilt */}
    <section className="w-full h-screen relative">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/uudo.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </section>
    
<section id="meist" className="w-full min-h-screen relative">
  {/* Läbipaistev overlay taustapildi jaoks */}
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: "url('/meielugu-bg.webp')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: 0.1, // siin määrad läbipaistvuse
      zIndex: -1,   // nii et overlay jääb taha
    }}
  />

  {/* Ülemine bänner pildiga */}
  <div
    className="mt-5 relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center"
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

  {/* Tekstiosa */}
  <div className="py-16 px-4 max-w-4xl mx-auto text-center text-black relative z-10">
<p className="text-lg md:text-xl mb-6 leading-relaxed">
      
      Meie, Egon ja Merike Sepp, rajasime oma kodu Sõrve poolsaarele Lepiku
      talusse, kuhu meid tõi Egoni lapsepõlvemälestuste side paigaga ning soov
      elada maal, eemal linnakärast.
    </p>

    <p className="text-lg md:text-xl mb-6 leading-relaxed border-b pb-6 border-gray-600 w-[70%] mx-auto" >
      Kohalikus lambakasvatuses nägime kasutamata võimalust, sest suur osa
      villa jäi väärtustamata.
    </p>

<p
  className="text-lg md:text-xl mb-6 leading-relaxed text-gray-800"
  style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
>
  Nii sündiski Sõrve Villaveski – siin pakume erinevatele villatüüpidele võimaluse saada kvaliteetseks lõngaks või nišitoodeteks, avades loomakasvatajatele uue väljundi.
</p>


    {/* Nupp */}
    <button className="mt-8">
      <Link
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
        href="/meielugu"
        className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition inline-block"

      >
        Loe lähemalt
      </Link>
    </button>
  </div>

            <div className="flex items-center justify-center gap-0 mb-8 md:flex">
            <Image
              src="/sheep-black-l.svg"
              alt="Sheep Left"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: ' brightness(2)',
                height: 'clamp(2rem, 2vw, 2rem)'
              }}
            />

            <Image
              src="/sheep-black-r.svg"
              alt="Sheep Right"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: ' brightness(2)',
                height: 'clamp(2rem, 2vw, 2rem)'
              }}
            />
          </div>

  {/* Alumine bänner */}
  <div
    className="mt-5 relative h-30 md:h-90 w-full bg-cover bg-center flex items-center justify-center"
    style={{ backgroundImage: "url('/idea-banner.webp')" }}
  >
    <h2
      className="text-white text-4xl drop-shadow-lg"
      style={{
        fontFamily: "'Abril Fatface', serif",
        fontSize: 'clamp(1.4rem, 3vw, 4rem)'
      }}
    >
      SÜDA JA HING IGA LÕNGA SEES
    </h2>
  </div>
</section>






 <section
  id="teenused"
  className="w-full "
>

  {/* Desktop version */}
<div className="hidden lg:block relative z-10 w-full min-h-[850px]">
  <h2
    className="text-black text-center text-3xl my-16"
    style={{
      fontFamily: "'Abril Fatface', serif",
      fontSize: "clamp(2rem, 4vw, 6rem)",
    }}
  >
    TEENUSED
  </h2>

  <div className="flex justify-center gap-25 mb-12"
  style={{ fontFamily: "var(--font-raleway)", fontWeight: 200 }}>

    {steps.map((step) => (
      <button
        key={step.id}
        onClick={() => handleStepClick(step.id)}
        className="flex flex-col items-center space-y-2"
      >
        <div className="relative cursor-pointer select-none">
          <Image
            src={step.image}
            alt={step.title}
            width={150}
            height={150}
            draggable={false}
            className={`rounded-full object-cover aspect-square transition-all duration-300 pointer-events-none ${
              active === step.id
                ? "brightness-100"
                : "brightness-20 hover:brightness-80"
            }`}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
          />
        </div>
<span

  className={`cursor-pointer text-xl text-black transition-colors duration-300 ${
    active === step.id ? "font-bold" : "font-medium"
  }`}
>
  {step.title}
</span>

      </button>
    ))}
  </div>

  {/* Active content */}
  {active >= 1 && active <= steps.length && (
    <div

      className={`max-w-3xl mx-auto relative min-h-[200px] transition-opacity duration-600 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      <h3 className="text-3xl font-medium pb-2 mb-15 w-[50%] border-b mx-auto text-center text-black"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
        {steps[active - 1].title}
      </h3>
      <p className="text-xl text-black leading-relaxed mb-8 text-center">
        {steps[active - 1].text}
      </p>

      {/* Step-specific button */}
      <div className="text-center mb-24"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
        {active === 1 && (
          <Link
            href="/villatoo"
            className="inline-block px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Loe lähemalt Villatööst
          </Link>
        )}
        {active === 2 && (
          <Link
            href="/opitoad"
            className="inline-block px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Loe lähemalt Õpitubadest
          </Link>
        )}
        {active === 3 && (
          <Link
            href="/kulastus"
            className="inline-block px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Loe lähemalt Külastustest
          </Link>
        )}
        {active === 4 && (
          <Link
            href="/tooted"
            className="inline-block px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Loe lähemalt Toodetest
          </Link>
        )}
      </div>
    </div>
  )}

  {/* Dots indicator */}
  <div className="absolute bottom-30 left-0 right-0 flex justify-center space-x-2">
    {steps.map((_, index) => (
      <div
        key={index}
        className="w-2 h-2 rounded-full transition-colors duration-300"
        style={{
          backgroundColor: active === index + 1 ? "#be9f7a" : "#000000",
        }}
      ></div>
    ))}
  </div>
</div>

  {/* Mobile version - accordion style */}
  <div className="lg:hidden relative z-10 mx-5  px-1"
>
      <h2 className="text-black text-center text-4xl my-10 font-bold " style={{ fontFamily: "'Abril Fatface', serif", fontSize: 'clamp(2rem, 4vw, 6rem)' }}>TEENUSED</h2>

      {steps.map((step) => (
        <div key={step.id}>
          <button
            onClick={() => setActive(active === step.id ? 0 : step.id)}
            className={`w-full text-center py-2 hover:bg-gray-50 transition-all duration-500 ease-in-out border-t border-gray-500 ${
              active === step.id ? 'bg-gray-50' : ''
            }`}
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Image
                    src={step.image}
                    alt={step.title}
                    draggable={false}
                    width={60}
                    height={60}
                    className={`rounded-full object-cover aspect-square transition-all duration-300 ${
                      active === step.id 
                        ? "opacity-100" 
                        : "opacity-90"
                    }`}
                  />
                </div>
                <h3 className="p-4 text-xl text-black font-semibold">{step.title}</h3>
              </div>
              <svg
                className={`w-6 h-6 text-black transition-transform duration-500 ease-in-out mr-4 ${
                  active === step.id ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${active === step.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
  <div className={`transform transition-transform duration-500 ease-in-out ${active === step.id ? 'translate-y-0' : '-translate-y-4'}`}>
    <p className="p-4 text-gray-800 leading-relaxed text-center mx-auto">
      {step.text}
    </p>
    {/* Step-specific button */}
    <div className="text-center mb-6 relative h-16">
      <Link
        href="/villatoo"
        className={`absolute left-1/2 transform -translate-x-1/2 px-12 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-500 ease-in-out w-11/12 max-w-sm ${
          active === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 800 }}
      >
        Loe lähemalt Villatööst
      </Link>
      
      <Link
        href="/opitoad"
        className={`absolute left-1/2 transform -translate-x-1/2 px-12 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-500 ease-in-out w-11/12 max-w-sm ${
          active === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 800 }}
      >
        Loe lähemalt Õpitubadest
      </Link>
      
      <Link
        href="/kulastus"
        className={`absolute left-1/2 transform -translate-x-1/2 px-12 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-500 ease-in-out w-11/12 max-w-sm ${
          active === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 800 }}
      >
        Loe lähemalt Külastustest
      </Link>
      
      <Link
        href="/tooted"
        className={`absolute left-1/2 transform -translate-x-1/2 px-12 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-500 ease-in-out w-11/12 max-w-sm ${
          active === 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 800 }}
      >
        Loe lähemalt Toodetest
      </Link>
    </div>
  </div>
</div>

        </div>
      ))}
  </div>
  <div className="flex items-center justify-center gap-0 mt-15 md:mt-0 mb-8 md:flex">
            <Image
              src="/sheep-black-l.svg"
              alt="Sheep Left"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: ' brightness(2)',
                height: 'clamp(2rem, 2vw, 2rem)'
              }}
            />

            <Image
              src="/sheep-black-r.svg"
              alt="Sheep Right"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: ' brightness(2)',
                height: 'clamp(2rem, 2vw, 2rem)'
              }}
            />
          </div>
</section>



<section
  id="kontakt">
          <div
        className="relative h-30 md:h-60 w-full bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/kirjuta-meile.webp')" }} // asenda enda pildiga
      >
        <h2 className="text-black text-4xl" style={{ fontFamily: "'Abril Fatface', serif", fontSize: 'clamp(1.7rem, 4vw, 10rem)' }}>KIRJUTA MEILE</h2>
      </div>
  <div className="relative min-h-screen md:min-h-[900px] flex items-center justify-center p-6 overflow-hidden"
>
{/* Taustapilt - desktop: vasakule poolele, mobile: ainult ülemisele osale */}
<div className="absolute top-0 left-0 md:w-1/2 w-full md:h-full h-1/2 overflow-hidden z-0">
  <div 
    className="absolute inset-0 bg-cover bg-right bg-no-repeat"
    style={{
      backgroundImage: `url('/villaveski-bg.webp')`
    }}
  />
</div>


  {/* Sisu */}
  <div className="relative w-full grid md:grid-cols-2 md:gap-0 gap-0 md:items-center items-stretch min-h-[900px] z-20">
    {/* Vasak pool - terve vasak pool desktop, ülemine osa mobile */}
    <div className="text-white flex flex-col items-center justify-center md:h-full min-h-[450px]">
      <div className="gap-4 mb-8">
        <div>
          <h1 className="text-9xl text-white text-center drop-shadow-2xl mb-6" 
            style={{ fontFamily: "'Abril Fatface', serif", fontSize: 'clamp(5rem, 9vw, 9rem)' }}>
            SÖRVE
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-8 hidden md:flex">
            <Image
              src="/sheep-black-l.svg"
              alt="Sheep Left"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: 'invert(1) brightness(2)',
                height: 'clamp(4rem, 9vw, 9rem)'
              }}
            />

            <Image
              src="/sheep-black-r.svg"
              alt="Sheep Right"
              width={0}
              height={0}
              sizes="100vh"
              className="h-full w-auto object-contain filter invert brightness-0 contrast-100"
              style={{ 
                filter: 'invert(1) brightness(2)',
                height: 'clamp(4rem, 9vw, 9rem)'
              }}
            />
          </div>
          
          <h2 className="text-5xl md:text-8xl text-white drop-shadow-2xl mb-8 text-center" 
            style={{ fontFamily: "'Abril Fatface'", fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
            VILLAVESKI
          </h2>

          <div className="text-center mb-8"
           style={{ fontFamily: "var(--font-raleway)", fontWeight: 400 }}
  >
            <a
              href="mailto:saaremaalong@gmail.com"
              className="inline-block bg-gray-200 text-black px-6 py-2 rounded-full hover:bg-gray-300 transition"
              
            >
              saaremaalong@gmail.com
            </a>
          </div>
        </div>

        <p className="mt-8 mb-2 text-center font-bold" 
         style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
  >
          Saaremaa Lõng MTÜ
        </p>

      </div>
    </div>

    {/* Parem pool - terve parem pool desktop, alumine osa mobile */}
    <div className="overflow-hidden z-20 flex flex-col justify-center items-center md:h-full min-h-[450px] bg-white md:bg-transparent">

      {/* Form headline */}
      <h2 className="hidden md:block md:mt-3 text-black text-4xl mb-0 md:mb-10 font-bold text-center max-w-md mx-auto" 
          style={{ fontFamily: "var(--font-raleway)", fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
        KIRJUTA MEILE
      </h2>

<form onSubmit={handleSubmit} className="p-8 space-y-4 w-full max-w-md mx-auto"
style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
  >
      <div>
        <input
          type="text"
          name="nimi"
          placeholder="Teie nimi"
          value={formData.nimi}
          onChange={handleChange}
          required
          className="w-full border-b border-black outline-none py-2 text-center text-black placeholder-gray-800 text-m"
        />
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="Teie e-mail"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border-b border-black outline-none py-2 text-center text-black placeholder-gray-800 text-m"
        />
      </div>

      <div>
       <label
  htmlFor="kirjeldus"
  className="block mb-2 mt-6 text-center  text-gray-900"
>
  Sõnumi sisu
</label>

<textarea
  id="kirjeldus"
  name="kirjeldus"

  value={formData.kirjeldus}
  onChange={handleChange}
  required
  className="w-full border border-black rounded-md p-2 text-center text-black h-28 resize-none placeholder-gray-800 text-m"
></textarea>

      </div>
<div className="flex flex-col items-center space-y-2 mt-4">
  <button
    type="submit"
    disabled={loading}
    style={{ fontFamily: "var(--font-raleway)", fontWeight: 800 }}
    className="bg-black text-white font-bold px-6 py-2 rounded-full text-center hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
  >
    {loading ? "Saadan..." : "Pane teele"}
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

  </div>
</section>


      <Footer />


    </div>
  );
}
