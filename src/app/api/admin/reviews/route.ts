import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, allowedHotelId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import type { Review } from "@/lib/types";

/**
 * GET /api/admin/reviews?status=pending — reviews for moderation, scoped
 * to the manager's branch.
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const scope = allowedHotelId(admin);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";

    let query = adminDb()
      .collection("reviews")
      .where("status", "==", status) as FirebaseFirestore.Query;
    if (scope) query = query.where("hotelId", "==", scope);

    const snap = await query.orderBy("createdAt", "desc").limit(200).get();
    const reviews = snap.docs.map((d) => {
      const r = d.data() as Review;
      const created = r.createdAt as { toDate?: () => Date } | undefined;
      return {
        id: d.id,
        hotelId: r.hotelId,
        guestName: r.guestName,
        bookingCode: r.bookingCode ?? null,
        rating: r.rating,
        title: r.title,
        text: r.text,
        status: r.status,
        createdAt: created?.toDate ? created.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    return handleApiError(err);
  }
}
