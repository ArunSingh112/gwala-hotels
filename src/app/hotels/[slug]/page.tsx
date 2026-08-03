import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getApprovedReviews,
  getHotelBySlug,
  getHotels,
  getRatingSummary,
  getRoomTypes,
} from "@/lib/data/public";
import { getAttraction } from "@/lib/attractions";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ReviewForm } from "@/components/site/review-form";
import { Gallery } from "@/components/site/gallery";
import { RoomPhotos } from "@/components/site/room-photos";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const hotels = await getHotels();
  return hotels.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return {};
  // Gwala Bhawan leads with the temple street — that's what pilgrims search.
  const title =
    hotel.slug === "gwala-bhawan"
      ? `${hotel.name} — Hotel on Banke Bihari Mandir Street, Vrindavan`
      : `${hotel.name} — ${hotel.tagline}`;
  const description = `${hotel.name}, a family-run hotel in Vrindavan near Banke Bihari Mandir. ${hotel.description.slice(0, 120)}… Book online, pay at the hotel, free cancellation.`;
  return {
    title,
    description,
    alternates: { canonical: `/hotels/${hotel.slug}` },
    keywords: [
      hotel.name,
      "hotel in Vrindavan",
      "hotel near Banke Bihari Mandir",
      "budget hotel Vrindavan",
      "Vrindavan hotel booking pay at hotel",
    ],
    openGraph: {
      title,
      description,
      images: [hotel.heroImage],
      type: "website",
    },
  };
}

const SISTER_NOTE: Record<string, string> = {
  "gwala-palace":
    "Gwala Palace and Gwala Residency stand at the same location — two buildings, one address. The map below is shared by both, and either booking brings you to the same doorstep.",
  "gwala-residency":
    "Gwala Residency and Gwala Palace stand at the same location — two buildings, one address. The map below is shared by both, and either booking brings you to the same doorstep.",
};

