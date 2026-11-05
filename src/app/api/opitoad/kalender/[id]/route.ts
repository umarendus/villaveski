import { buildIcs } from "../../../../lib/calendar";
import { getWorkshopById } from "../../../../lib/opitoadServer";

export const runtime = "nodejs";

// .ics fail kinnituskirja nupu jaoks: iPhone, Mac, Outlook ja Android avavad selle kalendris
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWorkshopById(id);
  if (!w) return new Response("Õpituba ei leitud", { status: 404 });
  return new Response(buildIcs(w), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="villaveski-opituba.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
