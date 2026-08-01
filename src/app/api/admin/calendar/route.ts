import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import type { RoomType } from "@/lib/types";

/**
 * GET /api/admin/calendar?hotelId=&month=YYYY-MM
 * A month grid for one branch: per room type, per day, roomsBooked out of
 * totalRooms — the screen that makes a busy weekend visible at a glance.
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const url = new URL(request.url);
    const hotelId = url.searchParams.get("hotelId") ?? "";
    const month = url.searchParams.get("month") ?? "";

    if (!hotelId || !/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse("invalid_input", "hotelId and month=YYYY-MM required", 400);
    }
    requireHotelAccess(admin, hotelId);

    const db = adminDb();
    const roomTypesSnap = await db
      .collection("hotels")
      .doc(hotelId)
      .collection("roomTypes")
      .where("active", "==", true)
      .orderBy("sortOrder")
      .get();

    const [yearStr, monthStr] = month.split("-");
    const daysInMonth = new Date(
      Date.UTC(Number(yearStr), Number(monthStr), 0)
    ).getUTCDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) =>
      `${month}-${String(i + 1).padStart(2, "0")}`
    );

    const rows = [];
    for (const rtDoc of roomTypesSnap.docs) {
      const rt = rtDoc.data() as RoomType;
      const refs = dates.map((date) =>
        db.collection("availability").doc(`${hotelId}_${rtDoc.id}_${date}`)
      );
      const snaps = await db.getAll(...refs);
      rows.push({
        roomTypeId: rtDoc.id,
        name: rt.name,
        totalRooms: rt.totalRooms,
        days: snaps.map((s, i) => ({
          date: dates[i],
          roomsBooked: s.exists ? ((s.data()?.roomsBooked as number) ?? 0) : 0,
        })),
      });
    }

    return NextResponse.json({ month, dates, rows });
  } catch (err) {
    return handleApiError(err);
  }
}
