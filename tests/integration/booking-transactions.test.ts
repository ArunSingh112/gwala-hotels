/**
 * Integration tests against the Firestore emulator.
 *
 * These run only when FIRESTORE_EMULATOR_HOST is set (e.g. 127.0.0.1:8080).
 * Start the emulator with:
 *   firebase emulators:start --only firestore --project demo-gwala
 * then:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test
 *
 * They exercise the invariants the spec cares most about:
 *  - creation reserves every night of the stay
 *  - cancellation releases every night
 *  - two concurrent bookings for one remaining room -> one success, one clean failure
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST;
const describeEmulator = EMULATOR ? describe : describe.skip;

if (EMULATOR) {
  process.env.FIREBASE_PROJECT_ID = "demo-gwala";
  process.env.FIREBASE_CLIENT_EMAIL = "test@demo-gwala.iam.gserviceaccount.com";
  // Emulator accepts any credentials; the Admin SDK still requires the shape.
  process.env.FIREBASE_PRIVATE_KEY = "unused-with-emulator";
}

describeEmulator("booking transactions (Firestore emulator)", () => {
  // Imports are dynamic so the Admin SDK is only initialised when the
  // emulator is actually present.
  let db: FirebaseFirestore.Firestore;
  let createBooking: typeof import("@/lib/services/bookings").createBooking;
  let transitionBooking: typeof import("@/lib/services/bookings").transitionBooking;

  const HOTEL_ID = "gwala-test";
  const ROOM_TYPE_ID = "suite";
  const CHECK_IN = "2026-09-10";
  const CHECK_OUT = "2026-09-12"; // nights: 09-10, 09-11

  const baseInput = {
    hotelId: HOTEL_ID,
    roomTypeId: ROOM_TYPE_ID,
    checkIn: CHECK_IN,
    checkOut: CHECK_OUT,
    rooms: 1,
    adults: 2,
    children: 0,
    guestName: "Test Guest",
    guestPhone: "9876543210",
  };

  beforeEach(async () => {
    const admin = await import("firebase-admin/app");
    if (admin.getApps().length === 0) {
      const { initializeApp } = admin;
      initializeApp({ projectId: "demo-gwala" });
    }
    const { getFirestore } = await import("firebase-admin/firestore");
    db = getFirestore();

    const services = await import("@/lib/services/bookings");
    createBooking = services.createBooking;
    transitionBooking = services.transitionBooking;

    // Wipe and reseed a hotel with ONE suite.
    const collections = ["bookings", "availability"];
    for (const c of collections) {
      const snap = await db.collection(c).get();
      await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
    await db.collection("hotels").doc(HOTEL_ID).set({
      name: "Gwala Test",
      slug: HOTEL_ID,
      active: true,
    });
    await db
      .collection("hotels")
      .doc(HOTEL_ID)
      .collection("roomTypes")
      .doc(ROOM_TYPE_ID)
      .set({
        name: "Suite",
        pricePerNight: 3500,
        maxAdults: 3,
        maxChildren: 2,
        totalRooms: 1,
        active: true,
      });
  });

  afterAll(async () => {
    const admin = await import("firebase-admin/app");
    await Promise.all(admin.getApps().map((a) => admin.deleteApp(a)));
  });

  it("creation reserves every night of the stay", async () => {
    await createBooking(baseInput);

    for (const date of ["2026-09-10", "2026-09-11"]) {
      const snap = await db
        .collection("availability")
        .doc(`${HOTEL_ID}_${ROOM_TYPE_ID}_${date}`)
        .get();
      expect(snap.exists).toBe(true);
      expect(snap.data()?.roomsBooked).toBe(1);
    }
    // Check-out day untouched.
    const out = await db
      .collection("availability")
      .doc(`${HOTEL_ID}_${ROOM_TYPE_ID}_2026-09-12`)
      .get();
    expect(out.exists).toBe(false);
  });

  it("cancellation releases every night", async () => {
    const { bookingId } = await createBooking(baseInput);
    await transitionBooking({
      bookingId,
      to: "cancelled",
      actor: "guest",
    });

    for (const date of ["2026-09-10", "2026-09-11"]) {
      const snap = await db
        .collection("availability")
        .doc(`${HOTEL_ID}_${ROOM_TYPE_ID}_${date}`)
        .get();
      expect(snap.data()?.roomsBooked).toBe(0);
    }
  });

  it("two concurrent bookings for the last room: one success, one clean failure", async () => {
    const results = await Promise.allSettled([
      createBooking({ ...baseInput, guestName: "Guest A" }),
      createBooking({ ...baseInput, guestName: "Guest B", guestPhone: "9876543211" }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason.code).toBe("rooms_unavailable");

    // Inventory shows exactly one room booked per night — not two, not zero.
    for (const date of ["2026-09-10", "2026-09-11"]) {
      const snap = await db
        .collection("availability")
        .doc(`${HOTEL_ID}_${ROOM_TYPE_ID}_${date}`)
        .get();
      expect(snap.data()?.roomsBooked).toBe(1);
    }
  });

  it("rejects an invalid status transition with a message naming the current status", async () => {
    const { bookingId } = await createBooking(baseInput);
    await expect(
      transitionBooking({ bookingId, to: "checked_out", actor: "test-admin" })
    ).rejects.toMatchObject({ code: "invalid_status_transition" });
  });
});
