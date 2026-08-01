import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  calculateTotal,
  expandNights,
  validateStayDates,
} from "@/lib/booking-math";
import { generateBookingCode } from "@/lib/booking-code";
import {
  canTransition,
  transitionReleasesRooms,
} from "@/lib/booking-status";
import { normalisePhone } from "@/lib/phone";
import { ApiError } from "@/lib/api/errors";
import type { Booking, BookingStatus, Hotel, RoomType } from "@/lib/types";
import type { CreateBookingInput } from "@/lib/schemas";

const availabilityDocId = (hotelId: string, roomTypeId: string, date: string) =>
  `${hotelId}_${roomTypeId}_${date}`;

/** Today in IST — the hotel's clock, not the server's UTC clock. */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/** Generate a code not already in use; regenerate on collision, three tries. */
async function uniqueBookingCode(
  db: FirebaseFirestore.Firestore
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateBookingCode();
    const clash = await db
      .collection("bookings")
      .where("bookingCode", "==", code)
      .limit(1)
      .get();
    if (clash.empty) return code;
  }
  throw new ApiError(
    "internal",
    "Could not allocate a booking code. Please try again.",
    500
  );
}

/**
 * Create a booking in one Firestore transaction: re-read every night's
 * availability, abort if any night lacks the rooms, increment roomsBooked on
 * each night, write the booking as pending. The re-read inside the
 * transaction is what makes the earlier search answer safe to act on.
 */
export async function createBooking(input: CreateBookingInput): Promise<{
  bookingId: string;
  bookingCode: string;
}> {
  const db = adminDb();

  const dates = validateStayDates(input.checkIn, input.checkOut, todayInIndia());
  if (!dates.ok) throw new ApiError("invalid_input", dates.error, 400);

  const guestPhone = normalisePhone(input.guestPhone);
  if (!guestPhone) {
    throw new ApiError(
      "invalid_input",
      "That doesn't look like an Indian mobile number. Use 10 digits starting 6-9, e.g. 98765 43210.",
      400
    );
  }

  const hotelRef = db.collection("hotels").doc(input.hotelId);
  const roomTypeRef = hotelRef.collection("roomTypes").doc(input.roomTypeId);

  const [hotelSnap, roomTypeSnap] = await Promise.all([
    hotelRef.get(),
    roomTypeRef.get(),
  ]);
  if (!hotelSnap.exists || !(hotelSnap.data() as Hotel).active) {
    throw new ApiError("not_found", "That branch was not found.", 404);
  }
  if (!roomTypeSnap.exists || !(roomTypeSnap.data() as RoomType).active) {
    throw new ApiError("not_found", "That room type was not found.", 404);
  }
  const hotel = hotelSnap.data() as Hotel;
  const roomType = roomTypeSnap.data() as RoomType;

  // Capacity: the party must fit in the rooms requested.
  if (
    input.adults > roomType.maxAdults * input.rooms ||
    input.children > roomType.maxChildren * input.rooms
  ) {
    throw new ApiError(
      "invalid_input",
      `${input.rooms} ${roomType.name} room(s) seat up to ${
        roomType.maxAdults * input.rooms
      } adults and ${roomType.maxChildren * input.rooms} children.`,
      400
    );
  }

  const nights = expandNights(input.checkIn, input.checkOut);
  const bookingCode = await uniqueBookingCode(db);
  const bookingRef = db.collection("bookings").doc();

  await db.runTransaction(async (tx) => {
    // Re-read availability inside the transaction — the atomic check that
    // makes two guests racing for the last room produce exactly one success.
    const availRefs = nights.map((date) =>
      db
        .collection("availability")
        .doc(availabilityDocId(input.hotelId, input.roomTypeId, date))
    );
    const availSnaps = await tx.getAll(...availRefs);

    for (let i = 0; i < nights.length; i++) {
      const booked = availSnaps[i].exists
        ? ((availSnaps[i].data()?.roomsBooked as number) ?? 0)
        : 0;
      if (booked + input.rooms > roomType.totalRooms) {
        throw new ApiError(
          "rooms_unavailable",
          "Those rooms were just booked by someone else. Please search again.",
          409
        );
      }
    }

    for (let i = 0; i < nights.length; i++) {
      if (availSnaps[i].exists) {
        tx.update(availRefs[i], {
          roomsBooked: FieldValue.increment(input.rooms),
        });
      } else {
        tx.set(availRefs[i], {
          hotelId: input.hotelId,
          roomTypeId: input.roomTypeId,
          date: nights[i],
          roomsBooked: input.rooms,
        });
      }
    }

    const booking: Booking = {
      bookingCode,
      hotelId: input.hotelId,
      hotelName: hotel.name,
      roomTypeId: input.roomTypeId,
      roomTypeName: roomType.name,
      guestName: input.guestName,
      guestPhone,
      ...(input.guestEmail ? { guestEmail: input.guestEmail } : {}),
      ...(input.guestCity ? { guestCity: input.guestCity } : {}),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: nights.length,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      pricePerNight: roomType.pricePerNight,
      totalAmount: calculateTotal(
        roomType.pricePerNight,
        input.rooms,
        nights.length
      ),
      paymentMode: "pay_at_hotel",
      status: "pending",
      ...(input.specialRequests
        ? { specialRequests: input.specialRequests }
        : {}),
      source: "website",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: "guest",
    };
    tx.set(bookingRef, booking);
  });

  return { bookingId: bookingRef.id, bookingCode };
}

