"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Modaalid otse <body> alla, et lehe päis ega animeeritud vanemad neid ei kataks ega lõikaks
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
