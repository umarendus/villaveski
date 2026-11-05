"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Check, Clock, Euro, MapPin, ShoppingBasket } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { formatDate, formatPrice, formatTime, hasStarted, splitLines, startOfTodayTallinnIso } from "@/app/lib/opitoad";
import type { WorkshopPublic } from "../../../types/supabase";
import RegistrationForm, { SheepPair } from "./RegistrationForm";
import ShareWorkshop from "./ShareWorkshop";

const abril = { fontFamily: "'Abril Fatface', serif" };
const raleway = (weight: number) => ({ fontFamily: "var(--font-raleway)", fontWeight: weight });

// focusId: jagatud lingilt (/opitoad/<id>) avades keritakse selle õpitoa juurde
export default function WorkshopsSection({ focusId }: { focusId?: string }) {
  const [workshops, setWorkshops] = useState<WorkshopPublic[] | null>(null);

  useEffect(() => {
    supabase
      .from("workshops_public")
      .select("*")
      // Õpituba on nähtav kuni toimumispäeva lõpuni, järgmisest päevast kaob
      .gte("starts_at", startOfTodayTallinnIso())
      .order("starts_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setWorkshops(data ?? []);
      });
  }, []);

  // Sisu laetakse andmebaasist pärast lehe avanemist, seega #registreeru ankrule (avalehe nupp,
  // e-kirjade nupud) tuleb kerida alles siis, kui õpitoad on ekraanil
  useEffect(() => {
    if (workshops === null) return;
    const id = focusId ? `opituba-${focusId}` : decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    // Väike viivitus: Next.js-i ruuter ja piltide paigutus võivad muidu kerimise üle kirjutada
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 250);
    return () => clearTimeout(timer);
  }, [workshops, focusId]);

  if (workshops === null) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="animate-pulse grid lg:grid-cols-2 gap-10">
          <div className="bg-gray-100 rounded-2xl h-96" />
          <div className="space-y-4">
            <div className="bg-gray-100 h-10 w-2/3 rounded" />
            <div className="bg-gray-100 h-4 w-full rounded" />
            <div className="bg-gray-100 h-4 w-5/6 rounded" />
            <div className="bg-gray-100 h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (workshops.length === 0) {
    return (
      <section id="registreeru" className="bg-[#f7f4ef] py-16 md:py-24 px-6 scroll-mt-16">
        <div className="max-w-3xl mx-auto text-center">
          <SheepPair />
          <h2 className="text-black mt-4 mb-4" style={{ ...abril, fontSize: "clamp(1.7rem, 3.5vw, 3rem)" }}>
            JÄRGMINE ÕPITUBA
          </h2>
          <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-10">
            Hetkel ei ole avatud õpitubasid, kuid uued on juba plaanis. Jäta oma kontaktid ja anname sulle esimesena
            teada, kui registreerimine avaneb.
          </p>
          <RegistrationForm workshopId={null} mode="waitlist" maxParticipants={6} />
        </div>
      </section>
    );
  }

  return (
    <div>
      {workshops.map((w, i) => (
        <WorkshopBlock key={w.id} workshop={w} first={i === 0} />
      ))}
    </div>
  );
}

