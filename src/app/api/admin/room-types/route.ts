import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { roomTypeSchema } from "@/lib/api/room-type-schema";
import type { RoomType } from "@/lib/types";

/** GET /api/admin/room-types?hotelId= — all room types for a branch. */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const url = new URL(request.url);
    const hotelId = url.searchParams.get("hotelId") ?? "";
    if (!hotelId) return errorResponse("invalid_input", "hotelId required", 400);
    requireHotelAccess(admin, hotelId);

    const snap = await adminDb()
      .collection("hotels")
      .doc(hotelId)
      .collection("roomTypes")
      .orderBy("sortOrder")
      .get();

    return NextResponse.json({
      roomTypes: snap.docs.map((d) => ({ id: d.id, ...(d.data() as RoomType) })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = roomTypeSchema.extend({
  hotelId: z.string().min(1),
});

/** POST /api/admin/room-types — create a room type on a branch. */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid room type",
        400
      );
    }
    requireHotelAccess(admin, parsed.data.hotelId);

    const { hotelId, ...roomType } = parsed.data;
    const ref = await adminDb()
      .collection("hotels")
      .doc(hotelId)
      .collection("roomTypes")
      .add({ ...roomType, images: [] });

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
