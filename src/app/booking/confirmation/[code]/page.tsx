import type { Metadata } from "next";
import { getHotels } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ConfirmationView } from "@/components/booking/confirmation-view";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false },
};

export default async function ConfirmationPage() {
  const hotels = await getHotels();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <ConfirmationView />
      </main>
      <SiteFooter hotels={hotels} />
    </>
  );
}
