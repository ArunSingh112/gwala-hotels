import type { Metadata } from "next";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact Gwala Hotels — Phone, WhatsApp & Addresses",
  description:
    "Reach any Gwala Hotels branch in Vrindavan by phone or WhatsApp. Addresses and contact details for all five branches.",
};

export default async function ContactPage() {
  const hotels = await getHotels();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold text-maroon-950">
          Contact us
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-maroon-800">
          Call or WhatsApp any branch — we answer quickly, and we are happy to
          help with darshan timings, directions or a booking over the phone.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {hotels.map((h) => (
            <div key={h.slug} className="card p-5">
              <h2 className="font-display text-lg font-semibold text-maroon-900">
                {h.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-maroon-800">
                {h.address}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`tel:+${h.phone}`}
                  className="btn-secondary !min-h-10 !px-4 !py-2 text-sm"
                >
                  {h.displayPhone}
                </a>
                <a
                  href={`https://wa.me/${h.phone}?text=${encodeURIComponent(
                    `Namaste! I have a question about ${h.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp !min-h-10 !px-4 !py-2 text-sm"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
