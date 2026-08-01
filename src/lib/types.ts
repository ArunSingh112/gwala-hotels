// Firestore document shapes — the single source of truth for the data model.
// Mirrors docs/superpowers/specs/2026-08-01-gwala-hotels-booking-system-design.md.
// Timestamps are represented as ISO strings once serialised to the browser;
// on the server they are Firestore Timestamps.

export interface Hotel {
  name: string; // "Hotel Gwala Inn"
  slug: string; // "gwala-inn" — also the document id
  tagline: string;
  description: string;
  address: string;
  mapsUrl: string; // maps.app.goo.gl short link, for "Get directions"
  mapFtid: string; // Google place id for the keyless embed
  distances: Record<string, string>; // attraction slug -> "5 min walk"
  phone: string; // digits only for wa.me links: "917060189819"
  displayPhone: string; // "+91 70601 89819"
  email: string;
  amenities: string[];
  heroImage: string; // "/hotels/gwala-inn/hero.jpg"
  gallery: string[];
  checkInTime: string; // "12:00"
  checkOutTime: string; // "10:00"
  active: boolean;
  sortOrder: number;
}

export interface RoomType {
  name: string; // "Deluxe Double (AC)"
  description: string;
  pricePerNight: number; // whole rupees, integer
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  amenities: string[];
  images: string[];
  active: boolean;
  sortOrder: number;
  /** True while this document still carries seeded placeholder values.
   *  Cleared the first time an admin saves the room type; drives the
   *  "sample data" banner in the admin dashboard. */
  isSeedData?: boolean;
}

/** Doc id: `${hotelId}_${roomTypeId}_${date}`. Missing doc = zero booked. */
export interface AvailabilityDoc {
  hotelId: string;
  roomTypeId: string;
  date: string; // "2026-08-14"
  roomsBooked: number;
}

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Booking {
  bookingCode: string; // "GW-4XK92B"
  hotelId: string;
  hotelName: string; // denormalised for list rendering
  roomTypeId: string;
  roomTypeName: string;
  guestName: string;
  guestPhone: string; // E.164 without "+", e.g. "919876543210"
  guestEmail?: string;
  guestCity?: string;
  checkIn: string; // "2026-08-14"
  checkOut: string; // "2026-08-16"
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  pricePerNight: number; // captured at booking time
  totalAmount: number; // pricePerNight * rooms * nights
  paymentMode: "pay_at_hotel";
  status: BookingStatus;
  specialRequests?: string;
  internalNotes?: string;
  source: "website";
  createdAt: unknown; // Firestore Timestamp on server
  updatedAt: unknown;
  updatedBy: string; // uid, or "guest"
  cancelledAt?: unknown;
  cancelReason?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  hotelId: string;
  guestName: string;
  bookingCode?: string;
  rating: number; // 1-5
  title: string;
  text: string;
  status: ReviewStatus;
  createdAt: unknown;
  moderatedBy?: string;
}

export type UserRole = "owner" | "manager";

export interface AdminUser {
  email: string;
  name: string;
  role: UserRole;
  hotelId: string | null; // manager's branch; null for owner
  active: boolean;
  createdAt: unknown;
}
