import { NextResponse } from "next/server";
import { lookupBookingSchema } from "@/lib/schemas";
import { findBookingByCodeAndPhone } from "@/lib/services/bookings";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`lookup:${clientIp(request)}`, 10)) {
      return errorResponse(
        "rate_limited",
        "Too many lookups. Please wait a minute and try again.",
        429
      );
    }

    const parsed = lookupBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid lookup",
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

    // Serialise timestamps for the browser; never leak internal notes.
    const { internalNotes: _internal, ...booking } = found.booking;
    return NextResponse.json({
      booking: {
        ...booking,
        createdAt: null,
        updatedAt: null,
        cancelledAt: null,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
