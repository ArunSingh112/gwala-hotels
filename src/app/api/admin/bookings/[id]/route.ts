import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { transitionBooking } from "@/lib/services/bookings";
import { BOOKING_STATUSES, type Booking } from "@/lib/types";

const transitionSchema = z.object({
  action: z.literal("transition"),
  to: z.enum(BOOKING_STATUSES),
  cancelReason: z.string().trim().max(500).optional(),
});

const editSchema = z.object({
  action: z.literal("edit"),
  specialRequests: z.string().trim().max(1000).optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

const patchSchema = z.discriminatedUnion("action", [
  transitionSchema,
  editSchema,
]);

/**
 * PATCH /api/admin/bookings/[id]
 *  { action: "transition", to, cancelReason? } — status change, with the
 *    inventory release handled inside the same transaction.
 *  { action: "edit", specialRequests?, internalNotes? } — detail edits.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const snap = await adminDb().collection("bookings").doc(id).get();
    if (!snap.exists) {
      return errorResponse("not_found", "Booking not found.", 404);
    }
    const booking = snap.data() as Booking;
    requireHotelAccess(admin, booking.hotelId);

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid request",
        400
      );
    }

    if (parsed.data.action === "transition") {
      const updated = await transitionBooking({
        bookingId: id,
        to: parsed.data.to,
        actor: admin.uid,
        cancelReason: parsed.data.cancelReason,
      });
      return NextResponse.json({
        booking: { id, status: updated.status },
      });
    }

    const update: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
      updatedBy: admin.uid,
    };
    if (parsed.data.specialRequests !== undefined) {
      update.specialRequests = parsed.data.specialRequests;
    }
    if (parsed.data.internalNotes !== undefined) {
      update.internalNotes = parsed.data.internalNotes;
    }
    await snap.ref.update(update);
    return NextResponse.json({ booking: { id } });
  } catch (err) {
    return handleApiError(err);
  }
}
