"use client";

import { FormEvent, useState } from "react";

/** Public "write a review" form on each branch page. Lands as pending. */
export function ReviewForm({ hotelId }: { hotelId: string }) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          guestName,
          rating,
          title,
          text,
          bookingCode: bookingCode || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Could not submit your review.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-900">
        Thank you! Your review has been received and will appear once the
        hotel approves it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary text-sm"
      >
        Write a review
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="font-display text-lg font-semibold text-maroon-900">
        Write a review
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="field-label">
            Your name
          </label>
          <input
            id="rv-name"
            required
            minLength={2}
            maxLength={80}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="rv-rating" className="field-label">
            Rating
          </label>
          <select
            id="rv-rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="field-input"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n}/5)
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="rv-title" className="field-label">
          Title
        </label>
        <input
          id="rv-title"
          required
          minLength={2}
          maxLength={100}
          placeholder="Peaceful stay near the temple"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="rv-text" className="field-label">
          Your review
        </label>
        <textarea
          id="rv-text"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="rv-code" className="field-label">
          Booking code{" "}
          <span className="font-normal text-maroon-600">
            (optional — marks your review as a verified stay)
          </span>
        </label>
        <input
          id="rv-code"
          placeholder="GW-4XK92B"
          value={bookingCode}
          onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
          className="field-input font-mono uppercase"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 text-sm font-semibold text-maroon-900">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={state === "sending"} className="btn-primary text-sm">
          {state === "sending" ? "Submitting…" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
