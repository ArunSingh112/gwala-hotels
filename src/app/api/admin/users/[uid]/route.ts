import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import type { AdminUser } from "@/lib/types";

const updateSchema = z.object({
  active: z.boolean().optional(),
  hotelId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(80).optional(),
});

/**
 * PATCH /api/admin/users/[uid] — owner only: rename, reassign branch, or
 * activate/deactivate a manager. The owner cannot deactivate their own
 * account, and owner accounts cannot be edited here at all.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin.user.role !== "owner") {
      return errorResponse("forbidden", "Only the owner can manage users.", 403);
    }
    const { uid } = await params;

    if (uid === admin.uid) {
      return errorResponse(
        "invalid_input",
        "You cannot edit your own account here.",
        400
      );
    }

    const ref = adminDb().collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return errorResponse("not_found", "User not found.", 404);
    }
    if ((snap.data() as AdminUser).role === "owner") {
      return errorResponse("forbidden", "Owner accounts cannot be edited here.", 403);
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return errorResponse("invalid_input", "Nothing to update.", 400);
    }

    if (parsed.data.hotelId) {
      const hotelSnap = await adminDb()
        .collection("hotels")
        .doc(parsed.data.hotelId)
        .get();
      if (!hotelSnap.exists) {
        return errorResponse("not_found", "That branch was not found.", 404);
      }
    }

    await ref.update(parsed.data);
    return NextResponse.json({ uid });
  } catch (err) {
    return handleApiError(err);
  }
}
