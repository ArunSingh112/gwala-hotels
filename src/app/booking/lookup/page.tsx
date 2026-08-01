import type { Metadata } from "next";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { LookupForm } from "@/components/booking/lookup-form";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find My Booking",
  description:
    "Look up a Gwala Hotels booking with your booking code and phone number. View details or cancel — free of charge.",
};

export default async function LookupPage() {
  const hotels = await getHotels();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-maroon-950 sm:text-4xl">
            Find your booking
          </h1>
          <p className="mx-auto mt-2 max-w-md text-maroon-800">
            Enter your booking code and the mobile number you booked with.
            Cancellation is free — nothing has been paid.
          </p>
        </div>
        <div className="mt-8">
          <LookupForm />
        </div>
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
