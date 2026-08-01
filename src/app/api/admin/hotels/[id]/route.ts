import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";

const settingsSchema = z.object({
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(300).optional(),
  mapsUrl: z.string().trim().url().max(300).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,14}$/, "Digits only, e.g. 917060189819")
    .optional(),
  displayPhone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  amenities: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  distances: z.record(z.string(), z.string().trim().max(60)).optional(),
});

/** PATCH /api/admin/hotels/[id] — branch settings. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    requireHotelAccess(admin, id);

    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid settings",
        400
      );
    }

    const ref = adminDb().collection("hotels").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return errorResponse("not_found", "Branch not found.", 404);
    }

    await ref.update(parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