export default async function HotelPage({ params }: Props) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const [roomTypes, reviews, rating, hotels] = await Promise.all([
    getRoomTypes(hotel.slug),
    getApprovedReviews(hotel.slug, 6),
    getRatingSummary(hotel.slug),
    getHotels(),
  ]);

  const minPrice = roomTypes.length
    ? Math.min(...roomTypes.map((rt) => rt.pricePerNight))
    : null;

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Hotel",
      name: hotel.name,
      url: `${base}/hotels/${hotel.slug}`,
      image: (hotel.gallery?.length ? hotel.gallery : [hotel.heroImage]).map(
        (src) => (src.startsWith("http") ? src : `${base}${src}`)
      ),
      description: hotel.description,
      address: {
        "@type": "PostalAddress",
        streetAddress: hotel.address,
        addressLocality: "Vrindavan",
        addressRegion: "Uttar Pradesh",
        postalCode: "281121",
        addressCountry: "IN",
      },
      hasMap: hotel.mapsUrl,
      telephone: hotel.displayPhone,
      checkinTime: hotel.checkInTime,
      checkoutTime: hotel.checkOutTime,
      amenityFeature: hotel.amenities.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a,
        value: true,
      })),
      ...(minPrice ? { priceRange: `₹${minPrice}+ per night` } : {}),
      ...(rating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating.average,
              reviewCount: rating.count,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        {
          "@type": "ListItem",
          position: 2,
          name: "Our Hotels",
          item: `${base}/hotels`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: hotel.name,
          item: `${base}/hotels/${hotel.slug}`,
        },
      ],
    },
  ];

  const distances = Object.entries(hotel.distances ?? {});

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        {/* Hero: full-bleed cover photo with title overlay */}
        <section className="relative">
          <div className="relative aspect-[5/2] min-h-56 w-full overflow-hidden bg-cream-200">
            <Image
              src={hotel.heroImage}
              alt={`${hotel.name} exterior`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-maroon-950/20 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-6xl px-4 pb-6">
              <h1 className="font-display text-3xl font-semibold text-cream-50 drop-shadow sm:text-4xl">
                {hotel.name}
              </h1>
              <p className="mt-1 font-medium text-marigold-300">
                {hotel.tagline}
              </p>
              {rating && (
                <p className="mt-1 text-sm text-cream-100">
                  ★ {rating.average} · {rating.count} review
                  {rating.count === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {/* Photos */}
              {(hotel.gallery?.length ?? 0) > 1 && (
                <section aria-labelledby="photos-heading">
                  <h2
                    id="photos-heading"
                    className="font-display text-2xl font-semibold text-maroon-900"
                  >
                    Photos
                  </h2>
                  <div className="mt-4">
                    <Gallery images={hotel.gallery} hotelName={hotel.name} />
                  </div>
                </section>
              )}

              {/* About */}
              <section aria-labelledby="about-heading">
                <h2
                  id="about-heading"
                  className="font-display text-2xl font-semibold text-maroon-900"
                >
                  About this branch
                </h2>
                <p className="mt-3 leading-relaxed text-maroon-800">
                  {hotel.description}
                </p>
                {SISTER_NOTE[hotel.slug] && (
                  <p className="mt-4 rounded-lg bg-marigold-50 p-4 text-sm leading-relaxed text-maroon-800">
                    {SISTER_NOTE[hotel.slug]}
                  </p>
                )}
              </section>

              {/* Amenities */}
              <section aria-labelledby="amenities-heading">
                <h2
                  id="amenities-heading"
                  className="font-display text-2xl font-semibold text-maroon-900"
                >
                  Amenities
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {hotel.amenities.map((a) => (
                    <li
                      key={a}
                      className="rounded-full bg-cream-100 px-4 py-1.5 text-sm font-semibold text-maroon-800"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Rooms */}
              <section aria-labelledby="rooms-heading">
                <h2
                  id="rooms-heading"
                  className="font-display text-2xl font-semibold text-maroon-900"
                >
                  Rooms &amp; rates
                </h2>
                <div className="mt-4 space-y-4">
                  {roomTypes.map((rt) => (
                    <article
                      key={rt.id}
                      className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex gap-4">
                        <RoomPhotos images={rt.images ?? []} roomName={rt.name} />
                        <div>
                          <h3 className="font-display text-lg font-semibold text-maroon-900">
                            {rt.name}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-maroon-800">
                            {rt.description}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-maroon-700">
                            Sleeps {rt.maxAdults} adult{rt.maxAdults === 1 ? "" : "s"}
                            {rt.maxChildren > 0 &&
                              ` + ${rt.maxChildren} child${rt.maxChildren === 1 ? "" : "ren"}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <p>
                          <span className="font-display text-2xl font-bold text-maroon-950">
                            ₹{rt.pricePerNight.toLocaleString("en-IN")}
                          </span>
                          <span className="text-sm text-maroon-700"> / night</span>
                        </p>
                        <Link
                          href={`/booking?hotel=${hotel.slug}`}
                          className="btn-primary !min-h-10 !px-5 !py-2 text-sm"
                        >
                          Book this room
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Reviews */}
              <section aria-labelledby="reviews-heading">
                <h2
                  id="reviews-heading"
                  className="font-display text-2xl font-semibold text-maroon-900"
                >
                  Guest reviews
                </h2>
                {reviews.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {reviews.map((r) => (
                      <blockquote key={r.id} className="card p-5">
                        <p
                          aria-label={`Rated ${r.rating} out of 5`}
                          className="text-marigold-500"
                        >
                          {"★".repeat(r.rating)}
                          <span className="text-cream-300">
                            {"★".repeat(5 - r.rating)}
                          </span>
                        </p>
                        <p className="mt-2 font-semibold text-maroon-900">
                          {r.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-maroon-800">
                          {r.text}
                        </p>
                        <footer className="mt-3 text-sm font-semibold text-marigold-700">
                          — {r.guestName}
                          {r.bookingCode && (
                            <span className="ml-2 rounded bg-cream-100 px-2 py-0.5 text-xs">
                              Verified stay
                            </span>
                          )}
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-maroon-700">
                    No reviews yet — stayed with us? Be the first to write one.
                  </p>
                )}
                <div className="mt-4">
                  <ReviewForm hotelId={hotel.slug} />
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="card p-5">
                <h2 className="font-display text-lg font-semibold text-maroon-900">
                  Location
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-maroon-800">
                  {hotel.address}
                </p>
                <div className="mt-4 overflow-hidden rounded-lg border border-cream-200">
                  <iframe
                    title={`Map showing ${hotel.name}`}
                    src={`https://www.google.com/maps?ftid=${hotel.mapFtid}&output=embed`}
                    className="h-56 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href={hotel.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mt-4 w-full text-sm"
                >
                  Get directions
                </a>
              </div>

              {distances.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-display text-lg font-semibold text-maroon-900">
                    Getting to the temples
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-maroon-800">
                    {distances.map(([slug, text]) => {
                      const attraction = getAttraction(slug);
                      return (
                        <li key={slug} className="flex justify-between gap-3">
                          <span>{attraction?.name ?? slug}</span>
                          <span className="font-semibold">{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="card p-5">
                <h2 className="font-display text-lg font-semibold text-maroon-900">
                  Good to know
                </h2>
                <dl className="mt-3 space-y-2 text-sm text-maroon-800">
                  <div className="flex justify-between">
                    <dt>Check-in</dt>
                    <dd className="font-semibold">{hotel.checkInTime}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Check-out</dt>
                    <dd className="font-semibold">{hotel.checkOutTime}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Payment</dt>
                    <dd className="font-semibold">At the hotel</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Phone</dt>
                    <dd className="font-semibold">{hotel.displayPhone}</dd>
                  </div>
                </dl>
                <a
                  href={`https://wa.me/${hotel.phone}?text=${encodeURIComponent(
                    `Namaste! I have a question about ${hotel.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp mt-4 w-full text-sm"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <Link href={`/booking?hotel=${hotel.slug}`} className="btn-primary w-full">
                Book {hotel.name}
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
