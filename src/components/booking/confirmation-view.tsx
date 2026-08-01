"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatDateLong,
  readConfirmation,
  whatsappBookingMessage,
  type ConfirmationData,
} from "@/lib/booking-flow";

export function ConfirmationView() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setData(readConfirmation(code));
    setChecked(true);
  }, [code]);

  if (!checked) return null;

  // Direct visits (or a lost session) still get the code and a path forward.
  if (!data) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-display text-2xl font-semibold text-maroon-900">
          Booking {code}
        </p>
        <p className="mt-3 leading-relaxed text-maroon-800">
          Your booking request was received. To see its details or cancel it,
          look it up with the phone number you booked with.
        </p>
        <Link href="/booking/lookup" className="btn-primary mt-6">
          Find my booking
        </Link>
      </div>
    );
  }

  const waHref = `https://wa.me/${data.hotelPhone}?text=${encodeURIComponent(
    whatsappBookingMessage(data)
  )}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card overflow-visible">
        {/* Status banner */}
        <div className="jali rounded-t-xl bg-marigold-100 px-6 py-8 text-center">
          <p aria-hidden className="text-4xl">🙏</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-maroon-950">
            Radhe Radhe, {data.guestName.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-maroon-800">
            Your booking request is in. The hotel will confirm it shortly.
          </p>
          <p className="mt-4 inline-block rounded-lg border-2 border-dashed border-maroon-800 bg-cream-50 px-6 py-3 font-mono text-2xl font-bold tracking-widest text-maroon-950">
            {data.bookingCode}
          </p>
          <p className="mt-2 text-sm text-maroon-700">
            Save this code — you&apos;ll use it (with your phone number) to
            find or cancel the booking.
          </p>
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          <dl className="grid gap-3 text-sm text-maroon-800 sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide text-marigold-700">
                Hotel
              </dt>
              <dd className="mt-0.5 font-semibold text-maroon-950">
                {data.hotelName}
              </dd>
              <dd className="mt-0.5">{data.hotelAddress}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-marigold-700">
                Room
              </dt>
              <dd className="mt-0.5 font-semibold text-maroon-950">
                {data.rooms} × {data.roomTypeName}
              </dd>
              <dd className="mt-0.5">
                {data.adults} adult{data.adults === 1 ? "" : "s"}
                {data.children > 0 &&
                  `, ${data.children} child${data.children === 1 ? "" : "ren"}`}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-marigold-700">
                Check-in
              </dt>
              <dd className="mt-0.5 font-semibold text-maroon-950">
                {formatDateLong(data.checkIn)}
              </dd>
              <dd className="mt-0.5">From {data.checkInTime}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-marigold-700">
                Check-out
              </dt>
              <dd className="mt-0.5 font-semibold text-maroon-950">
                {formatDateLong(data.checkOut)}
              </dd>
              <dd className="mt-0.5">
                {data.nights} night{data.nights === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>

          <div className="flex items-center justify-between rounded-lg bg-cream-100 px-4 py-3">
            <p className="font-bold text-maroon-950">Pay at the hotel</p>
            <p className="font-display text-2xl font-bold text-maroon-950">
              ₹{data.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full"
          >
            Send on WhatsApp to the hotel
          </a>
          <p className="text-center text-xs text-maroon-700">
            Sends your booking details to {data.hotelName} (
            {data.hotelDisplayPhone}) so they can confirm faster.
          </p>

          {/* What to bring */}
          <div className="rounded-lg border border-cream-200 p-4">
            <h2 className="font-display text-lg font-semibold text-maroon-900">
              What to bring
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-maroon-800">
              <li>A government photo ID for each adult (Aadhaar, passport…)</li>
              <li>Your booking code — a screenshot of this page works</li>
              <li>Payment in cash or UPI at the front desk</li>
            </ul>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/booking/lookup"
              className="font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4"
            >
              Manage this booking
            </Link>
            <Link
              href="/attractions"
              className="font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4"
            >
              Plan your darshan days
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
