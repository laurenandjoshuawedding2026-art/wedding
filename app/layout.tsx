import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { client } from "./lib/sanity";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await client.fetch(`*[_type == "eventSettings"][0]{ "ogImage": ogFallbackImage.asset->url }`);
  
  return {
    metadataBase: new URL('https://your-domain.vercel.app'),
    title: "Lauren & Joshua | Wedding Invitation",
    description: "Celebrate with us on July 4th, 2026",
    manifest: "/manifest.json",
    themeColor: "#D6AA67",
    openGraph: {
      title: "Lauren & Joshua | Wedding Invitation",
      description: "Celebrate with us on July 4th, 2026",
      url: "/",
      siteName: "Lauren & Joshua Wedding",
      images: settings?.ogImage ? [{ url: settings.ogImage, width: 1200, height: 630 }] : [],
    },
  };
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-inter antialiased bg-background text-foreground h-full w-full">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
