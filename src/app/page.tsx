import Image from "next/image";
import Link from "next/link";
import { getApprovedReviews, getHotels } from "@/lib/data/public";
import { ATTRACTIONS } from "@/lib/attractions";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { HotelCard } from "@/components/site/hotel-card";
import { SearchWidget } from "@/components/site/search-widget";

export const revalidate = 300;

// Questions pilgrims actually search for. Rendered on the page and as
// FAQPage structured data so Google can show them as rich results.
const FAQS: { q: string; a: string }[] = [
  {
    q: "Which is the best hotel near Banke Bihari Mandir in Vrindavan?",
    a: "Gwala Bhawan stands right on the Banke Bihari Mandir street, and every other Gwala Hotels branch is a short ride from the temple. All five branches are run by the same Vrindavan family, with clean rooms and fair rates.",
  },
  {
    q: "Can I book a hotel in Vrindavan without advance payment?",
    a: "Yes. At Gwala Hotels you book online in two minutes and pay only when you arrive at the hotel — no advance, no card details, and free cancellation.",
  },
  {
    q: "What is the price of a hotel room in Vrindavan?",
    a: "Gwala Hotels rooms start around ₹1,200 per night for a 2-bed room, with 3-bed and 4-bed family rooms available at all five branches. Rates include attached bathroom and hot water.",
  },
  {
    q: "Are there family rooms in Vrindavan for groups?",
    a: "Yes. Every Gwala Hotels branch has 2, 3 and 4 bed rooms, so families and groups travelling for darshan can stay together. Larger groups can book multiple rooms in one booking.",
  },
  {
    q: "How far are Gwala Hotels from Prem Mandir and ISKCON Vrindavan?",
    a: "Each branch page lists walking and rickshaw distances to Banke Bihari Mandir, Prem Mandir, ISKCON and Nidhivan, so you can pick the branch closest to the darshans you came for.",
  },
];

