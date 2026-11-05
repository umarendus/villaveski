"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import type { WorkshopGalleryItem } from "../../../types/supabase";

export default function WorkshopGallery() {
  const [items, setItems] = useState<WorkshopGalleryItem[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("workshop_gallery")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);

  const next = useCallback(() => setOpen((i) => (i === null ? i : (i + 1) % items.length)), [items.length]);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div
        className="relative h-30 md:h-50 w-full bg-cover bg-center flex items-center justify-center mb-12"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/idea-banner.webp')" }}
      >
        <h2 className="text-white drop-shadow-lg" style={{ fontFamily: "'Abril Fatface', serif", fontSize: "clamp(1.7rem, 4vw, 4rem)" }}>
          GALERII
        </h2>
      </div>

      <div className="max-w-6xl mx-auto px-6 columns-2 md:columns-3 gap-4 [&>*]:mb-4">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setOpen(index)}
            className="group relative block w-full overflow-hidden rounded-xl cursor-zoom-in break-inside-avoid"
          >
            <Image
              src={item.image_url}
              alt={item.caption || "Õpitoa pilt"}
              width={600}
              height={600}
              sizes="(min-width: 768px) 33vw, 50vw"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.caption && (
              <span
                className="absolute inset-x-0 bottom-0 p-3 text-left text-white text-sm bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
              >
                {item.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && items[open] && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <button className="absolute top-5 right-5 text-white cursor-pointer" aria-label="Sulge">
              <X className="w-8 h-8" />
            </button>
            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="absolute left-3 md:left-6 text-white cursor-pointer p-2"
                  aria-label="Eelmine"
                >
                  <ChevronLeft className="w-9 h-9" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-3 md:right-6 text-white cursor-pointer p-2"
                  aria-label="Järgmine"
                >
                  <ChevronRight className="w-9 h-9" />
                </button>
              </>
            )}
            <Image
              src={items[open].image_url}
              alt={items[open].caption || "Õpitoa pilt"}
              width={1400}
              height={1000}
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
            {items[open].caption && <p className="mt-4 text-white text-lg text-center">{items[open].caption}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
