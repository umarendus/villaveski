import sharp from "sharp";
import { getWorkshopById } from "../../../../lib/opitoadServer";

export const runtime = "nodejs";

// E-kirjade päisepilt: õpitoa foto lõigatuna laiaks JPEG-iks (1200×600).
// Püstine foto oleks telefonis liiga kõrge ja Outlook ei näita WebP-pilte.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWorkshopById(id);
  if (!w?.image_url) return new Response("Pilti ei leitud", { status: 404 });

  const source = new URL(w.image_url, request.url);
  try {
    const res = await fetch(source, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`pilt ${res.status}`);
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(1200, 600, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Kirjapildi loomine ebaõnnestus", err);
    return Response.redirect(source, 302);
  }
}
