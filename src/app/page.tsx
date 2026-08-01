import Link from "next/link";
import { getApprovedReviews, getHotels } from "@/lib/data/public";
import { ATTRACTIONS } from "@/lib/attractions";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { HotelCard } from "@/components/site/hotel-card";
import { SearchWidget } from "@/components/site/search-widget";

export const revalidate = 300;

export default async function HomePage() {
  const [hotels, reviews] = await Promise.all([
    getHotels(),
    getApprovedReviews(undefined, 6),
  ]);
  const branches = hotels.map((h) => ({ slug: h.slug, name: h.name }));

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="jali relative overflow-hidden bg-cream-100">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pb-16 sm:pt-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-marigold-700">
              Radhe Radhe · Welcome to Braj
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-maroon-950 sm:text-5xl">
              Rest well in Vrindavan,
              <br />
              <span className="text-marigold-600">steps from the temples.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-maroon-800">
              Five family-run Gwala Hotels branches across the holy town. Book
              in under two minutes — no account, no advance payment. Pay when
              you arrive.
            </p>

            <div className="mt-8">
              <SearchWidget branches={branches} />
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-maroon-800">
              <li>✓ Pay at hotel</li>
              <li>✓ Free cancellation</li>
              <li>✓ WhatsApp confirmation</li>
              <li>✓ 5 branches, one family</li>
            </ul>
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
