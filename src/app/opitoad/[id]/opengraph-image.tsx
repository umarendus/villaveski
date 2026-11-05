// Jagamise pilt konkreetse õpitoa lingile /opitoad/<id>
import { getNextWorkshop, getWorkshopById } from "../../lib/opitoadServer";
import { OG_SIZE, renderWorkshopOg } from "../../lib/opitoadOg";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Sörve Villaveski õpituba";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderWorkshopOg((await getWorkshopById(id)) ?? (await getNextWorkshop()));
}
