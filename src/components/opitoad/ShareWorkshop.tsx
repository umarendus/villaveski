"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Mail, Share2, X } from "lucide-react";
import { SITE_URL } from "@/app/lib/emailTemplates";
import { formatDate } from "@/app/lib/opitoad";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import Portal from "@/components/ui/Portal";

type Props = {
  workshop: { id: string; title: string; starts_at: string };
  variant?: "public" | "admin";
  className?: string;
};

export function workshopShareUrl(id: string) {
  return `${SITE_URL}/opitoad/${id}`;
}

// "Jaga õpituba" nupp + modaal kopeeritava lingiga
export default function ShareWorkshop({ workshop, variant = "public", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "public"
            ? `inline-flex items-center gap-2 border-2 border-black text-black rounded-full px-6 py-3 cursor-pointer hover:bg-black hover:text-white transition-colors ${className}`
            : `inline-flex items-center justify-center gap-1.5 px-4 rounded-full border border-gray-300 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 ${className}`
        }
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
      >
        <Share2 className="w-4 h-4" /> {variant === "public" ? "Jaga õpituba" : "Jaga"}
      </button>
      <Portal>
        <AnimatePresence>{open && <ShareModal workshop={workshop} onClose={() => setOpen(false)} />}</AnimatePresence>
      </Portal>
    </>
  );
}

function ShareModal({ workshop, onClose }: { workshop: Props["workshop"]; onClose: () => void }) {
  useBodyScrollLock();
  const url = workshopShareUrl(workshop.id);
  const text = `${workshop.title} – ${formatDate(workshop.starts_at)}. Sörve Villaveski õpituba:`;
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Vanemad brauserid: vali tekst ja kopeeri
      inputRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: workshop.title, text, url });
    } catch {
      // kasutaja loobus
    }
  }

  const links = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.5V14h2.7v8h3.3z" />
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.1-.4z" />
        </svg>
      ),
    },
    {
      label: "E-post",
      href: `mailto:?subject=${encodeURIComponent(workshop.title)}&body=${encodeURIComponent(`${text}\n${url}`)}`,
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 md:p-8"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black cursor-pointer"
          aria-label="Sulge"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 id="share-title" className="text-2xl md:text-3xl text-black pr-8" style={{ fontFamily: "'Abril Fatface', serif" }}>
          Jaga õpituba
        </h2>
        <p className="text-gray-600 mt-1 mb-5">
          {workshop.title} · <span className="first-letter:uppercase">{formatDate(workshop.starts_at)}</span>
        </p>

        <label htmlFor="share-url" className="block text-sm text-gray-600 mb-1.5">
          Link
        </label>
        <div className="flex gap-2">
          <input
            id="share-url"
            ref={inputRef}
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 border border-gray-300 rounded-xl px-3 py-3 text-sm text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            onClick={copy}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors ${
              copied ? "bg-green-700 text-white" : "bg-black text-white hover:bg-gray-800"
            }`}
            style={{ fontWeight: 700 }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopeeritud!" : "Kopeeri link"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Facebookis, Messengeris ja WhatsAppis kuvatakse lingi juures õpitoa pilt, kuupäev, koht ja vabad kohad.
        </p>

        <div className="grid grid-cols-3 gap-2 mt-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 text-sm text-black hover:border-black transition-colors"
            >
              {l.icon}
              {l.label}
            </a>
          ))}
        </div>

        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm text-black hover:border-black cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Muud jagamisvõimalused
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
