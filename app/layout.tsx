import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lauren & Joshua | Wedding Invitation",
  description: "Celebrate with us on July 4th, 2026",
  manifest: "/manifest.json",
  themeColor: "#D6AA67",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-inter antialiased bg-background text-foreground">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
