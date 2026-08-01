import { NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/schemas";
import { createBooking } from "@/lib/services/bookings";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`bookings:${clientIp(request)}`, 5)) {
      return errorResponse(
        "rate_limited",
        "Too many booking attempts. Please wait a minute and try again.",
        429
      );
    }

    const parsed = createBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid booking details",
        400
      );
    }

    const { bookingId, bookingCode } = await createBooking(parsed.data);
    return NextResponse.json({ bookingId, bookingCode }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
