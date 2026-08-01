"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface DashRow {
  id: string;
  bookingCode: string;
  guestName: string;
  hotelName: string;
  roomTypeName: string;
  rooms: number;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface DashboardData {
  today: string;
  arrivals: DashRow[];
  departures: DashRow[];
  pendingCount: number;
  last7DaysCount: number;
  monthRevenue: number;
  occupancy: {
    hotelId: string;
    hotelName: string;
    totalRooms: number;
    roomsBooked: number;
  }[];
  anySeedData: boolean;
}

export function DashboardScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void authedFetch("/api/admin/dashboard")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error?.message);
        setData(body as DashboardData);
      })
      .catch((e: Error) =>
        setError(e.message || "Failed to load the dashboard.")
      );
  }, [authedFetch]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-marigold-50 p-4 font-semibold text-maroon-900">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <p role="status" className="py-8 text-center text-maroon-800">
        Loading dashboard…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          {profile?.role === "owner" ? "All branches" : profile?.hotelId} —{" "}
          {new Date(`${data.today}T00:00:00Z`).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}
        </h1>
      </div>

      {data.anySeedData && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-dashed border-marigold-500 bg-marigold-50 p-4"
        >
          <p className="font-semibold text-maroon-900">
            ⚠ Rooms and prices are still sample data — update them before
            going live.
          </p>
          <Link href="/admin/rooms" className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
            Open rooms screen
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/bookings?status=pending" className="card p-5 transition hover:shadow-md">
          <p className="text-sm font-bold uppercase tracking-wide text-marigold-700">
            Pending requests
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-maroon-950">
            {data.pendingCount}
          </p>
          <p className="mt-1 text-sm text-maroon-700">
            waiting for a decision
          </p>
        </Link>
        <div className="card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-marigold-700">
            Bookings, last 7 days
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-maroon-950">
            {data.last7DaysCount}
          </p>
          <p className="mt-1 text-sm text-maroon-700">taken on the website</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-marigold-700">
            Expected revenue this month
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-maroon-950">
            ₹{data.monthRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-sm text-maroon-700">
            check-ins this month, pay at hotel
          </p>
        </div>
      </div>

      {/* Occupancy */}
      <section aria-labelledby="occ-heading" className="card p-5">
        <h2 id="occ-heading" className="font-display text-xl font-semibold text-maroon-900">
          Tonight&apos;s occupancy
        </h2>
        <div className="mt-4 space-y-3">
          {data.occupancy.map((o) => {
            const pct =
              o.totalRooms > 0
                ? Math.round((o.roomsBooked / o.totalRooms) * 100)
                : 0;
            return (
              <div key={o.hotelId}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-maroon-900">
                    {o.hotelName}
                  </span>
                  <span className="text-maroon-700">
                    {o.roomsBooked} / {o.totalRooms} rooms · {pct}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${o.hotelName} occupancy`}
                  className="mt-1 h-3 overflow-hidden rounded-full bg-cream-200"
                >
                  <div
                    className={`h-full rounded-full ${
                      pct >= 90
                        ? "bg-maroon-700"
                        : pct >= 60
                          ? "bg-marigold-500"
                          : "bg-marigold-300"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Arrivals & departures */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MovementList
          title="Today's arrivals"
          empty="No arrivals today."
          rows={data.arrivals}
        />
        <MovementList
          title="Today's departures"
          empty="No departures today."
          rows={data.departures}
        />
      </div>
    </div>
  );
}

function MovementList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: DashRow[];
}) {
  return (
    <section className="card p-5">
      <h2 className="font-display text-xl font-semibold text-maroon-900">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-maroon-700">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-cream-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-semibold text-maroon-950">{r.guestName}</p>
                <p className="text-maroon-700">
                  {r.hotelName} · {r.rooms} × {r.roomTypeName}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-maroon-800">
                {r.bookingCode}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
