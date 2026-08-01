import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import type { Review } from "@/lib/types";

const moderateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

/** PATCH /api/admin/reviews/[id] — approve or reject a pending review. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const ref = adminDb().collection("reviews").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return errorResponse("not_found", "Review not found.", 404);
    }
    requireHotelAccess(admin, (snap.data() as Review).hotelId);

    const parsed = moderateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse("invalid_input", "status must be approved or rejected", 400);
    }

    await ref.update({
      status: parsed.data.status,
      moderatedBy: admin.uid,
    });
    return NextResponse.json({ id, status: parsed.data.status });
  } catch (err) {
    return handleApiError(err);
  }
}
