import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { todayInIndia } from "@/lib/services/bookings";
import { roomTypeSchema } from "@/lib/api/room-type-schema";

const updateSchema = roomTypeSchema.partial().extend({
  hotelId: z.string().min(1),
});

/**
 * PATCH /api/admin/room-types/[id]?hotelId=
 * Editing clears isSeedData (the owner has entered real values). Reducing
 * totalRooms below what is already booked on some future night is rejected
 * with a message naming those dates.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid room type",
        400
      );
    }
    const { hotelId, ...changes } = parsed.data;
    requireHotelAccess(admin, hotelId);

    const db = adminDb();
    const ref = db
      .collection("hotels")
      .doc(hotelId)
      .collection("roomTypes")
      .doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return errorResponse("not_found", "Room type not found.", 404);
    }

    // Guard: totalRooms cannot drop below rooms already booked on any
    // future night. Check every availability doc from today onwards.
    if (changes.totalRooms !== undefined) {
      const today = todayInIndia();
      const availSnap = await db
        .collection("availability")
        .where("hotelId", "==", hotelId)
        .where("roomTypeId", "==", id)
        .where("date", ">=", today)
        .get();
      const overbooked = availSnap.docs
        .filter((d) => ((d.data().roomsBooked as number) ?? 0) > changes.totalRooms!)
        .map((d) => d.data().date as string)
        .sort();
      if (overbooked.length > 0) {
        const shown = overbooked.slice(0, 5).join(", ");
        const more =
          overbooked.length > 5 ? ` and ${overbooked.length - 5} more nights` : "";
        return errorResponse(
          "invalid_input",
          `Cannot reduce to ${changes.totalRooms} rooms: more are already booked on ${shown}${more}. Cancel or move those bookings first.`,
          409
        );
      }
    }

    await ref.update({ ...changes, isSeedData: false });
    return NextResponse.json({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
