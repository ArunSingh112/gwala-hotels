import Image from "next/image";
import Link from "next/link";
import type { Hotel } from "@/lib/types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const photoCount = hotel.gallery?.length ?? 1;
  return (
    <article className="card group flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/hotels/${hotel.slug}`}
        className="relative block aspect-[3/2] overflow-hidden bg-cream-200"
      >
        <Image
          src={hotel.heroImage}
          alt={`${hotel.name} exterior`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/50 via-transparent to-transparent" />
        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-maroon-950/70 px-3 py-1 text-xs font-semibold text-cream-50 backdrop-blur-sm">
            📷 {photoCount} photos
          </span>
        )}
        <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-cream-50 drop-shadow-md sm:hidden">
          {hotel.name}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold text-maroon-900">
          <Link href={`/hotels/${hotel.slug}`} className="hover:text-marigold-600">
            {hotel.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-medium text-marigold-700">
          {hotel.tagline}
        </p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-maroon-800">
          {hotel.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/hotels/${hotel.slug}`}
            className="text-sm font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4 hover:decoration-marigold-600"
          >
            See rooms &amp; rates
          </Link>
          <Link
            href={`/booking?hotel=${hotel.slug}`}
            className="rounded-lg bg-marigold-500 px-4 py-2 text-sm font-semibold text-maroon-950 shadow-sm transition hover:bg-marigold-400"
          >
            Book
          </Link>
        </div>
      </div>
    </article>
  );
}
