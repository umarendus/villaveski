import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Villa Veski",
  description: "Villa Veski - premium accommodation and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/section1-bg.webp" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
