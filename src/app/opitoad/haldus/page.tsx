"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Download, ExternalLink, ImagePlus, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import WorkshopEditor, { removeWorkshopPhoto, uploadWorkshopPhoto } from "@/components/admin/opitoad/WorkshopEditor";
import EmailTemplatesManager from "@/components/admin/opitoad/EmailTemplatesManager";
import RegistrationCard, { downloadCsv, registrationsToCsv, seatsTaken } from "@/components/admin/opitoad/RegistrationCard";
import { supabase } from "../../lib/supabaseClient";
import { formatDate, formatTime } from "../../lib/opitoad";
import type { Workshop, WorkshopGalleryItem, WorkshopRegistration } from "../../../../types/supabase";

type Tab = "opitoad" | "huvilised" | "galerii" | "kirjad";

const abril = { fontFamily: "'Abril Fatface', serif" };

export default function OpitubadeHaldus() {
  return <AdminShell>{() => <Dashboard />}</AdminShell>;
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("opitoad");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [regs, setRegs] = useState<WorkshopRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Workshop | null | "new">(null);

  const load = useCallback(async () => {
    const [w, r] = await Promise.all([
      supabase.from("workshops").select("*").order("starts_at", { ascending: true }),
      supabase.from("workshop_registrations").select("*").order("created_at", { ascending: false }),
    ]);
    if (w.error || r.error) setError((w.error || r.error)!.message);
    setWorkshops(w.data ?? []);
    setRegs(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const upcoming = workshops.filter((w) => new Date(w.starts_at).getTime() >= now - 6 * 3600_000);
  const past = workshops.filter((w) => new Date(w.starts_at).getTime() < now - 6 * 3600_000).reverse();
  const pendingTotal = regs.filter((r) => r.status === "pending").length;
  const waitlist = regs.filter((r) => r.status === "waitlist");

  return (
    <main className={`${tab === "kirjad" ? "max-w-[1500px]" : "max-w-6xl"} mx-auto px-4 py-8 md:py-12`} style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl text-black" style={abril}>
            Õpitubade haldus
          </h1>
          <p className="text-gray-600 mt-2">
            {pendingTotal > 0 ? (
              <span className="text-amber-800">{pendingTotal} registreeringut ootab kinnitust</span>
            ) : (
              "Kõik registreeringud on üle vaadatud"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/opitoad"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-300 hover:bg-white text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Vaata lehte
          </Link>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white hover:bg-gray-800 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" /> Uus õpituba
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto">
        {(
          [
            ["opitoad", "Õpitoad", workshops.length],
            ["huvilised", "Huvilised", waitlist.length],
            ["galerii", "Galerii", null],
            ["kirjad", "E-kirjad", null],
          ] as [Tab, string, number | null][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 -mb-px border-b-2 cursor-pointer whitespace-nowrap transition ${
              tab === key ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {label}
            {count !== null && <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">{count}</span>}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-6 text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error} – kas andmebaasi migratsioon on käivitatud?
        </p>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      ) : tab === "opitoad" ? (
        <>
          {upcoming.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-600 mb-4">Eelseisvaid õpitubasid pole.</p>
              <button onClick={() => setEditing("new")} className="px-5 py-2.5 rounded-full bg-black text-white cursor-pointer">
                Lisa õpituba
              </button>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {upcoming.map((w) => (
              <WorkshopCard key={w.id} w={w} regs={regs} onEdit={() => setEditing(w)} />
            ))}
          </div>
          {past.length > 0 && (
            <>
              <h2 className="text-xl text-gray-500 mt-14 mb-4">Toimunud õpitoad</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {past.map((w) => (
                  <WorkshopCard key={w.id} w={w} regs={regs} onEdit={() => setEditing(w)} compact />
                ))}
              </div>
            </>
          )}
        </>
      ) : tab === "huvilised" ? (
        <Waitlist
          regs={waitlist}
          workshops={workshops}
          upcoming={upcoming}
          onChanged={(id, reg) =>
            setRegs((prev) => (reg ? prev.map((r) => (r.id === id ? reg : r)) : prev.filter((r) => r.id !== id)))
          }
        />
      ) : tab === "galerii" ? (
        <GalleryManager workshops={workshops} />
      ) : (
        <EmailTemplatesManager workshops={workshops} />
      )}

      {editing && (
        <WorkshopEditor
          workshop={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onDeleted={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function WorkshopCard({
  w,
  regs,
  onEdit,
  compact,
}: {
  w: Workshop;
  regs: WorkshopRegistration[];
  onEdit: () => void;
  compact?: boolean;
}) {
  const taken = seatsTaken(w, regs);
  const left = Math.max(w.capacity - taken, 0);
  const mine = regs.filter((r) => r.workshop_id === w.id);
  const pending = mine.filter((r) => r.status === "pending").length;
  const confirmed = mine.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.participants, 0);
  const waiting = mine.filter((r) => r.status === "waitlist").length;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col ${compact ? "opacity-80" : ""}`}>
      {!compact && (
        <div className="relative h-44 bg-[#f7f4ef]">
          {w.image_url && <Image src={w.image_url} alt="" fill className="object-cover" sizes="560px" />}
          <span
            className={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full ${
              w.status === "published" ? "bg-white text-black" : w.status === "closed" ? "bg-black text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {w.status === "published" ? "Avalik" : w.status === "closed" ? "Registreerimine suletud" : "Mustand"}
          </span>
          {pending > 0 && (
            <span className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-amber-400 text-black font-semibold">
              {pending} ootel
            </span>
          )}
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className={`${compact ? "text-lg" : "text-2xl"} text-black mb-2`} style={abril}>
          {w.title}
        </h3>
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" /> {formatDate(w.starts_at)}, kell {formatTime(w.starts_at)}
        </p>
        {!compact && (
          <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MapPin className="w-4 h-4" /> {w.location}
          </p>
        )}

        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-2">
            <span>
              <span className="text-3xl text-black" style={abril}>
                {left}
              </span>
              <span className="text-gray-500 ml-1.5">/ {w.capacity} vaba</span>
            </span>
            <span className="text-xs text-gray-500">
              {confirmed} kinnitatud{w.reserved_offline ? ` · ${w.reserved_offline} muul viisil` : ""}
              {waiting ? ` · ${waiting} järjekorras` : ""}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: w.capacity }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < taken ? "bg-black" : "bg-[#be9f7a]/30"}`} />
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
          <Link
            href={`/opitoad/haldus/${w.id}`}
            className="flex-1 flex items-center justify-center gap-1 bg-black text-white rounded-full py-2.5 text-sm hover:bg-gray-800"
          >
            {pending > 0 ? "Kinnita osalejad" : "Osalejad"} <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-4 rounded-full border border-gray-300 text-sm cursor-pointer hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" /> Muuda
          </button>
        </div>
      </div>
    </div>
  );
}

function Waitlist({
  regs,
  workshops,
  upcoming,
  onChanged,
}: {
  regs: WorkshopRegistration[];
  workshops: Workshop[];
  upcoming: Workshop[];
  onChanged: (id: string, reg: WorkshopRegistration | null) => void;
}) {
  const titles = new Map(workshops.map((w) => [w.id, w.title]));
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <p className="text-gray-600 max-w-2xl">
          Siin on inimesed, kes soovisid tulla, kui kohad olid täis või avatud õpituba polnud. Uue õpitoa loomisel saad
          nad sinna tõsta – seejärel kinnita nad õpitoa lehel.
        </p>
        {regs.length > 0 && (
          <button
            onClick={() => downloadCsv("huvilised.csv", registrationsToCsv(regs, workshops))}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm cursor-pointer hover:bg-white"
          >
            <Download className="w-4 h-4" /> Laadi alla (CSV)
          </button>
        )}
      </div>
      {regs.length === 0 ? (
        <p className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          Huviliste nimekiri on tühi.
        </p>
      ) : (
        <div className="space-y-3">
          {regs.map((r) => (
            <div key={r.id}>
              <p className="text-xs text-gray-500 mb-1 ml-1">
                {r.workshop_id ? `Soovis: ${titles.get(r.workshop_id) ?? "õpituba"}` : "Üldine huviliste nimekiri"}
              </p>
              <RegistrationCard
                reg={r}
                moveTargets={upcoming.filter((w) => w.id !== r.workshop_id)}
                onChanged={(reg) => onChanged(r.id, reg)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryManager({ workshops }: { workshops: Workshop[] }) {
  const [items, setItems] = useState<WorkshopGalleryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("workshop_gallery").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return setError("Vali vähemalt üks pilt.");
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const url = await uploadWorkshopPhoto(file);
        const { error } = await supabase
          .from("workshop_gallery")
          .insert({ image_url: url, caption: caption.trim(), workshop_id: workshopId || null });
        if (error) throw error;
      }
      setFiles([]);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Üleslaadimine ebaõnnestus");
    } finally {
      setUploading(false);
    }
  }

  async function remove(item: WorkshopGalleryItem) {
    if (!confirm("Kustutada pilt galeriist?")) return;
    const { error } = await supabase.from("workshop_gallery").delete().eq("id", item.id);
    if (error) return setError(error.message);
    await removeWorkshopPhoto(item.image_url);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function saveCaption(item: WorkshopGalleryItem, value: string) {
    if (value === item.caption) return;
    await supabase.from("workshop_gallery").update({ caption: value }).eq("id", item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, caption: value } : i)));
  }

  return (
    <div>
      <form onSubmit={upload} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 mb-8">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
          }}
          className="border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-xl py-10 flex flex-col items-center justify-center gap-2 text-gray-500 cursor-pointer transition"
        >
          <ImagePlus className="w-8 h-8" />
          {files.length ? (
            <span className="text-black">{files.length} pilti valitud</span>
          ) : (
            <span>Lohista siia pildid või kliki (võib valida mitu)</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 mt-4">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Pildiallkiri (soovi korral)"
            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <select
            value={workshopId}
            onChange={(e) => setWorkshopId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white cursor-pointer"
          >
            <option value="">Ei seo õpitoaga</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} · {formatDate(w.starts_at)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={uploading}
            className="bg-black text-white rounded-full px-6 py-2.5 cursor-pointer hover:bg-gray-800 disabled:opacity-50"
          >
            {uploading ? "Laen üles..." : "Lisa galeriisse"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
      </form>

      {items.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Galeriis pole veel pilte. Need ilmuvad õpitubade lehe allossa.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 group">
              <div className="relative aspect-square">
                <Image src={item.image_url} alt="" fill className="object-cover" sizes="300px" />
                <button
                  onClick={() => remove(item)}
                  className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-black"
                  title="Kustuta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                defaultValue={item.caption}
                onBlur={(e) => saveCaption(item, e.target.value.trim())}
                placeholder="Lisa allkiri…"
                className="w-full px-3 py-2 text-sm focus:outline-none focus:bg-gray-50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
