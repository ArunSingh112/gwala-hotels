import { NextResponse } from "next/server";
import { cancelBookingSchema } from "@/lib/schemas";
import {
  findBookingByCodeAndPhone,
  transitionBooking,
} from "@/lib/services/bookings";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

/**
 * Guest-initiated cancellation: identified by booking code + phone, no
 * account needed. Free and immediate — nothing has been paid. Releases the
 * stay's rooms in the same transaction as the status change.
 */
export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`cancel:${clientIp(request)}`, 5)) {
      return errorResponse(
        "rate_limited",
        "Too many attempts. Please wait a minute and try again.",
        429
      );
    }

    const parsed = cancelBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid request",
        400
      );
    }

    const found = await findBookingByCodeAndPhone(
      parsed.data.bookingCode,
      parsed.data.guestPhone
    );
    if (!found) {
      return errorResponse(
        "not_found",
        "No booking matches that code and phone number.",
        404
      );
    }

    const updated = await transitionBooking({
      bookingId: found.id,
      to: "cancelled",
      actor: "guest",
      cancelReason: parsed.data.reason ?? "Cancelled by guest",
    });

    return NextResponse.json({
      booking: { bookingCode: updated.bookingCode, status: updated.status },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
