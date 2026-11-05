import type { Metadata } from "next";
import OpitoadContent from "@/components/opitoad/OpitoadContent";
import { getNextWorkshop, shareDescription, shareTitle } from "../lib/opitoadServer";

// Jagamise eelvaade (Facebook, Messenger, WhatsApp): võtab eelseisva õpitoa info kaasa.
// Pilt tuleb failist opengraph-image.tsx.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const w = await getNextWorkshop();
  const title = shareTitle(w);
  const description = shareDescription(w);
  return {
    title,
    description,
    alternates: { canonical: "/opitoad" },
    openGraph: {
      title,
      description,
      url: "/opitoad",
      siteName: "Sörve Villaveski",
      locale: "et_EE",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function OpiToadPage() {
  return <OpitoadContent />;
}
