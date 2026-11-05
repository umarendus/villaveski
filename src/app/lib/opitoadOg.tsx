// Jagamise pildi (Open Graph) kujundus: õpitoa foto + info Villaveski kujunduses
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import type { WorkshopPublic } from "../../../types/supabase";
import { formatDate, formatPrice, formatTime } from "./opitoad";
import { isOpen } from "./opitoadServer";

export const OG_SIZE = { width: 1200, height: 630 };

const GOLD = "#be9f7a";

async function photoSrc(imageUrl: string | null | undefined) {
  // Halduses üles laaditud JPG/PNG pilt otse; muul juhul (nt webp) kaasas olev foto
  if (imageUrl && /^https?:\/\/.+\.(jpe?g|png)(\?.*)?$/i.test(imageUrl)) return imageUrl;
  const data = await readFile(join(process.cwd(), "src/assets/opitoad-og-photo.jpg"));
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

export async function renderWorkshopOg(w: WorkshopPublic | null) {
  const abril = await readFile(join(process.cwd(), "src/assets/AbrilFatface-Regular.ttf"));
  const photo = await photoSrc(w?.image_url);
  const open = w ? isOpen(w) : false;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse vajab tavalist img-i */}
        <img src={photo} alt="" width={470} height={630} style={{ width: 470, height: 630, objectFit: "cover" }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 60px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: GOLD, textTransform: "uppercase" }}>
            {!w ? "Sörve Villaveski" : open ? "Registreerimine on avatud" : new Date(w.starts_at) <= new Date() ? "Õpituba on toimunud" : "Kohad on täis"}
          </div>
          <div style={{ display: "flex", fontFamily: "Abril", fontSize: w && w.title.length > 24 ? 58 : 68, lineHeight: 1.08, marginTop: 18 }}>
            {w ? w.title : "Meie õpitoad"}
          </div>
          {w ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 30, fontSize: 30, color: "#e8e2d8", lineHeight: 1.45 }}>
              <div style={{ display: "flex" }}>{formatDate(w.starts_at).replace(/^\w/, (c) => c.toUpperCase())}</div>
              <div style={{ display: "flex" }}>
                Kell {formatTime(w.starts_at)} · {formatPrice(w.price_eur)}
              </div>
              <div style={{ display: "flex" }}>{w.location}</div>
            </div>
          ) : (
            <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#e8e2d8" }}>
              Lepiku talu, Lõu küla, Saaremaa
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
            {w && open && (
              <div
                style={{
                  display: "flex",
                  background: "#fff",
                  color: "#000",
                  borderRadius: 999,
                  padding: "12px 30px",
                  fontSize: 26,
                  fontWeight: 700,
                  marginRight: 24,
                }}
              >
                {`${w.seats_left} vaba kohta ${w.capacity}-st`}
              </div>
            )}
            <div style={{ display: "flex", fontSize: 24, color: GOLD }}>villaveski.ee/opitoad</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Abril", data: abril, style: "normal", weight: 400 }] }
  );
}
