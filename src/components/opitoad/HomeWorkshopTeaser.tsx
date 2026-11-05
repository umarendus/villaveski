"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { formatDate, formatPrice, formatTime } from "@/app/lib/opitoad";
import type { WorkshopPublic } from "../../../types/supabase";

const abril = { fontFamily: "'Abril Fatface', serif" };
const raleway = (weight: number) => ({ fontFamily: "var(--font-raleway)", fontWeight: weight });

// Avalehe teade: kuvatakse ainult siis, kui eelseisev õpituba on olemas
export default function HomeWorkshopTeaser() {
  const [w, setW] = useState<WorkshopPublic | null>(null);

  useEffect(() => {
    supabase
      .from("workshops_public")
      .select("*")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        const list = data ?? [];
        // Eelistame õpituba, kuhu saab veel registreeruda
        setW(list.find((x) => x.status === "published" && x.seats_left > 0) ?? list[0] ?? null);
      });
  }, []);

  if (!w) return null;

  const open = w.status === "published" && w.seats_left > 0;

  return (
    <section id="opitoad-teade" className="bg-black text-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative h-64 md:h-auto min-h-[280px]">
          {w.image_url && (
            <Image src={w.image_url} alt={w.title} fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-black/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="px-6 py-10 md:px-12 md:py-14 flex flex-col justify-center"
        >
          <p className="uppercase tracking-[0.25em] text-sm text-[#be9f7a] mb-3" style={raleway(700)}>
            {open ? "Registreerimine on avatud" : "Kohad on täis"}
          </p>
          <h2 className="leading-tight mb-5" style={{ ...abril, fontSize: "clamp(1.9rem, 3.6vw, 3rem)" }}>
            {w.title}
          </h2>

          <ul className="space-y-2 text-gray-200 mb-6" style={raleway(500)}>
            <li className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#be9f7a]" />
              <span className="first-letter:uppercase">{formatDate(w.starts_at)}</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#be9f7a]" />
              Kell {formatTime(w.starts_at)} · {formatPrice(w.price_eur)}, {w.payment_note.toLowerCase()}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#be9f7a]" />
              {w.location}
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/opitoad#registreeru"
              className="inline-block bg-white text-black rounded-full px-8 py-3.5 text-lg hover:bg-[#be9f7a] hover:text-white transition-colors duration-300"
              style={raleway(700)}
            >
              {open ? "Registreeru" : "Pane end huviliste nimekirja"}
            </Link>
            {open && (
              <span className="text-gray-300" style={raleway(500)}>
                <span className="text-3xl text-white mr-1.5 align-middle" style={abril}>
                  {w.seats_left}
                </span>
                {w.seats_left === 1 ? "vaba koht" : "vaba kohta"} {w.capacity}-st
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
