import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/api/errors";
import { canActOnHotel } from "@/lib/roles";
import type { AdminUser } from "@/lib/types";

export interface AuthedAdmin {
  uid: string;
  user: AdminUser;
}

/**
 * The one auth check every /api/admin/* route runs: verify the Firebase ID
 * token from the Authorization header, load users/{uid}, reject inactive
 * users. Role scoping is then applied with requireHotelAccess.
 */
export async function requireAdmin(request: Request): Promise<AuthedAdmin> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    throw new ApiError("unauthorized", "Please sign in.", 401);
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.", 401);
  }

  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) {
    throw new ApiError("forbidden", "This account has no admin access.", 403);
  }
  const user = snap.data() as AdminUser;
  if (!user.active) {
    throw new ApiError("forbidden", "This account has been deactivated.", 403);
  }

  return { uid, user };
}

/**
 * Apply the role: owner acts anywhere, manager only on their own branch.
 * Logs refused attempts — the spec calls for a manager acting on another
 * branch to be logged.
 */
export function requireHotelAccess(admin: AuthedAdmin, hotelId: string): void {
  if (!canActOnHotel(admin.user, hotelId)) {
    console.warn(
      `403: ${admin.user.email} (${admin.user.role}, branch ${admin.user.hotelId ?? "-"}) attempted to act on ${hotelId}`
    );
    throw new ApiError(
      "forbidden",
      "You don't have access to this branch.",
      403
    );
  }
}

/** The branch filter a user is allowed to see: null = all (owner). */
export function allowedHotelId(admin: AuthedAdmin): string | null {
  return admin.user.role === "owner" ? null : admin.user.hotelId;
}
