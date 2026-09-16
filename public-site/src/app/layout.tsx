import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getFuelPrices, getSiteContent } from "@/lib/data";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-numeral",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Ridgeline Aviation / Summit Jet Center",
  description: "FBO, fuel, and aircraft maintenance at Ridgeline Regional Airport (KXRG).",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [site, prices] = await Promise.all([getSiteContent(), getFuelPrices()]);

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--color-paper)" }}>
        <Nav site={site} prices={prices} />
        <main className="flex-1">{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