function WorkshopBlock({ workshop: initial, first }: { workshop: WorkshopPublic; first: boolean }) {
  const [w, setW] = useState(initial);
  const started = hasStarted(w.starts_at);
  const full = w.seats_left <= 0 || w.status === "closed" || started;
  const includes = splitLines(w.includes);
  const taken = w.capacity - w.seats_left;

  return (
    <section id={`opituba-${w.id}`} className="relative py-14 md:py-20 scroll-mt-16">
      {first && <div id="registreeru" className="absolute top-0 scroll-mt-16" aria-hidden="true" />}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Pilt */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl shadow-xl lg:sticky lg:top-24"
          >
            {w.image_url ? (
              <Image
                src={w.image_url}
                alt={w.title}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
                priority={first}
              />
            ) : (
              <div className="absolute inset-0 bg-[#f7f4ef]" />
            )}
            <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-5 py-3 rounded-xl text-center shadow-md">
              <div className="text-4xl leading-none text-black" style={abril}>
                {new Intl.DateTimeFormat("et-EE", { timeZone: "Europe/Tallinn", day: "numeric" }).format(
                  new Date(w.starts_at)
                )}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#8a6f4f] mt-1" style={raleway(700)}>
                {new Intl.DateTimeFormat("et-EE", { timeZone: "Europe/Tallinn", month: "long" }).format(
                  new Date(w.starts_at)
                )}
              </div>
            </div>
            {full && (
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-center py-3 tracking-widest uppercase text-sm" style={raleway(700)}>
                {started ? "Õpituba on toimunud" : "Kohad on täis"}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <div className="text-black">
            <p className="uppercase tracking-[0.25em] text-sm text-[#8a6f4f] mb-3" style={raleway(700)}>
              {started ? "Registreerimine on lõppenud" : full ? "Õpituba on täis" : "Registreerimine on avatud"}
            </p>
            <h2 className="leading-tight mb-6" style={{ ...abril, fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>
              {w.title}
            </h2>
            {w.description && (
              <p className="text-lg md:text-xl leading-relaxed text-gray-800 mb-8 whitespace-pre-line">{w.description}</p>
            )}

            <ul className="grid sm:grid-cols-2 gap-4 mb-8" style={raleway(500)}>
              <InfoItem icon={<Calendar className="w-5 h-5" />} label="Kuupäev" value={formatDate(w.starts_at)} />
              <InfoItem
                icon={<Clock className="w-5 h-5" />}
                label="Kellaaeg"
                value={`Kell ${formatTime(w.starts_at)}${w.duration_text ? ` · ${w.duration_text}` : ""}`}
              />
              <InfoItem icon={<MapPin className="w-5 h-5" />} label="Toimumiskoht" value={w.location} />
              <InfoItem
                icon={<Euro className="w-5 h-5" />}
                label="Osalustasu"
                value={`${formatPrice(w.price_eur)} · ${w.payment_note}`}
              />
            </ul>

            {includes.length > 0 && (
              <div className="bg-[#f7f4ef] rounded-2xl p-6 mb-6">
                <h3 className="text-lg mb-4" style={raleway(700)}>
                  Osalustasu eest saad
                </h3>
                <ul className="space-y-3">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-gray-800 text-lg" style={raleway(400)}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {w.extras && (
              <p className="flex items-start gap-3 text-gray-700 mb-8">
                <ShoppingBasket className="w-5 h-5 mt-1 flex-shrink-0 text-[#8a6f4f]" />
                <span>{w.extras}</span>
              </p>
            )}

            {!started && <SeatsMeter capacity={w.capacity} taken={taken} seatsLeft={w.seats_left} />}
            {!started && (
              <div className="mt-5">
                <ShareWorkshop workshop={w} />
              </div>
            )}
          </div>
        </div>

        {/* Vorm */}
        <div className="max-w-3xl mx-auto mt-14 md:mt-20">
          <div className="text-center mb-8">
            <SheepPair />
            <h3 className="mt-3 text-black" style={{ ...abril, fontSize: "clamp(1.6rem, 3vw, 2.6rem)" }}>
              {started ? "REGISTREERIMINE ON LÕPPENUD" : full ? "KAHJUKS ON KOHAD TÄIS" : "REGISTREERU"}
            </h3>
            {started ? (
              <p className="mt-4 text-lg text-gray-800 leading-relaxed">
                See õpituba on juba alanud või toimunud. Kui oled huviline, paneme sind järgmise õpitoa jaoks kirja –
                anname sulle esimesena teada!
              </p>
            ) : full ? (
              <p className="mt-4 text-lg text-gray-800 leading-relaxed">
                Selle õpitoa kohad on juba täis, kuid kui oled huviline, paneme sind tulevikuks kirja. Kohtade täitumisel
                teeme uue õpitoa – anname sulle esimesena teada!
              </p>
            ) : (
              <p className="mt-4 text-lg text-gray-800 leading-relaxed">
                Täida vorm ja Villaveski kinnitab registreeringu e-kirjaga. Oled registreeritud alles pärast kinnituskirja. Maksmine toimub kohapeal.
              </p>
            )}
          </div>
          <RegistrationForm
            workshopId={w.id}
            mode={full ? "waitlist" : "register"}
            maxParticipants={full ? 6 : w.seats_left}
            priceEur={Number(w.price_eur)}
            onRegistered={(left) => left !== null && setW((prev) => ({ ...prev, seats_left: left }))}
          />
        </div>
      </div>
    </section>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 border-b border-gray-200 pb-4">
      <span className="mt-0.5 text-[#8a6f4f]">{icon}</span>
      <span>
        <span className="block text-xs uppercase tracking-[0.18em] text-gray-500">{label}</span>
        <span className="block text-base md:text-lg text-black first-letter:uppercase">{value}</span>
      </span>
    </li>
  );
}

function SeatsMeter({ capacity, taken, seatsLeft }: { capacity: number; taken: number; seatsLeft: number }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-6" style={raleway(500)}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-5xl text-black leading-none" style={abril}>
            {seatsLeft}
          </span>
          <span className="ml-2 text-gray-600">/ {capacity} kohta vaba</span>
        </div>
        {seatsLeft > 0 && seatsLeft <= 2 && (
          <span className="text-sm uppercase tracking-widest text-red-800" style={raleway(700)}>
            Viimased kohad!
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: capacity }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 min-w-[18px] rounded-full transition-colors ${i < taken ? "bg-black" : "bg-[#be9f7a]/35"}`}
          />
        ))}
      </div>
    </div>
  );
}
