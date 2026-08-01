import { z } from "zod";

// Shared between the room-types collection and item routes — route files may
// only export HTTP handlers, so the schema lives here.
export const roomTypeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000),
  pricePerNight: z.number().int().min(1).max(1_000_000),
  maxAdults: z.number().int().min(1).max(20),
  maxChildren: z.number().int().min(0).max(20),
  totalRooms: z.number().int().min(0).max(500),
  amenities: z.array(z.string().trim().min(1).max(60)).max(30),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});
