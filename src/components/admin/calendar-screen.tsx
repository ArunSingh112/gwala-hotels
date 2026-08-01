"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface CalendarRow {
  roomTypeId: string;
  name: string;
  totalRooms: number;
  days: { date: string; roomsBooked: number }[];
}

interface BranchOption {
  slug: string;
  name: string;
}

function currentMonth(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })
    .format(new Date())
    .slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Cell colour by how full the night is — the at-a-glance heat map. */
function cellClass(booked: number, total: number): string {
  if (total === 0) return "bg-cream-100 text-maroon-400";
  const ratio = booked / total;
  if (ratio >= 1) return "bg-maroon-700 text-cream-50 font-bold";
  if (ratio >= 0.75) return "bg-marigold-500 text-maroon-950 font-semibold";
  if (ratio >= 0.4) return "bg-marigold-200 text-maroon-900";
  if (ratio > 0) return "bg-marigold-50 text-maroon-800";
  return "bg-white text-maroon-400";
}

export function CalendarScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [hotelId, setHotelId] = useState(profile?.hotelId ?? "");
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<CalendarRow[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void authedFetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((body) => {
        const hs = (body.hotels ?? []).map(
          (h: { slug: string; name: string }) => ({ slug: h.slug, name: h.name })
        );
        setBranches(hs);
        setHotelId((prev) => prev || hs[0]?.slug || "");
      })
      .catch(() => {});
  }, [authedFetch]);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch(
        `/api/admin/calendar?hotelId=${encodeURIComponent(hotelId)}&month=${month}`
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load the calendar.");
        return;
      }
      setRows(body.rows as CalendarRow[]);
      setDates(body.dates as string[]);
    } catch {
      setError("Failed to load the calendar. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, hotelId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          Calendar
        </h1>
        <div className="flex items-center gap-3">
          {profile?.role === "owner" && (
            <select
              aria-label="Branch"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="field-input !w-auto"
            >
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Previous month"
              className="rounded-lg border border-maroon-200 px-3 py-2 font-bold text-maroon-900 hover:bg-cream-100"
            >
              ←
            </button>
            <span className="min-w-36 text-center font-semibold text-maroon-900">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Next month"
              className="rounded-lg border border-maroon-200 px-3 py-2 font-bold text-maroon-900 hover:bg-cream-100"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {loading || !rows ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading calendar…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-maroon-800">
          No active room types on this branch.
        </p>
      ) : (
        <div className="card overflow-x-auto p-4">
          <table className="w-full border-separate border-spacing-0.5 text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white pr-2 text-left text-sm font-bold text-maroon-900">
                  Room type
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    scope="col"
                    className="min-w-8 pb-1 font-semibold text-maroon-700"
                  >
                    {Number(d.slice(8))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roomTypeId}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-white pr-2 text-left text-sm font-semibold text-maroon-900"
                  >
                    {row.name}
                    <span className="ml-1 font-normal text-maroon-600">
                      ({row.totalRooms})
                    </span>
                  </th>
                  {row.days.map((day) => (
                    <td
                      key={day.date}
                      title={`${day.date}: ${day.roomsBooked} of ${row.totalRooms} booked`}
                      className={`rounded p-1.5 tabular-nums ${cellClass(day.roomsBooked, row.totalRooms)}`}
                    >
                      {day.roomsBooked}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 flex flex-wrap gap-4 text-xs text-maroon-700">
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded bg-white align-middle ring-1 ring-cream-200" />
              empty
            </span>
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded bg-marigold-200 align-middle" />
              filling
            </span>
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded bg-marigold-500 align-middle" />
              nearly full
            </span>
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded bg-maroon-700 align-middle" />
              full
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
