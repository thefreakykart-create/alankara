import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";



const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alankara | Where Heritage Meets Home",
  description:
    "Contemporary Indian home decor that blends heritage craft with modern aesthetics. Handcrafted pieces for the mindful home.",
  keywords: [
    "home decor",
    "Indian home decor",
    "handcrafted",
    "artisan",
    "contemporary decor",
    "luxury home",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} font-sans antialiased grain`}
      >
          <Header />
          <main>{children}</main>
          <Footer />
      </body>
    </html>
  );
}
