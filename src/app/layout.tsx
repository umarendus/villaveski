// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Abril_Fatface } from "next/font/google";

export const metadata: Metadata = {
  title: "Villa Veski",
  description: "Villa Veski - premium accommodation and services.",
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={` ${raleway.variable} ${abrilFatface.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