/** Find a booking by code + the phone used to make it. Both must match. */
export async function findBookingByCodeAndPhone(
  bookingCode: string,
  rawPhone: string
): Promise<{ id: string; booking: Booking } | null> {
  const guestPhone = normalisePhone(rawPhone);
  if (!guestPhone) return null;

  const snap = await adminDb()
    .collection("bookings")
    .where("bookingCode", "==", bookingCode.toUpperCase())
    .where("guestPhone", "==", guestPhone)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, booking: snap.docs[0].data() as Booking };
}

/**
 * Transition a booking's status, releasing rooms when the transition calls
 * for it — all in one transaction so inventory and status cannot diverge.
 * `actor` is an admin uid, or "guest" for guest-initiated cancellation.
 */
export async function transitionBooking(params: {
  bookingId: string;
  to: BookingStatus;
  actor: string;
  cancelReason?: string;
}): Promise<Booking> {
  const db = adminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) {
      throw new ApiError("not_found", "Booking not found.", 404);
    }
    const booking = snap.data() as Booking;

    if (!canTransition(booking.status, params.to)) {
      throw new ApiError(
        "invalid_status_transition",
        `This booking is ${booking.status.replace("_", " ")} and cannot move to ${params.to.replace("_", " ")}.`,
        409
      );
    }

    if (transitionReleasesRooms(booking.status, params.to)) {
      // Release every night of the stay.
      const nights = expandNights(booking.checkIn, booking.checkOut);
      const availRefs = nights.map((date) =>
        db
          .collection("availability")
          .doc(availabilityDocId(booking.hotelId, booking.roomTypeId, date))
      );
      const availSnaps = await tx.getAll(...availRefs);
      for (let i = 0; i < availRefs.length; i++) {
        if (availSnaps[i].exists) {
          const current = (availSnaps[i].data()?.roomsBooked as number) ?? 0;
          tx.update(availRefs[i], {
            roomsBooked: Math.max(0, current - booking.rooms),
          });
        }
      }
    }

    const update: Record<string, unknown> = {
      status: params.to,
      updatedAt: Timestamp.now(),
      updatedBy: params.actor,
    };
    if (params.to === "cancelled") {
      update.cancelledAt = Timestamp.now();
      if (params.cancelReason) update.cancelReason = params.cancelReason;
    }
    tx.update(bookingRef, update);

    return { ...booking, ...update } as Booking;
  });
}
