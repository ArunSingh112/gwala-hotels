import type { Metadata } from "next";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { HotelCard } from "@/components/site/hotel-card";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Hotels — Five Branches Across Vrindavan",
  description:
    "Hotel Gwala Inn, Gwala Dham, Gwala Palace, Gwala Residency and Gwala Bhawan — five Gwala Hotels branches across Vrindavan near Banke Bihari Mandir. Compare rooms and book online, pay at the hotel.",
  alternates: { canonical: "/hotels" },
  keywords: [
    "hotels in Vrindavan",
    "Vrindavan hotel list",
    "hotel near Banke Bihari Mandir",
    "budget hotel Vrindavan",
  ],
};

export default async function HotelsPage() {
  const hotels = await getHotels();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold text-maroon-950">
          Our hotels in Vrindavan
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-maroon-800">
          Five branches, one family. Whichever you choose, you get the same
          welcome, the same clean rooms, and the same promise: pay only when
          you arrive.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.slug} hotel={hotel} />
          ))}
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
