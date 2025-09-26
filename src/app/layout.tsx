// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Abril_Fatface } from "next/font/google";

// Metadata koos manifesti ja ikoonidega
export const metadata: Metadata = {
  title: "Sörve Villaveski",
  description: "Villaveski - süda ja hing iga lõnga sees.",
  icons: {
    icon: [
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png", sizes: "192x192" },
      { url: "/apple-icon.png", type: "image/png", rel: "apple-touch-icon" },
    ],
  },
  manifest: "/manifest.json",
};

// Viewport koos themeColor
export function generateViewport() {
  return {
    viewport: "width=device-width, initial-scale=1",
    themeColor: "#ffffff",
  };
}

// Local font (Raleway)
const raleway = localFont({
  src: [
    { path: "../fonts/raleway-light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/raleway-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/raleway-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-raleway",
  display: "swap",
});

// Google font (Abril Fatface)
const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${abrilFatface.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
