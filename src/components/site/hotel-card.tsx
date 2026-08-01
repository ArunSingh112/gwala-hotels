import Image from "next/image";
import Link from "next/link";
import type { Hotel } from "@/lib/types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="card group flex flex-col transition hover:shadow-lg">
      <Link
        href={`/hotels/${hotel.slug}`}
        className="relative block aspect-[3/2] overflow-hidden bg-cream-200"
      >
        <Image
          src={hotel.heroImage}
          alt={`${hotel.name} exterior`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
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
            className="rounded-lg bg-cream-100 px-4 py-2 text-sm font-semibold text-maroon-900 transition hover:bg-marigold-100"
          >
            Book
          </Link>
        </div>
      </div>
    </article>
  );
}
