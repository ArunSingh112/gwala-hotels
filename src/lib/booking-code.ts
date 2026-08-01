import { randomInt } from "node:crypto";

// Booking codes look like GW-4XK92B: short enough to read over the phone,
// unguessable enough that the code alone does not expose a booking (lookup
// additionally requires the guest's phone number).
//
// The alphabet omits 0/O and 1/I/L so a code survives being read aloud or
// scrawled on paper at a front desk.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 6;

export const BOOKING_CODE_PATTERN = /^GW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function generateBookingCode(): string {
  let suffix = "";
  for (let i = 0; i < LENGTH; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `GW-${suffix}`;
}
