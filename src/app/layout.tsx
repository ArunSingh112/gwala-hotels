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
    default: "Gwala Hotels — Stay in Vrindavan, near Banke Bihari Mandir",
    template: "%s | Gwala Hotels Vrindavan",
  },
  description:
    "Five welcoming Gwala Hotels branches across Vrindavan, near Banke Bihari Mandir, Prem Mandir and ISKCON. Book a room online, pay at the hotel — no advance payment.",
  keywords: [
    "Vrindavan hotels",
    "hotel near Banke Bihari Mandir",
    "Gwala Hotels",
    "Vrindavan guest house",
    "budget hotel Vrindavan",
  ],
  openGraph: {
    type: "website",
    siteName: "Gwala Hotels Vrindavan",
  },
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
