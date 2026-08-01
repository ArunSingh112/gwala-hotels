import { z } from "zod";

// Input validation for the public API routes. The server's validation is the
// one that counts; the same schemas are reused client-side for instant
// feedback.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const availabilityQuerySchema = z.object({
  hotelId: z.string().min(1).nullable().optional(), // null/absent = any branch
  checkIn: isoDate,
  checkOut: isoDate,
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const createBookingSchema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1),
  checkIn: isoDate,
  checkOut: isoDate,
  rooms: z.number().int().min(1).max(10),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guestName: z.string().trim().min(2, "Please enter your name").max(100),
  guestPhone: z.string().min(1, "Please enter your phone number"),
  guestEmail: z
    .string()
    .trim()
    .email("That email doesn't look right")
    .optional()
    .or(z.literal("")),
  guestCity: z.string().trim().max(100).optional(),
  specialRequests: z.string().trim().max(1000).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const lookupBookingSchema = z.object({
  bookingCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^GW-[A-Z0-9]{6}$/, "Booking codes look like GW-4XK92B"),
  guestPhone: z.string().min(1),
});

export type LookupBookingInput = z.infer<typeof lookupBookingSchema>;

export const cancelBookingSchema = lookupBookingSchema.extend({
  reason: z.string().trim().max(500).optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
