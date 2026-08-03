import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, allowedHotelId } from "@/lib/api/auth";
import { handleApiError, errorResponse } from "@/lib/api/errors";
import type { Booking } from "@/lib/types";

export interface AdminBookingRow extends Omit<Booking, "createdAt" | "updatedAt" | "cancelledAt"> {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  cancelledAt: string | null;
}

function toIso(value: unknown): string | null {
  const ts = value as { toDate?: () => Date } | undefined;
  return ts?.toDate ? ts.toDate().toISOString() : null;
}

/**
 * GET /api/admin/bookings?hotelId=&status=&from=&to=&q=
 * Owner sees all branches; a manager's results are forced to their branch
 * regardless of the hotelId parameter. Free-text q matches booking code,
 * guest name and phone (in-memory, over the filtered set).
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const url = new URL(request.url);

    const scope = allowedHotelId(admin);
    const requested = url.searchParams.get("hotelId") || null;
    const hotelId = scope ?? requested; // manager scope always wins
    if (scope && requested && requested !== scope) {
      return errorResponse("forbidden", "You don't have access to this branch.", 403);
    }

    const status = url.searchParams.get("status") || null;
    const from = url.searchParams.get("from") || null; // checkIn >= from
    const to = url.searchParams.get("to") || null; // checkIn <= to
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    // Equality filters never need composite indexes; the checkIn range and
    // sort are applied in memory over the (bounded) result set instead.
    let query = adminDb().collection("bookings") as FirebaseFirestore.Query;
    if (hotelId) query = query.where("hotelId", "==", hotelId);
    if (status) query = query.where("status", "==", status);
    query = query.limit(1000);

    const snap = await query.get();
    let rows: AdminBookingRow[] = snap.docs.map((d) => {
      const b = d.data() as Booking;
      return {
        ...b,
        id: d.id,
        createdAt: toIso(b.createdAt),
        updatedAt: toIso(b.updatedAt),
        cancelledAt: toIso(b.cancelledAt),
      };
    });
    if (from) rows = rows.filter((r) => r.checkIn >= from);
    if (to) rows = rows.filter((r) => r.checkIn <= to);
    rows.sort((a, b) => (a.checkIn < b.checkIn ? 1 : a.checkIn > b.checkIn ? -1 : 0));
    rows = rows.slice(0, 500);

    if (q) {
      rows = rows.filter(
        (r) =>
          r.bookingCode.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.guestPhone.includes(q.replace(/\D/g, "") || q)
      );
    }

    return NextResponse.json({ bookings: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
