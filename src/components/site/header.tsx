import Link from "next/link";

const NAV = [
  { href: "/hotels", label: "Our Hotels" },
  { href: "/attractions", label: "Vrindavan" },
  { href: "/booking/lookup", label: "My Booking" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-maroon-900 font-display text-lg font-bold text-marigold-400"
          >
            G
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-maroon-900">
            Gwala Hotels
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-maroon-800 transition hover:text-marigold-600"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/booking" className="btn-primary !min-h-10 !px-5 !py-2 text-sm">
            Book a Room
          </Link>
        </nav>

        {/* Mobile: booking is the one action that matters. */}
        <Link
          href="/booking"
          className="btn-primary !min-h-10 !px-4 !py-2 text-sm sm:hidden"
        >
          Book a Room
        </Link>
      </div>

      {/* Mobile nav row */}
      <nav
        aria-label="Main mobile"
        className="flex items-center justify-center gap-5 border-t border-cream-200 py-2 sm:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-semibold text-maroon-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
