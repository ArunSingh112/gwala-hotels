import { NextResponse } from "next/server";
import { availabilityQuerySchema } from "@/lib/schemas";
import { validateStayDates } from "@/lib/booking-math";
import { queryAvailability } from "@/lib/services/availability";
import { todayInIndia } from "@/lib/services/bookings";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`availability:${clientIp(request)}`, 30)) {
      return errorResponse(
        "rate_limited",
        "Too many searches. Please wait a minute and try again.",
        429
      );
    }

    const parsed = availabilityQuerySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid search",
        400
      );
    }

    const { checkIn, checkOut } = parsed.data;
    const dates = validateStayDates(checkIn, checkOut, todayInIndia());
    if (!dates.ok) {
      return errorResponse("invalid_input", dates.error, 400);
    }

    const results = await queryAvailability(parsed.data);
    return NextResponse.json({ results });
  } catch (err) {
    return handleApiError(err);
  }
}
