import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, allowedHotelId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { todayInIndia } from "@/lib/services/bookings";
import type { Booking, RoomType } from "@/lib/types";

/**
 * GET /api/admin/dashboard — the numbers the owner checks over morning chai:
 * today's arrivals and departures, occupancy per branch, pending requests,
 * bookings taken in the last 7 days, expected revenue this month, and
 * whether any branch still carries seeded placeholder rates.
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const scope = allowedHotelId(admin);
    const db = adminDb();
    const today = todayInIndia();
    const monthStart = today.slice(0, 8) + "01";
    const sevenDaysAgo = new Date(`${today}T00:00:00Z`);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const scoped = (q: FirebaseFirestore.Query) =>
      scope ? q.where("hotelId", "==", scope) : q;

    const bookingsCol = db.collection("bookings");
    const [arrivalsSnap, departuresSnap, pendingSnap, recentSnap, monthSnap] =
      await Promise.all([
        scoped(
          bookingsCol
            .where("checkIn", "==", today)
            .where("status", "in", ["confirmed", "pending"])
        ).get(),
        scoped(
          bookingsCol
            .where("checkOut", "==", today)
            .where("status", "==", "checked_in")
        ).get(),
        scoped(bookingsCol.where("status", "==", "pending")).get(),
        scoped(
          bookingsCol.where("createdAt", ">=", sevenDaysAgo)
        ).get(),
        scoped(
          bookingsCol
            .where("checkIn", ">=", monthStart)
            .where("checkIn", "<=", today.slice(0, 8) + "31")
        ).get(),
      ]);

    // Expected revenue this month: bookings whose check-in falls this month
    // and which are not cancelled/no-show.
    const LIVE = new Set(["pending", "confirmed", "checked_in", "checked_out"]);
    const monthRevenue = monthSnap.docs
      .map((d) => d.data() as Booking)
      .filter((b) => LIVE.has(b.status))
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Occupancy per branch tonight: roomsBooked / totalRooms across types.
    let hotelsQuery = db.collection("hotels").where("active", "==", true) as FirebaseFirestore.Query;
    if (scope) hotelsQuery = hotelsQuery.where("slug", "==", scope);
    const hotelsSnap = await hotelsQuery.get();

    let anySeedData = false;
    const occupancy: {
      hotelId: string;
      hotelName: string;
      totalRooms: number;
      roomsBooked: number;
    }[] = [];

    for (const hotelDoc of hotelsSnap.docs) {
      const roomTypesSnap = await hotelDoc.ref
        .collection("roomTypes")
        .where("active", "==", true)
        .get();
      let totalRooms = 0;
      const refs: FirebaseFirestore.DocumentReference[] = [];
      for (const rt of roomTypesSnap.docs) {
        const data = rt.data() as RoomType;
        totalRooms += data.totalRooms;
        if (data.isSeedData) anySeedData = true;
        refs.push(
          db.collection("availability").doc(`${hotelDoc.id}_${rt.id}_${today}`)
        );
      }
      const availSnaps = refs.length ? await db.getAll(...refs) : [];
      const roomsBooked = availSnaps.reduce(
        (sum, s) => sum + (s.exists ? ((s.data()?.roomsBooked as number) ?? 0) : 0),
        0
      );
      occupancy.push({
        hotelId: hotelDoc.id,
        hotelName: (hotelDoc.data().name as string) ?? hotelDoc.id,
        totalRooms,
        roomsBooked,
      });
    }

    const toRow = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const b = d.data() as Booking;
      return {
        id: d.id,
        bookingCode: b.bookingCode,
        guestName: b.guestName,
        hotelName: b.hotelName,
        roomTypeName: b.roomTypeName,
        rooms: b.rooms,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
      };
    };

    return NextResponse.json({
      today,
      arrivals: arrivalsSnap.docs.map(toRow),
      departures: departuresSnap.docs.map(toRow),
      pendingCount: pendingSnap.size,
      last7DaysCount: recentSnap.size,
      monthRevenue,
      occupancy,
      anySeedData,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
