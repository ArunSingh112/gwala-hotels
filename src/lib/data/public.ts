import "server-only";
import { cache } from "react";
import type { Hotel, Review, RoomType } from "@/lib/types";
import { SEED_HOTELS, SEED_ROOM_TYPES } from "@/lib/seed-data";

// Public-site reads. When Firebase Admin credentials are configured the data
// comes from Firestore; without them (local dev, CI builds) the seed data is
// used so every page still renders. Pages using these are ISR-revalidated.

function hasAdminCreds(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

export const getHotels = cache(async (): Promise<Hotel[]> => {
  if (!hasAdminCreds()) {
    return [...SEED_HOTELS].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const { adminDb } = await import("@/lib/firebase/admin");
  const snap = await adminDb()
    .collection("hotels")
    .where("active", "==", true)
    .orderBy("sortOrder")
    .get();
  return snap.docs.map((d) => d.data() as Hotel);
});

export const getHotelBySlug = cache(
  async (slug: string): Promise<Hotel | null> => {
    const hotels = await getHotels();
    return hotels.find((h) => h.slug === slug) ?? null;
  }
);

export const getRoomTypes = cache(
  async (hotelId: string): Promise<(RoomType & { id: string })[]> => {
    if (!hasAdminCreds()) {
      return SEED_ROOM_TYPES.filter((rt) => rt.active).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
    }
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await adminDb()
      .collection("hotels")
      .doc(hotelId)
      .collection("roomTypes")
      .where("active", "==", true)
      .orderBy("sortOrder")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RoomType) }));
  }
);

export interface PublicReview extends Omit<Review, "createdAt" | "moderatedBy"> {
  id: string;
}

export const getApprovedReviews = cache(
  async (hotelId?: string, limit = 12): Promise<PublicReview[]> => {
    if (!hasAdminCreds()) return [];
    const { adminDb } = await import("@/lib/firebase/admin");
    let q = adminDb()
      .collection("reviews")
      .where("status", "==", "approved") as FirebaseFirestore.Query;
    if (hotelId) q = q.where("hotelId", "==", hotelId);
    const snap = await q.orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => {
      const { createdAt: _c, moderatedBy: _m, ...rest } = d.data() as Review;
      return { id: d.id, ...rest };
    });
  }
);

/** Average rating and count for a branch, computed at render time. */
export async function getRatingSummary(
  hotelId: string
): Promise<{ average: number; count: number } | null> {
  const reviews = await getApprovedReviews(hotelId, 100);
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}
