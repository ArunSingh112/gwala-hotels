import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, allowedHotelId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import type { Hotel } from "@/lib/types";

/**
 * GET /api/admin/hotels — the branches this admin may see: all for the
 * owner, exactly one for a manager. Includes inactive branches (the owner
 * manages those too).
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const scope = allowedHotelId(admin);

    let query = adminDb().collection("hotels") as FirebaseFirestore.Query;
    if (scope) query = query.where("slug", "==", scope);

    const snap = await query.get();
    const hotels = snap.docs
      .sort((a, b) => ((a.data() as Hotel).sortOrder ?? 0) - ((b.data() as Hotel).sortOrder ?? 0))
      .map((d) => {
      const h = d.data() as Hotel;
      return {
        id: d.id,
        name: h.name,
        slug: h.slug,
        address: h.address,
        phone: h.phone,
        displayPhone: h.displayPhone,
        checkInTime: h.checkInTime,
        checkOutTime: h.checkOutTime,
        amenities: h.amenities,
        description: h.description,
        tagline: h.tagline,
        mapsUrl: h.mapsUrl,
        distances: h.distances ?? {},
        gallery: h.gallery ?? [],
        active: h.active,
      };
    });
    return NextResponse.json({ hotels });
  } catch (err) {
    return handleApiError(err);
  }
}
