"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";
import { formatPhoneForDisplay } from "@/lib/phone";
import type { BookingStatus } from "@/lib/types";

interface BookingRow {
  id: string;
  bookingCode: string;
  hotelId: string;
  hotelName: string;
  roomTypeName: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCity?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  totalAmount: number;
  status: BookingStatus;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: string | null;
  cancelReason?: string;
}

interface BranchOption {
  slug: string;
  name: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "checked_out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: "bg-marigold-100 text-maroon-900",
  confirmed: "bg-green-100 text-green-900",
  checked_in: "bg-blue-100 text-blue-900",
  checked_out: "bg-cream-200 text-maroon-700",
  cancelled: "bg-red-50 text-red-900",
  no_show: "bg-red-50 text-red-900",
};

/** The actions offered per current status — mirrors the transition table. */
const ACTIONS: Record<BookingStatus, { to: BookingStatus; label: string; danger?: boolean }[]> = {
  pending: [
    { to: "confirmed", label: "Confirm" },
    { to: "cancelled", label: "Reject", danger: true },
  ],
  confirmed: [
    { to: "checked_in", label: "Check in" },
    { to: "no_show", label: "No-show", danger: true },
    { to: "cancelled", label: "Cancel", danger: true },
  ],
  checked_in: [{ to: "checked_out", label: "Check out" }],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

export function BookingsScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [hotelId, setHotelId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    void authedFetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((body) =>
        setBranches(
          (body.hotels ?? []).map((h: { slug: string; name: string }) => ({
            slug: h.slug,
            name: h.name,
          }))
        )
      )
      .catch(() => {});
  }, [authedFetch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (hotelId) params.set("hotelId", hotelId);
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q) params.set("q", q);
      const res = await authedFetch(`/api/admin/bookings?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load bookings.");
        return;
      }
      setRows(body.bookings as BookingRow[]);
    } catch {
      setError("Failed to load bookings. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, hotelId, status, from, to, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(row: BookingRow, toStatus: BookingStatus) {
    const confirmMsg =
      toStatus === "cancelled"
        ? `Cancel ${row.bookingCode} for ${row.guestName}? The rooms go back on sale.`
        : toStatus === "no_show"
          ? `Mark ${row.bookingCode} as no-show? The rooms go back on sale.`
          : null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setActing(row.id);
    try {
      const res = await authedFetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: toStatus }),
      });
      const body = await res.json();
      if (!res.ok) {
        window.alert(body.error?.message ?? "That didn't work.");
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: toStatus } : r))
      );
    } catch {
      window.alert("Network error — the booking was not changed.");
    } finally {
      setActing(null);
    }
  }

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === "pending").length,
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon-950">
            Bookings
          </h1>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm font-semibold text-marigold-700">
              {pendingCount} pending request{pendingCount === 1 ? "" : "s"} need
              {pendingCount === 1 ? "s" : ""} a decision
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="btn-secondary !min-h-10 !px-4 !py-2 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {isOwner && (
          <div>
            <label htmlFor="f-branch" className="field-label">
              Branch
            </label>
            <select
              id="f-branch"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="field-input"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="f-status" className="field-label">
            Status
          </label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="field-input"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="field-label">
            Check-in from
          </label>
          <input
            id="f-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="f-to" className="field-label">
            Check-in to
          </label>
          <input
            id="f-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="f-q" className="field-label">
            Search
          </label>
          <input
            id="f-q"
            placeholder="Code, name or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading bookings…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-maroon-800">
          No bookings match these filters.
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-bold uppercase tracking-wide text-maroon-700">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Guest</th>
                {isOwner && <th className="px-4 py-3">Branch</th>}
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Stay</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <BookingTableRow
                  key={row.id}
                  row={row}
                  isOwner={isOwner}
                  expanded={expanded === row.id}
                  acting={acting === row.id}
                  onToggle={() =>
                    setExpanded(expanded === row.id ? null : row.id)
                  }
                  onTransition={(toStatus) => void transition(row, toStatus)}
                  authedFetch={authedFetch}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BookingTableRow({
  row,
  isOwner,
  expanded,
  acting,
  onToggle,
  onTransition,
  authedFetch,
}: {
  row: BookingRow;
  isOwner: boolean;
  expanded: boolean;
  acting: boolean;
  onToggle: () => void;
  onTransition: (to: BookingStatus) => void;
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [notes, setNotes] = useState(row.internalNotes ?? "");
  const [requests, setRequests] = useState(row.specialRequests ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const waHref = `https://wa.me/${row.guestPhone}?text=${encodeURIComponent(
    `Namaste ${row.guestName}! This is ${row.hotelName} about your booking ${row.bookingCode}.`
  )}`;

  async function saveDetails() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await authedFetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          specialRequests: requests,
          internalNotes: notes,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const body = await res.json();
        window.alert(body.error?.message ?? "Save failed.");
      }
    } catch {
      window.alert("Network error — changes not saved.");
    } finally {
      setSaving(false);
    }
  }

  const colSpan = isOwner ? 8 : 7;

  return (
    <>
      <tr className="border-b border-cream-100 align-top hover:bg-cream-50">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="font-mono font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4"
          >
            {row.bookingCode}
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="font-semibold text-maroon-950">{row.guestName}</p>
          <p className="text-maroon-700">
            {formatPhoneForDisplay(row.guestPhone)}
          </p>
        </td>
        {isOwner && <td className="px-4 py-3">{row.hotelName}</td>}
        <td className="px-4 py-3">
          {row.rooms} × {row.roomTypeName}
        </td>
        <td className="px-4 py-3">
          {row.checkIn} → {row.checkOut}
          <p className="text-maroon-700">
            {row.nights}n · {row.adults}A
            {row.children > 0 && ` ${row.children}C`}
          </p>
        </td>
        <td className="px-4 py-3 font-semibold">
          ₹{row.totalAmount.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_BADGE[row.status]}`}
          >
            {row.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS[row.status].map((a) => (
              <button
                key={a.to}
                type="button"
                disabled={acting}
                onClick={() => onTransition(a.to)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${
                  a.danger
                    ? "bg-red-50 text-red-900 hover:bg-red-100"
                    : "bg-marigold-100 text-maroon-900 hover:bg-marigold-200"
                }`}
              >
                {a.label}
              </button>
            ))}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[#25D366]/15 px-2.5 py-1 text-xs font-bold text-green-900 transition hover:bg-[#25D366]/25"
            >
              WhatsApp
            </a>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-cream-100 bg-cream-50">
          <td colSpan={colSpan} className="px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm text-maroon-800">
                <p>
                  <span className="font-bold">Booked:</span>{" "}
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString("en-IN")
                    : "—"}
                </p>
                {row.guestEmail && (
                  <p>
                    <span className="font-bold">Email:</span> {row.guestEmail}
                  </p>
                )}
                {row.guestCity && (
                  <p>
                    <span className="font-bold">City:</span> {row.guestCity}
                  </p>
                )}
                {row.cancelReason && (
                  <p>
                    <span className="font-bold">Cancel reason:</span>{" "}
                    {row.cancelReason}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor={`req-${row.id}`} className="field-label">
                    Special requests
                  </label>
                  <textarea
                    id={`req-${row.id}`}
                    rows={2}
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                    className="field-input text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`notes-${row.id}`} className="field-label">
                    Internal notes{" "}
                    <span className="font-normal">(never shown to the guest)</span>
                  </label>
                  <textarea
                    id={`notes-${row.id}`}
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="field-input text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveDetails()}
                  disabled={saving}
                  className="btn-primary !min-h-9 !px-4 !py-1.5 text-sm"
                >
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save details"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
