import type { Metadata } from "next";
import Link from "next/link";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Gwala Hotels — A Vrindavan Family, Five Doorsteps",
  description:
    "The Gwala Hotels story: one Vrindavan family, five branches, and a simple promise — a clean room, a fair rate, and payment only when you arrive.",
};

export default async function AboutPage() {
  const hotels = await getHotels();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold text-maroon-950">
          One family, five doorsteps
        </h1>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-maroon-800">
          <p>
            Gwala Hotels began the way most good things in Vrindavan do — with
            pilgrims at the door. What started as rooms let out to visiting
            families has grown into five branches across the holy town: Hotel
            Gwala Inn, Gwala Dham, Gwala Palace, Gwala Residency and Gwala
            Bhawan.
          </p>
          <p>
            We are not a chain. The same family looks after every branch, and
            the promise at each is the same: a clean room, a fair rate, hot
            water, and someone at the desk who knows what time the curtain
            opens at Banke Bihari.
          </p>
          <p>
            We keep booking simple because our guests are here for darshan,
            not paperwork. Reserve online in two minutes, pay when you arrive,
            cancel freely if plans change. Nothing is charged in advance.
          </p>
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold text-maroon-900">
          Our branches
        </h2>
        <ul className="mt-4 space-y-3">
          {hotels.map((h) => (
            <li key={h.slug} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-display font-semibold text-maroon-900">
                  {h.name}
                </p>
                <p className="text-sm text-maroon-700">{h.tagline}</p>
              </div>
              <Link
                href={`/hotels/${h.slug}`}
                className="text-sm font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4"
              >
                Visit
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
