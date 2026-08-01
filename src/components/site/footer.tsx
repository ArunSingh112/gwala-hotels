import Link from "next/link";
import type { Hotel } from "@/lib/types";

export function SiteFooter({ hotels }: { hotels: Hotel[] }) {
  return (
    <footer className="mt-16 bg-maroon-950 text-cream-100">
      <div aria-hidden className="garland" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold text-marigold-400">
            Gwala Hotels
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-200">
            Five family-run branches across Vrindavan. Book online, pay when
            you arrive — no advance payment, free cancellation.
          </p>
        </div>

        <nav aria-label="Branches">
          <p className="text-sm font-bold uppercase tracking-wider text-marigold-400">
            Our branches
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {hotels.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/hotels/${h.slug}`}
                  className="transition hover:text-marigold-300"
                >
                  {h.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Site">
          <p className="text-sm font-bold uppercase tracking-wider text-marigold-400">
            Plan your visit
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/booking" className="transition hover:text-marigold-300">
                Book a room
              </Link>
            </li>
            <li>
              <Link
                href="/booking/lookup"
                className="transition hover:text-marigold-300"
              >
                Find my booking
              </Link>
            </li>
            <li>
              <Link
                href="/attractions"
                className="transition hover:text-marigold-300"
              >
                Temples &amp; attractions
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-marigold-300">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-marigold-300">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-maroon-900 py-4 text-center text-xs text-cream-300">
        © {new Date().getFullYear()} Gwala Hotels, Vrindavan. Radhe Radhe.
      </div>
    </footer>
  );
}
