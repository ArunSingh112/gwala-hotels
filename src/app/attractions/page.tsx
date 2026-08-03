import type { Metadata } from "next";
import Link from "next/link";
import { ATTRACTIONS } from "@/lib/attractions";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Temples & Attractions in Vrindavan — Banke Bihari, Prem Mandir, ISKCON",
  description:
    "Plan your darshan days in Vrindavan: Banke Bihari Mandir, Prem Mandir, ISKCON, Nidhivan, Radha Raman and more — with notes from the Gwala Hotels family on when to visit each.",
  alternates: { canonical: "/attractions" },
  keywords: [
    "Vrindavan temples",
    "Banke Bihari Mandir timings",
    "Prem Mandir Vrindavan",
    "ISKCON Vrindavan",
    "places to visit in Vrindavan",
    "Nidhivan Vrindavan",
  ],
};

export default async function AttractionsPage() {
  const hotels = await getHotels();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Temples & attractions of Vrindavan",
    itemListElement: ATTRACTIONS.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "TouristAttraction",
        name: a.name,
        description: a.summary,
        url: `${base}/attractions#${a.slug}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Vrindavan",
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
      },
    })),
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-marigold-700">
          Plan your visit
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-maroon-950">
          Temples &amp; attractions of Vrindavan
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-maroon-800">
          Vrindavan is called the town of five thousand temples. These are the
          ones our guests come for — and the ones worth planning your days
          around. Ask at any Gwala front desk for timings; aartis shift with
          the season.
        </p>

        <div className="mt-10 space-y-8">
          {ATTRACTIONS.map((a) => (
            <article
              key={a.slug}
              id={a.slug}
              className="card scroll-mt-24 p-6"
            >
              <h2 className="font-display text-2xl font-semibold text-maroon-900">
                {a.name}
              </h2>
              <p className="mt-1 font-medium text-marigold-700">{a.summary}</p>
              <p className="mt-3 leading-relaxed text-maroon-800">{a.detail}</p>
            </article>
          ))}
        </div>

        <div className="jali mt-12 rounded-2xl bg-marigold-100 px-6 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-maroon-950">
            Stay close to all of it
          </h2>
          <p className="mx-auto mt-2 max-w-md text-maroon-800">
            Five Gwala branches across town — including one on Banke Bihari
            Mandir Street itself.
          </p>
          <Link href="/booking" className="btn-primary mt-6">
            Book a Room
          </Link>
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
