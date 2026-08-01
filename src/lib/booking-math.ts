// Pure arithmetic for stays, nights and prices. No Firestore here — these
// functions are the unit-testable core the booking transaction builds on.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse "YYYY-MM-DD" as UTC midnight; null if malformed or not a real date. */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject impossible dates like 2026-02-30, which Date silently rolls over.
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The nights a stay occupies: check-in up to but not including check-out.
 * A 14th–16th booking touches the 14th and 15th only.
 */
export function expandNights(checkIn: string, checkOut: string): string[] {
  const start = parseIsoDate(checkIn);
  const end = parseIsoDate(checkOut);
  if (!start || !end) throw new Error("Invalid date");
  if (end <= start) throw new Error("Check-out must be after check-in");

  const nights: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(toIso(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

/** Free rooms on one night. Clamped at zero so bad data cannot go negative. */
export function freeRooms(totalRooms: number, roomsBooked: number): number {
  return Math.max(0, totalRooms - roomsBooked);
}

/**
 * The number of rooms offerable for a whole stay: the minimum free count
 * across every night. A room type is offerable only if free on ALL nights.
 */
export function minFreeAcrossNights(
  totalRooms: number,
  roomsBookedPerNight: number[]
): number {
  return roomsBookedPerNight.reduce(
    (min, booked) => Math.min(min, freeRooms(totalRooms, booked)),
    totalRooms
  );
}

/** Whole rupees: price per night x rooms x nights. */
export function calculateTotal(
  pricePerNight: number,
  rooms: number,
  nights: number
): number {
  return pricePerNight * rooms * nights;
}

export type DateValidation = { ok: true } | { ok: false; error: string };

/**
 * Stay-date rules from the spec: check-out after check-in, no past dates,
 * nothing more than 12 months ahead. `today` is "YYYY-MM-DD" so callers (and
 * tests) control the clock.
 */
export function validateStayDates(
  checkIn: string,
  checkOut: string,
  today: string
): DateValidation {
  const inDate = parseIsoDate(checkIn);
  const outDate = parseIsoDate(checkOut);
  const todayDate = parseIsoDate(today);
  if (!inDate || !outDate || !todayDate) {
    return { ok: false, error: "Dates must be in YYYY-MM-DD format" };
  }
  if (outDate <= inDate) {
    return { ok: false, error: "Check-out must be after check-in" };
  }
  if (inDate < todayDate) {
    return { ok: false, error: "Check-in cannot be in the past" };
  }
  const maxAhead = new Date(todayDate);
  maxAhead.setUTCFullYear(maxAhead.getUTCFullYear() + 1);
  if (inDate > maxAhead) {
    return {
      ok: false,
      error: "Bookings open up to 12 months ahead",
    };
  }
  return { ok: true };
}
