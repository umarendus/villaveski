import type { Metadata } from "next";

// Halduslehed: otsingumootorid neid ei indekseeri
export const metadata: Metadata = {
  title: "Haldus | Sörve Villaveski",
  robots: { index: false, follow: false },
};

export default function HaldusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
