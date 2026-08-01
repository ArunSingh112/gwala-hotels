"use client";

import { FormEvent, useState } from "react";
import { formatDateLong } from "@/lib/booking-flow";

interface LookedUpBooking {
  bookingCode: string;
  hotelId: string;
  hotelName: string;
  roomTypeName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  totalAmount: number;
  status: string;
  specialRequests?: string;
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: {
    label: "Waiting for the hotel to confirm",
    tone: "bg-marigold-100 text-maroon-900",
  },
  confirmed: { label: "Confirmed", tone: "bg-green-100 text-green-900" },
  checked_in: { label: "Checked in", tone: "bg-green-100 text-green-900" },
  checked_out: { label: "Checked out", tone: "bg-cream-200 text-maroon-800" },
  cancelled: { label: "Cancelled", tone: "bg-cream-200 text-maroon-800" },
  no_show: { label: "Marked no-show", tone: "bg-cream-200 text-maroon-800" },
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

export function LookupForm() {
  const [bookingCode, setBookingCode] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<LookedUpBooking | null>(null);
  const [cancelState, setCancelState] = useState<
    "idle" | "confirming" | "cancelling" | "done"
  >("idle");

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBooking(null);
    setCancelState("idle");
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCode: bookingCode.trim(), guestPhone }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Lookup failed. Please try again.");
        return;
      }
      setBooking(body.booking as LookedUpBooking);
    } catch {
      setError(
        "We couldn't reach the booking system. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking() {
    if (!booking) return;
    setCancelState("cancelling");
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: booking.bookingCode,
          guestPhone,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Cancellation failed. Please try again.");
        setCancelState("confirming");
        return;
      }
      setBooking({ ...booking, status: "cancelled" });
      setCancelState("done");
    } catch {
      setError(
        "We couldn't reach the booking system. Your booking is unchanged — please try again."
      );
      setCancelState("confirming");
    }
  }

  const status = booking ? STATUS_LABELS[booking.status] : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <form onSubmit={lookup} className="card space-y-4 p-6">
        <div>
          <label htmlFor="lu-code" className="field-label">
            Booking code
          </label>
          <input
            id="lu-code"
            required
            placeholder="GW-4XK92B"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
            className="field-input font-mono uppercase"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="lu-phone" className="field-label">
            Mobile number used to book
          </label>
          <input
            id="lu-phone"
            required
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="field-input"
            autoComplete="tel"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-marigold-50 p-3 text-sm font-semibold text-maroon-900">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Looking up…" : "Find my booking"}
        </button>
      </form>

      {booking && status && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-bold tracking-wider text-maroon-950">
                {booking.bookingCode}
              </p>
              <p className="text-sm text-maroon-800">{booking.guestName}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${status.tone}`}
            >
              {status.label}
            </span>
          </div>

          <dl className="mt-4 space-y-2 text-sm text-maroon-800">
            <div className="flex justify-between gap-2">
              <dt>Hotel</dt>
              <dd className="text-right font-semibold">{booking.hotelName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Room</dt>
              <dd className="font-semibold">
                {booking.rooms} × {booking.roomTypeName}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Check-in</dt>
              <dd className="font-semibold">{formatDateLong(booking.checkIn)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Check-out</dt>
              <dd className="font-semibold">{formatDateLong(booking.checkOut)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-cream-200 pt-2">
              <dt className="font-bold text-maroon-950">Pay at hotel</dt>
              <dd className="font-display text-lg font-bold text-maroon-950">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </dd>
            </div>
          </dl>

          {cancelState === "done" ? (
            <p className="mt-4 rounded-lg bg-cream-100 p-3 text-center text-sm font-semibold text-maroon-900">
              Your booking is cancelled and the rooms are released. We hope to
              see you in Vrindavan another time. 🙏
            </p>
          ) : CANCELLABLE.has(booking.status) ? (
            cancelState === "confirming" || cancelState === "cancelling" ? (
              <div className="mt-4 rounded-lg border border-marigold-300 bg-marigold-50 p-4">
                <p className="text-sm font-semibold text-maroon-900">
                  Cancel this booking? The rooms go back on sale immediately.
                  Nothing has been charged.
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={cancelBooking}
                    disabled={cancelState === "cancelling"}
                    className="btn-secondary !min-h-10 flex-1 !border-maroon-700 !py-2 text-sm"
                  >
                    {cancelState === "cancelling"
                      ? "Cancelling…"
                      : "Yes, cancel it"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelState("idle")}
                    disabled={cancelState === "cancelling"}
                    className="btn-primary !min-h-10 flex-1 !py-2 text-sm"
                  >
                    Keep my booking
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCancelState("confirming")}
                className="mt-4 w-full text-center text-sm font-semibold text-maroon-700 underline underline-offset-4 hover:text-maroon-900"
              >
                Cancel this booking
              </button>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
