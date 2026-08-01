"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SearchWidget } from "@/components/site/search-widget";
import {
  storeConfirmation,
  whatsappBookingMessage,
  type AvailabilityResult,
  type ConfirmationData,
} from "@/lib/booking-flow";

interface BranchInfo {
  slug: string;
  name: string;
  address: string;
  phone: string;
  displayPhone: string;
  checkInTime: string;
}

type Step = "results" | "details";

interface Selection {
  result: AvailabilityResult;
  rooms: number;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms =
    new Date(`${checkOut}T00:00:00Z`).getTime() -
    new Date(`${checkIn}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function BookingWizard({ branches }: { branches: BranchInfo[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const hotel = params.get("hotel") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const adults = Number(params.get("adults") ?? 0);
  const children = Number(params.get("children") ?? 0);
  const hasSearch = Boolean(checkIn && checkOut && adults > 0);

  const nights = hasSearch ? nightsBetween(checkIn, checkOut) : 0;

  const [step, setStep] = useState<Step>("results");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Guest details
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!hasSearch) return;
    setLoading(true);
    setSearchError(null);
    setResults(null);
    setSelection(null);
    setStep("results");
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: hotel || null,
          checkIn,
          checkOut,
          adults,
          children,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSearchError(body.error?.message ?? "Search failed. Please try again.");
        return;
      }
      setResults(body.results as AvailabilityResult[]);
    } catch {
      setSearchError(
        "We couldn't reach the booking system. Please check your connection and try again, or call us."
      );
    } finally {
      setLoading(false);
    }
  }, [hasSearch, hotel, checkIn, checkOut, adults, children]);

  useEffect(() => {
    void search();
  }, [search]);

  const offerable = useMemo(
    () => (results ?? []).filter((r) => r.freeRooms > 0 && r.fitsParty),
    [results]
  );
  const others = useMemo(
    () => (results ?? []).filter((r) => r.freeRooms === 0 || !r.fitsParty),
    [results]
  );

  async function submitBooking(e: FormEvent) {
    e.preventDefault();
    if (!selection) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: selection.result.hotelId,
          roomTypeId: selection.result.roomTypeId,
          checkIn,
          checkOut,
          rooms: selection.rooms,
          adults,
          children,
          guestName,
          guestPhone,
          guestEmail: guestEmail || undefined,
          guestCity: guestCity || undefined,
          specialRequests: specialRequests || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.error?.code === "rooms_unavailable") {
          // Return to results with dates preserved; re-run the search.
          setSubmitError(null);
          setSearchError(body.error.message);
          await search();
          return;
        }
        setSubmitError(
          body.error?.message ?? "Something went wrong. Please try again."
        );
        return;
      }

      const branch = branches.find((b) => b.slug === selection.result.hotelId);
      const confirmation: ConfirmationData = {
        bookingCode: body.bookingCode,
        hotelId: selection.result.hotelId,
        hotelName: selection.result.hotelName,
        hotelAddress: branch?.address ?? "",
        hotelPhone: branch?.phone ?? "",
        hotelDisplayPhone: branch?.displayPhone ?? "",
        checkInTime: branch?.checkInTime ?? "12:00",
        roomTypeName: selection.result.name,
        checkIn,
        checkOut,
        nights,
        rooms: selection.rooms,
        adults,
        children,
        totalAmount: selection.result.pricePerNight * selection.rooms * nights,
        guestName,
      };
      storeConfirmation(confirmation);
      router.push(`/booking/confirmation/${body.bookingCode}`);
    } catch {
      setSubmitError(
        "We couldn't reach the booking system. Your booking was NOT made. Please try again, or call us and we'll reserve it by phone."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <SearchWidget
        branches={branches.map((b) => ({ slug: b.slug, name: b.name }))}
      />

      {!hasSearch && (
        <p className="text-center text-maroon-800">
          Pick your dates above to see which rooms are free.
        </p>
      )}

      {loading && (
        <p role="status" className="text-center text-maroon-800">
          Checking availability across our branches…
        </p>
      )}

      {searchError && (
        <div role="alert" className="card border-marigold-400 bg-marigold-50 p-4">
          <p className="font-semibold text-maroon-900">{searchError}</p>
          <p className="mt-1 text-sm text-maroon-800">
            You can also book by phone:{" "}
            <a href={`tel:+${branches[0]?.phone}`} className="font-bold underline">
              {branches[0]?.displayPhone}
            </a>
          </p>
        </div>
      )}

      {/* Step: results */}
      {step === "results" && results && (
        <section aria-label="Available rooms">
          {offerable.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="font-display text-xl font-semibold text-maroon-900">
                No rooms free for those dates
              </p>
              <p className="mt-2 text-maroon-800">
                Try different dates or another branch — or call us at{" "}
                <a href={`tel:+${branches[0]?.phone}`} className="font-bold underline">
                  {branches[0]?.displayPhone}
                </a>{" "}
                and we&apos;ll do our best.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-maroon-800">
                {nights} night{nights === 1 ? "" : "s"} ·{" "}
                {adults} adult{adults === 1 ? "" : "s"}
                {children > 0 && `, ${children} child${children === 1 ? "" : "ren"}`}
              </p>
              {offerable.map((r) => (
                <RoomResultCard
                  key={`${r.hotelId}-${r.roomTypeId}`}
                  result={r}
                  nights={nights}
                  onChoose={(rooms) => {
                    setSelection({ result: r, rooms });
                    setStep("details");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              ))}
              {others.length > 0 && (
                <details className="card p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-maroon-700">
                    {others.length} other room type{others.length === 1 ? "" : "s"} not
                    available for this stay
                  </summary>
                  <ul className="mt-3 space-y-2 text-sm text-maroon-700">
                    {others.map((r) => (
                      <li key={`${r.hotelId}-${r.roomTypeId}`}>
                        <span className="font-semibold">{r.name}</span> at{" "}
                        {r.hotelName} —{" "}
                        {r.freeRooms === 0
                          ? "fully booked on your dates"
                          : "too small for your party"}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step: details */}
      {step === "details" && selection && (
        <section aria-label="Your details" className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={submitBooking}
            className="card space-y-4 p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-maroon-900">
                Your details
              </h2>
              <button
                type="button"
                onClick={() => setStep("results")}
                className="text-sm font-semibold text-maroon-700 underline underline-offset-4"
              >
                ← Change room
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-name" className="field-label">
                  Full name <span aria-hidden className="text-maroon-600">*</span>
                </label>
                <input
                  id="bk-name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="bk-phone" className="field-label">
                  Mobile number <span aria-hidden className="text-maroon-600">*</span>
                </label>
                <input
                  id="bk-phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="field-input"
                  aria-describedby="bk-phone-help"
                />
                <p id="bk-phone-help" className="mt-1 text-xs text-maroon-700">
                  Indian mobile. You&apos;ll use it to find or cancel this booking.
                </p>
              </div>
              <div>
                <label htmlFor="bk-email" className="field-label">
                  Email <span className="font-normal text-maroon-600">(optional)</span>
                </label>
                <input
                  id="bk-email"
                  type="email"
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="bk-city" className="field-label">
                  City <span className="font-normal text-maroon-600">(optional)</span>
                </label>
                <input
                  id="bk-city"
                  maxLength={100}
                  autoComplete="address-level2"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bk-requests" className="field-label">
                Special requests{" "}
                <span className="font-normal text-maroon-600">(optional)</span>
              </label>
              <textarea
                id="bk-requests"
                rows={3}
                maxLength={1000}
                placeholder="Early check-in, ground floor, extra mattress…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="field-input"
              />
            </div>

            {submitError && (
              <p role="alert" className="rounded-lg bg-marigold-50 p-3 text-sm font-semibold text-maroon-900">
                {submitError}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Reserving your room…" : "Confirm booking request"}
            </button>
            <p className="text-center text-xs text-maroon-700">
              No payment now — you pay at the hotel. Free cancellation.
            </p>
          </form>

          {/* Summary */}
          <aside className="card h-fit p-5">
            <h3 className="font-display text-lg font-semibold text-maroon-900">
              Your stay
            </h3>
            <dl className="mt-3 space-y-2 text-sm text-maroon-800">
              <div className="flex justify-between gap-2">
                <dt>Hotel</dt>
                <dd className="text-right font-semibold">{selection.result.hotelName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Room</dt>
                <dd className="text-right font-semibold">
                  {selection.rooms} × {selection.result.name}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Check-in</dt>
                <dd className="font-semibold">{checkIn}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Check-out</dt>
                <dd className="font-semibold">{checkOut}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>
                  ₹{selection.result.pricePerNight.toLocaleString("en-IN")} ×{" "}
                  {selection.rooms} room{selection.rooms === 1 ? "" : "s"} × {nights}{" "}
                  night{nights === 1 ? "" : "s"}
                </dt>
              </div>
              <div className="flex justify-between gap-2 border-t border-cream-200 pt-2 text-base">
                <dt className="font-bold text-maroon-950">Pay at hotel</dt>
                <dd className="font-display text-lg font-bold text-maroon-950">
                  ₹
                  {(
                    selection.result.pricePerNight * selection.rooms * nights
                  ).toLocaleString("en-IN")}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      )}

      <p className="text-center text-sm text-maroon-700">
        Already booked?{" "}
        <Link href="/booking/lookup" className="font-bold underline underline-offset-4">
          Find your booking
        </Link>
      </p>
    </div>
  );
}

function RoomResultCard({
  result,
  nights,
  onChoose,
}: {
  result: AvailabilityResult;
  nights: number;
  onChoose: (rooms: number) => void;
}) {
  const [rooms, setRooms] = useState(1);
  const maxSelectable = Math.min(result.freeRooms, 5);
  const total = result.pricePerNight * rooms * nights;

  return (
    <article className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-marigold-700">
          {result.hotelName}
        </p>
        <h3 className="font-display text-xl font-semibold text-maroon-900">
          {result.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-maroon-800">
          {result.description}
        </p>
        <p className="mt-2 text-sm font-semibold text-maroon-700">
          Sleeps {result.maxAdults} adult{result.maxAdults === 1 ? "" : "s"}
          {result.maxChildren > 0 && ` + ${result.maxChildren} children`} per room
          {result.freeRooms <= 3 && (
            <span className="ml-2 rounded bg-marigold-100 px-2 py-0.5 text-xs font-bold text-maroon-900">
              Only {result.freeRooms} left
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-3 sm:w-52 sm:items-end">
        <p className="text-right">
          <span className="font-display text-2xl font-bold text-maroon-950">
            ₹{result.pricePerNight.toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-maroon-700"> / night</span>
        </p>
        <div className="flex items-center justify-end gap-2">
          <label
            htmlFor={`rooms-${result.hotelId}-${result.roomTypeId}`}
            className="text-sm font-semibold text-maroon-800"
          >
            Rooms
          </label>
          <select
            id={`rooms-${result.hotelId}-${result.roomTypeId}`}
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="field-input !w-20"
          >
            {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => onChoose(rooms)} className="btn-primary text-sm">
          Choose · ₹{total.toLocaleString("en-IN")}
        </button>
      </div>
    </article>
  );
}

// Re-exported for the confirmation page's WhatsApp button.
export { whatsappBookingMessage };
