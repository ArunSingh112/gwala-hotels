import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default:
      "Gwala Hotels Vrindavan — Hotels near Banke Bihari Mandir, Prem Mandir & ISKCON",
    template: "%s | Gwala Hotels Vrindavan",
  },
  description:
    "Book budget-friendly family hotels in Vrindavan near Banke Bihari Mandir, Prem Mandir and ISKCON. Five Gwala Hotels branches, clean AC rooms from ₹1,200 — book online, pay at the hotel, free cancellation.",
  keywords: [
    "hotels in Vrindavan",
    "hotel near Banke Bihari Mandir",
    "hotel near Prem Mandir Vrindavan",
    "hotel near ISKCON Vrindavan",
    "budget hotel Vrindavan",
    "Vrindavan hotel booking",
    "Vrindavan guest house",
    "family hotel Vrindavan",
    "Gwala Hotels",
    "where to stay in Vrindavan",
    "Vrindavan room booking pay at hotel",
    "Mathura Vrindavan hotels",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Gwala Hotels Vrindavan",
    locale: "en_IN",
    images: [
      {
        url: "/hotels/gwala-bhawan/hero.jpg",
        width: 1200,
        height: 900,
        alt: "Gwala Hotels — rooms in Vrindavan near Banke Bihari Mandir",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${karla.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
