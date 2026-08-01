import type { AdminUser } from "./types";

/**
 * The one role check used by every admin route: an active owner may act on
 * any branch; an active manager only where the target's hotelId is their own.
 */
export function canActOnHotel(user: AdminUser, hotelId: string): boolean {
  if (!user.active) return false;
  if (user.role === "owner") return true;
  return user.role === "manager" && user.hotelId === hotelId;
}
