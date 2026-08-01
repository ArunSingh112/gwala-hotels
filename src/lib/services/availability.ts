import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { expandNights, minFreeAcrossNights } from "@/lib/booking-math";
import type { Hotel, RoomType } from "@/lib/types";

export interface RoomTypeAvailability {
  hotelId: string;
  hotelName: string;
  hotelSlug: string;
  roomTypeId: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  images: string[];
  /** Rooms bookable for the whole stay: min free across every night. */
  freeRooms: number;
  /** Whether one room of this type can seat the party. */
  fitsParty: boolean;
}

const availabilityDocId = (hotelId: string, roomTypeId: string, date: string) =>
  `${hotelId}_${roomTypeId}_${date}`;

/**
 * For each active room type of the given branches, the minimum free count
 * across every night of the stay. A missing availability doc means zero
 * rooms taken — they are created lazily by the booking transaction.
 */
export async function queryAvailability(params: {
  hotelId?: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): Promise<RoomTypeAvailability[]> {
  const db = adminDb();
  const nights = expandNights(params.checkIn, params.checkOut);

  let hotelsQuery = db.collection("hotels").where("active", "==", true);
  if (params.hotelId) {
    hotelsQuery = hotelsQuery.where("slug", "==", params.hotelId);
  }
  const hotelsSnap = await hotelsQuery.get();

  const results: RoomTypeAvailability[] = [];

  for (const hotelDoc of hotelsSnap.docs) {
    const hotel = hotelDoc.data() as Hotel;
    const roomTypesSnap = await hotelDoc.ref
      .collection("roomTypes")
      .where("active", "==", true)
      .get();

    for (const rtDoc of roomTypesSnap.docs) {
      const rt = rtDoc.data() as RoomType;

      // Read every night's availability doc for this room type in one batch.
      const refs = nights.map((date) =>
        db
          .collection("availability")
          .doc(availabilityDocId(hotelDoc.id, rtDoc.id, date))
      );
      const snaps = await db.getAll(...refs);
      const bookedPerNight = snaps.map((s) =>
        s.exists ? (s.data()?.roomsBooked as number) ?? 0 : 0
      );

      results.push({
        hotelId: hotelDoc.id,
        hotelName: hotel.name,
        hotelSlug: hotel.slug,
        roomTypeId: rtDoc.id,
        name: rt.name,
        description: rt.description,
        pricePerNight: rt.pricePerNight,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        amenities: rt.amenities,
        images: rt.images,
        freeRooms: minFreeAcrossNights(rt.totalRooms, bookedPerNight),
        fitsParty:
          rt.maxAdults >= params.adults && rt.maxChildren >= params.children,
      });
    }
  }

  // Cheapest first within each hotel; hotels in their configured order.
  results.sort((a, b) =>
    a.hotelId === b.hotelId
      ? a.pricePerNight - b.pricePerNight
      : a.hotelName.localeCompare(b.hotelName)
  );
  return results;
}
