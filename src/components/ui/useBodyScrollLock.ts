"use client";

import { useEffect } from "react";

// Modaali ajal ei keri taustaleht (ka mobiilis). Mitu modaali korraga: lukk vabaneb viimase sulgemisel.
let locks = 0;

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      locks -= 1;
      if (locks === 0) body.style.overflow = prevOverflow;
    };
  }, [active]);
}
