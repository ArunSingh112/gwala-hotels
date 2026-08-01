import type { Metadata } from "next";
import { Suspense } from "react";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Book a Room — Pay at Hotel, Free Cancellation",
  description:
    "Book a room at any Gwala Hotels branch in Vrindavan. Live availability, no account needed, no advance payment — pay when you arrive.",
};

export default async function BookingPage() {
  const hotels = await getHotels();
  const branches = hotels.map((h) => ({
    slug: h.slug,
    name: h.name,
    address: h.address,
    phone: h.phone,
    displayPhone: h.displayPhone,
    checkInTime: h.checkInTime,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-maroon-950 sm:text-4xl">
          Book your stay
        </h1>
        <p className="mt-2 text-maroon-800">
          Live availability across all five branches. Nothing is charged now —
          you pay at the hotel.
        </p>
        <div className="mt-8">
          <Suspense fallback={null}>
            <BookingWizard branches={branches} />
          </Suspense>
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
