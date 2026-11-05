// Jagamise pilt /opitoad lingile: eelseisev õpituba
import { getNextWorkshop } from "../lib/opitoadServer";
import { OG_SIZE, renderWorkshopOg } from "../lib/opitoadOg";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Sörve Villaveski õpitoad";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  return renderWorkshopOg(await getNextWorkshop());
}
