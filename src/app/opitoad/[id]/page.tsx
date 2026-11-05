import type { Metadata } from "next";
import OpitoadContent from "@/components/opitoad/OpitoadContent";
import { getWorkshopById, shareDescription, shareTitle } from "../../lib/opitoadServer";

// Jagatav link konkreetsele õpitoale: eelvaade (Facebook jne) näitab just selle õpitoa infot,
// leht ise on sama mis /opitoad ja kerib selle õpitoa juurde
export const revalidate = 300;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const w = await getWorkshopById(id);
  const title = shareTitle(w);
  const description = shareDescription(w);
  const url = w ? `/opitoad/${w.id}` : "/opitoad";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Sörve Villaveski", locale: "et_EE", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function OpitubaPage({ params }: Params) {
  const { id } = await params;
  return <OpitoadContent focusId={id} />;
}
