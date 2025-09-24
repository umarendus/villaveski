// ./src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Abril_Fatface } from "next/font/google";  // ✅ import Google Font

export const metadata: Metadata = {
  title: "Villa Veski",
  description: "Villa Veski - premium accommodation and services.",
};

// Configure font
const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400", // this font only has 400
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${abrilFatface.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
