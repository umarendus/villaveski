"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ImagePlus, Trash2, X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { WORKSHOP_PHOTO_BUCKET, fromLocalInput, toLocalInput } from "@/app/lib/opitoad";
import type { Workshop, WorkshopStatus } from "../../../../types/supabase";

type Props = {
  workshop: Workshop | null; // null = uus õpituba
  onClose: () => void;
  onSaved: (w: Workshop) => void;
  onDeleted?: () => void;
};

const inputClass =
  "w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent";
const labelClass = "block text-sm text-gray-600 mb-1";

const DEFAULTS = {
  title: "",
  description: "",
  starts_at: "",
  duration_text: "",
  location: "Lepiku talu, Lõu küla, Saaremaa",
  price_eur: 30,
  payment_note: "Maksmine kohapeal",
  includes: "",
  extras: "",
  capacity: 7,
  reserved_offline: 0,
  image_url: null as string | null,
  status: "published" as WorkshopStatus,
};

export async function uploadWorkshopPhoto(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(WORKSHOP_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(WORKSHOP_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeWorkshopPhoto(url: string | null) {
  const path = url?.split(`/${WORKSHOP_PHOTO_BUCKET}/`)[1];
  if (path) await supabase.storage.from(WORKSHOP_PHOTO_BUCKET).remove([path]);
}

export default function WorkshopEditor({ workshop, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState(() =>
    workshop
      ? {
          title: workshop.title,
          description: workshop.description,
          starts_at: toLocalInput(workshop.starts_at),
          duration_text: workshop.duration_text,
          location: workshop.location,
          price_eur: Number(workshop.price_eur),
          payment_note: workshop.payment_note,
          includes: workshop.includes,
          extras: workshop.extras,
          capacity: workshop.capacity,
          reserved_offline: workshop.reserved_offline,
          image_url: workshop.image_url,
          status: workshop.status,
        }
      : DEFAULTS
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [heldByRegistrations, setHeldByRegistrations] = useState<{ people: number; count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ootel ja kinnitatud registreeringud: kohtade arvu kontroll ja kustutamise hoiatus
  useEffect(() => {
    if (!workshop) return;
    supabase
      .from("workshop_registrations")
      .select("participants")
      .eq("workshop_id", workshop.id)
      .in("status", ["pending", "confirmed"])
      .then(({ data }) =>
        setHeldByRegistrations({
          people: (data ?? []).reduce((sum, r) => sum + r.participants, 0),
          count: data?.length ?? 0,
        })
      );
  }, [workshop]);

  // Eelvaate URL luuakse faili kohta üks kord ja vabastatakse hiljem
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Pealkiri on kohustuslik.");
    if (!form.starts_at) return setError("Vali kuupäev ja kellaaeg.");
    const capacity = Math.floor(Number(form.capacity) || 0);
    const offline = Math.max(0, Math.floor(Number(form.reserved_offline) || 0));
    if (capacity < 1) return setError("Kohtade arv peab olema vähemalt 1.");
    if (offline > capacity) return setError("Muul viisil broneeritud kohti ei saa olla rohkem kui kohti kokku.");
    const held = offline + (heldByRegistrations?.people ?? 0);
    if (held > capacity) {
      return setError(
        `Kohti (${capacity}) on vähem kui juba hõivatud (${held}). Suurenda kohtade arvu või eemalda enne osalejaid.`
      );
    }

    setSaving(true);
    try {
      let imageUrl = form.image_url;
      if (file) {
        imageUrl = await uploadWorkshopPhoto(file);
      }
      const payload = {
        ...form,
        title: form.title.trim(),
        starts_at: fromLocalInput(form.starts_at),
        price_eur: Number(form.price_eur) || 0,
        capacity: Math.floor(Number(form.capacity) || 0),
        reserved_offline: Math.max(0, Math.floor(Number(form.reserved_offline) || 0)),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };
      const query = workshop
        ? supabase.from("workshops").update(payload).eq("id", workshop.id).select("*").single()
        : supabase.from("workshops").insert(payload).select("*").single();
      const { data, error } = await query;
      if (error || !data) {
        if (file && imageUrl !== form.image_url) await removeWorkshopPhoto(imageUrl);
        throw error || new Error("Salvestamine ebaõnnestus");
      }
      if (file && workshop?.image_url && workshop.image_url !== imageUrl) await removeWorkshopPhoto(workshop.image_url);
      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvestamine ebaõnnestus");
    } finally {
      setSaving(false);
    }
  }

  // Ootel/kinnitatud registreeringud liiguvad huviliste nimekirja ja õpituba kustutatakse ühes tehingus
  async function remove() {
    if (!workshop) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_delete_workshop", { p_workshop_id: workshop.id });
    setSaving(false);
    if (error) {
      setConfirmDelete(false);
      return setError(error.message.includes("forbidden") ? "Sul pole õigust õpitubasid kustutada." : error.message);
    }
    if (workshop.image_url) await removeWorkshopPhoto(workshop.image_url);
    onDeleted?.();
  }

  const preview = filePreview ?? form.image_url;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto" onClick={() => !saving && onClose()}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl md:rounded-2xl shadow-2xl min-h-screen md:min-h-0"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white md:rounded-t-2xl z-10">
          <h2 className="text-2xl text-black" style={{ fontFamily: "'Abril Fatface', serif" }}>
            {workshop ? "Muuda õpituba" : "Uus õpituba"}
          </h2>
          <button type="button" onClick={onClose} className="p-2 cursor-pointer text-gray-500 hover:text-black" aria-label="Sulge">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pilt */}
          <div className="md:col-span-2">
            <span className={labelClass}>Pilt</span>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
              }}
              className="relative h-56 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-500 cursor-pointer overflow-hidden flex items-center justify-center text-gray-500 transition"
            >
              {preview ? (
                <>
                  <Image src={preview} alt="" fill className="object-cover" unoptimized={Boolean(file)} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white gap-2">
                    <ImagePlus className="w-5 h-5" /> Vaheta pilti
                  </div>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" /> Lohista siia pilt või kliki
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="w-title">Pealkiri *</label>
            <input id="w-title" className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Tapikangaspuu õpituba" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="w-desc">Kirjeldus</label>
            <textarea id="w-desc" rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div>
            <label className={labelClass} htmlFor="w-start">Algus (kuupäev ja kellaaeg) *</label>
            <input id="w-start" type="datetime-local" className={inputClass} value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="w-dur">Kestus</label>
            <input id="w-dur" className={inputClass} value={form.duration_text} onChange={(e) => set("duration_text", e.target.value)} placeholder="nt umbes 4 tundi" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="w-loc">Toimumiskoht</label>
            <input id="w-loc" className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>

          <div>
            <label className={labelClass} htmlFor="w-price">Hind (€)</label>
            <input id="w-price" type="number" min={0} step="0.01" className={inputClass} value={form.price_eur} onChange={(e) => set("price_eur", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass} htmlFor="w-pay">Maksmise info</label>
            <input id="w-pay" className={inputClass} value={form.payment_note} onChange={(e) => set("payment_note", e.target.value)} />
          </div>

          <div>
            <label className={labelClass} htmlFor="w-cap">Kohti kokku</label>
            <input id="w-cap" type="number" min={1} className={inputClass} value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass} htmlFor="w-off">Juba broneeritud (väljaspool lehte)</label>
            <input id="w-off" type="number" min={0} className={inputClass} value={form.reserved_offline} onChange={(e) => set("reserved_offline", Number(e.target.value))} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="w-inc">Hinna sees (iga rida eraldi punkt)</label>
            <textarea id="w-inc" rows={4} className={inputClass} value={form.includes} onChange={(e) => set("includes", e.target.value)} placeholder={"Õpetus\nTee ja kohv\n40 × 90 cm villavaip"} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="w-ext">Lisaks saab osta</label>
            <textarea id="w-ext" rows={2} className={inputClass} value={form.extras} onChange={(e) => set("extras", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <span className={labelClass}>Nähtavus</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["published", "Avalik, registreerimine avatud"],
                  ["closed", "Avalik, registreerimine suletud"],
                  ["draft", "Mustand (peidetud)"],
                ] as [WorkshopStatus, string][]
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => set("status", value)}
                  className={`px-4 py-2 rounded-full border text-sm cursor-pointer transition ${
                    form.status === value ? "bg-black text-white border-black" : "border-gray-300 text-gray-700 hover:border-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="md:col-span-2 text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white md:rounded-b-2xl">
          {workshop ? (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="flex items-center gap-2 text-red-800 hover:text-red-600 cursor-pointer text-sm">
              <Trash2 className="w-4 h-4" /> Kustuta
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full border border-gray-300 cursor-pointer hover:bg-gray-50">
              Tühista
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-full bg-black text-white cursor-pointer hover:bg-gray-800 disabled:opacity-50">
              {saving ? "Salvestan..." : "Salvesta"}
            </button>
          </div>
        </div>
      </form>

      {confirmDelete && workshop && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (!saving) setConfirmDelete(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8"
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-900 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl text-black text-center mb-2" style={{ fontFamily: "'Abril Fatface', serif" }}>
              Kustuta õpituba?
            </h2>
            <p className="text-center text-gray-600 mb-4">
              <strong className="text-black">{workshop.title}</strong> kustutatakse jäädavalt ja kaob avalikult lehelt.
            </p>
            {heldByRegistrations && heldByRegistrations.count > 0 && (
              <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  Õpitoal on {heldByRegistrations.count} ootel või kinnitatud registreeringut (
                  {heldByRegistrations.people} inimest). Need liiguvad huviliste nimekirja <strong>ilma teavituseta</strong>.
                  Kui soovid osalejaid e-kirjaga teavitada, eemalda nad enne õpitoa lehel nupuga „Eemalda“.
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-full cursor-pointer hover:bg-gray-50 disabled:opacity-50"
              >
                Tühista
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="flex-1 bg-red-900 text-white py-2.5 rounded-full cursor-pointer hover:bg-red-800 disabled:opacity-50"
              >
                {saving ? "Kustutan..." : "Kustuta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
