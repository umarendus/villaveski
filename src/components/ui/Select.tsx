"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  // "field" = vormiväli, "pill" = väike ümar nupp halduses
  variant?: "field" | "pill";
  className?: string;
};

// Villaveski stiilis rippmenüü: chevron keerab avamisel ümber nagu avalehe teenuste akordionis
export default function Select({
  value,
  onChange,
  options,
  placeholder = "Vali…",
  id,
  ariaLabel,
  disabled,
  variant = "field",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(i: number) {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  }

  const buttonClass =
    variant === "field"
      ? "w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-black text-left focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      : "border border-gray-300 bg-white rounded-full px-4 py-2 text-sm text-gray-800 text-left hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${buttonClass} flex items-center justify-between gap-3 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${selected ? "" : "text-gray-400"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-500 ease-in-out ${variant === "field" ? "w-5 h-5" : "w-4 h-4"} ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-activedescendant={`${listId}-${active}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 max-h-64 overflow-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 ${
              variant === "field" ? "left-0 right-0" : "left-0 min-w-full w-max max-w-[80vw]"
            }`}
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer text-black ${
                    i === active ? "bg-[#f7f4ef]" : ""
                  } ${variant === "pill" ? "text-sm" : ""}`}
                >
                  <span className={isSelected ? "font-bold" : ""}>{o.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#8a6f4f] shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