export default async function HomePage() {
  const [hotels, reviews] = await Promise.all([
    getHotels(),
    getApprovedReviews(undefined, 6),
  ]);
  const branches = hotels.map((h) => ({ slug: h.slug, name: h.name }));
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Three photos for the hero collage, spread across branches.
  const heroPhotos = [
    { src: "/hotels/gwala-bhawan/hero.jpg", alt: "Room at Gwala Bhawan" },
    { src: "/hotels/gwala-inn/hero.jpg", alt: "Room at Hotel Gwala Inn" },
    { src: "/hotels/gwala-residency/hero.jpg", alt: "Room at Gwala Residency" },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "Gwala Hotels",
      url: base,
      description:
        "A family-run group of five hotels in Vrindavan, Uttar Pradesh, near Banke Bihari Mandir, Prem Mandir and ISKCON.",
      areaServed: "Vrindavan, Mathura, Uttar Pradesh, India",
      subOrganization: hotels.map((h) => ({
        "@type": "Hotel",
        name: h.name,
        url: `${base}/hotels/${h.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "Gwala Hotels Vrindavan",
      url: base,
      publisher: { "@id": `${base}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        {/* Hero */}
        <section className="jali relative overflow-hidden bg-cream-100">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-14 sm:pb-16 sm:pt-20 lg:grid-cols-[1fr_minmax(0,420px)]">
            <div>
              <p className="reveal reveal-1 text-sm font-bold uppercase tracking-[0.2em] text-marigold-700">
                Radhe Radhe · Welcome to Braj
              </p>
              <h1 className="reveal reveal-2 mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-maroon-950 sm:text-5xl">
                Hotels in Vrindavan,
                <br />
                <span className="text-marigold-600">
                  steps from Banke Bihari.
                </span>
              </h1>
              <p className="reveal reveal-3 mt-4 max-w-xl text-lg leading-relaxed text-maroon-800">
                Five family-run Gwala Hotels branches across the holy town. Book
                in under two minutes — no account, no advance payment. Pay when
                you arrive.
              </p>

              <div className="reveal reveal-4 mt-8">
                <SearchWidget branches={branches} />
              </div>

              <ul className="reveal reveal-5 mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-maroon-800">
                <li>✓ Pay at hotel</li>
                <li>✓ Free cancellation</li>
                <li>✓ WhatsApp confirmation</li>
                <li>✓ 5 branches, one family</li>
              </ul>
            </div>

            {/* Photo stack: three real rooms, hand-tilted like postcards. */}
            <div
              aria-hidden
              className="relative mx-auto hidden h-[420px] w-full max-w-[400px] lg:block"
            >
              <div
                className="drift absolute left-0 top-6 h-56 w-64 overflow-hidden rounded-2xl border-4 border-white shadow-xl"
                style={{ "--tilt": "-4deg", animationDelay: "0.2s" } as React.CSSProperties}
              >
                <Image
                  src={heroPhotos[1].src}
                  alt={heroPhotos[1].alt}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
              <div
                className="drift absolute right-0 top-0 h-64 w-56 overflow-hidden rounded-2xl border-4 border-white shadow-2xl"
                style={{ "--tilt": "3deg" } as React.CSSProperties}
              >
                <Image
                  src={heroPhotos[0].src}
                  alt={heroPhotos[0].alt}
                  fill
                  sizes="224px"
                  priority
                  className="object-cover"
                />
              </div>
              <div
                className="drift absolute bottom-0 left-1/2 h-52 w-60 -translate-x-1/2 overflow-hidden rounded-2xl border-4 border-white shadow-xl"
                style={{ "--tilt": "-1.5deg", animationDelay: "0.5s" } as React.CSSProperties}
              >
                <Image
                  src={heroPhotos[2].src}
                  alt={heroPhotos[2].alt}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <span className="absolute -right-2 bottom-14 rounded-full bg-maroon-900 px-4 py-2 font-display text-sm font-semibold text-marigold-300 shadow-lg">
                Real rooms, real photos
              </span>
            </div>
          </div>
          <div aria-hidden className="garland" />
        </section>

        {/* Branches */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-maroon-900">
                Our five branches
              </h2>
              <p className="mt-2 text-maroon-800">
                One family, five doorsteps across Vrindavan.
              </p>
            </div>
            <Link
              href="/hotels"
              className="hidden text-sm font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4 sm:block"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.slug} hotel={hotel} />
            ))}
          </div>
        </section>

        {/* Attractions teaser */}
        <section className="bg-maroon-950 py-14 text-cream-100">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-3xl font-semibold text-marigold-400">
              The town of five thousand temples
            </h2>
            <p className="mt-2 max-w-xl text-cream-200">
              Banke Bihari, Prem Mandir, ISKCON, Nidhivan — every Gwala branch
              puts you within easy reach of the darshans you came for.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ATTRACTIONS.slice(0, 4).map((a) => (
                <Link
                  key={a.slug}
                  href={`/attractions#${a.slug}`}
                  className="group rounded-xl border border-maroon-800 bg-maroon-900/60 p-5 transition hover:border-marigold-500"
                >
                  <h3 className="font-display text-lg font-semibold text-cream-50 group-hover:text-marigold-300">
                    {a.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-300">
                    {a.summary}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/attractions"
              className="mt-8 inline-block text-sm font-bold text-marigold-400 underline decoration-2 underline-offset-4 hover:text-marigold-300"
            >
              Plan your darshan days →
            </Link>
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="font-display text-3xl font-semibold text-maroon-900">
              Guests who stayed with us
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <blockquote key={r.id} className="card p-5">
                  <p aria-label={`Rated ${r.rating} out of 5`} className="text-marigold-500">
                    {"★".repeat(r.rating)}
                    <span className="text-cream-300">
                      {"★".repeat(5 - r.rating)}
                    </span>
                  </p>
                  <p className="mt-2 font-semibold text-maroon-900">{r.title}</p>
                  <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-maroon-800">
                    {r.text}
                  </p>
                  <footer className="mt-3 text-sm font-semibold text-marigold-700">
                    — {r.guestName}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* FAQ — mirrors the FAQPage structured data above */}
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-display text-3xl font-semibold text-maroon-900">
            Planning a stay in Vrindavan?
          </h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="card group p-5 open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-maroon-900 marker:content-none">
                  <span className="mr-2 inline-block text-marigold-600 transition group-open:rotate-90">
                    ›
                  </span>
                  {f.q}
                </summary>
                <p className="mt-3 pl-5 text-sm leading-relaxed text-maroon-800">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="jali rounded-2xl bg-marigold-100 px-6 py-10 text-center sm:py-14">
            <h2 className="font-display text-3xl font-semibold text-maroon-950">
              Your room in Vrindavan is two minutes away
            </h2>
            <p className="mx-auto mt-2 max-w-md text-maroon-800">
              Pick your dates, choose a room, pay at the hotel. That&apos;s the
              whole process.
            </p>
            <Link href="/booking" className="btn-primary mt-6">
              Book a Room
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
