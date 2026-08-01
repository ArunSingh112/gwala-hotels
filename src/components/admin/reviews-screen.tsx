"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface ReviewRow {
  id: string;
  hotelId: string;
  guestName: string;
  bookingCode: string | null;
  rating: number;
  title: string;
  text: string;
  status: string;
  createdAt: string | null;
}

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function ReviewsScreen() {
  const { authedFetch } = useAdminAuth();
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const res = await authedFetch(`/api/admin/reviews?status=${tab}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load reviews.");
        return;
      }
      setRows(body.reviews as ReviewRow[]);
    } catch {
      setError("Failed to load reviews. Check your connection.");
    }
  }, [authedFetch, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      const res = await authedFetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        window.alert(body.error?.message ?? "That didn't work.");
        return;
      }
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch {
      window.alert("Network error — the review was not changed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-maroon-950">
        Reviews
      </h1>

      <div role="tablist" aria-label="Review status" className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.value
                ? "bg-maroon-900 text-cream-50"
                : "bg-white text-maroon-800 hover:bg-cream-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {!rows ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading reviews…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-maroon-800">
          No {tab} reviews.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-marigold-500" aria-label={`Rated ${r.rating} out of 5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-cream-300">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-maroon-950">
                    {r.title}
                  </h2>
                </div>
                <div className="text-right text-xs text-maroon-700">
                  <p className="font-bold uppercase">{r.hotelId}</p>
                  {r.createdAt && (
                    <p>{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-maroon-800">
                {r.text}
              </p>
              <p className="mt-3 text-sm font-semibold text-marigold-700">
                — {r.guestName}
                {r.bookingCode && (
                  <span className="ml-2 rounded bg-green-50 px-2 py-0.5 text-xs font-bold text-green-900">
                    Verified stay · {r.bookingCode}
                  </span>
                )}
              </p>
              {tab === "pending" && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={acting === r.id}
                    onClick={() => void moderate(r.id, "approved")}
                    className="btn-primary !min-h-10 flex-1 !py-2 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting === r.id}
                    onClick={() => void moderate(r.id, "rejected")}
                    className="btn-secondary !min-h-10 flex-1 !py-2 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
