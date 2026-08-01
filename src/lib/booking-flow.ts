// Client-side helpers for the booking flow: shared types and the
// sessionStorage hand-off between the booking form and the confirmation
// page (so the confirmation can render without an extra lookup call).

export interface AvailabilityResult {
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
  freeRooms: number;
  fitsParty: boolean;
}

export interface ConfirmationData {
  bookingCode: string;
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string; // wa.me digits
  hotelDisplayPhone: string;
  checkInTime: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  totalAmount: number;
  guestName: string;
}

const KEY_PREFIX = "gwala-confirmation:";

export function storeConfirmation(data: ConfirmationData): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + data.bookingCode, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — the confirmation page falls back to lookup.
  }
}

export function readConfirmation(code: string): ConfirmationData | null {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + code);
    return raw ? (JSON.parse(raw) as ConfirmationData) : null;
  } catch {
    return null;
  }
}

/** The pre-filled WhatsApp message for a confirmed booking request. */
export function whatsappBookingMessage(d: ConfirmationData): string {
  return [
    `Namaste! I just made a booking request on the Gwala Hotels website.`,
    ``,
    `Booking code: ${d.bookingCode}`,
    `Name: ${d.guestName}`,
    `Hotel: ${d.hotelName}`,
    `Room: ${d.rooms} x ${d.roomTypeName}`,
    `Check-in: ${d.checkIn} (from ${d.checkInTime})`,
    `Check-out: ${d.checkOut}`,
    `Guests: ${d.adults} adult(s)${d.children ? `, ${d.children} child(ren)` : ""}`,
    `Amount payable at hotel: Rs ${d.totalAmount.toLocaleString("en-IN")}`,
  ].join("\n");
}

export function formatDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
