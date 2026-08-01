import { NextResponse } from "next/server";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, handleApiError } from "@/lib/api/errors";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

const reviewSchema = z.object({
  hotelId: z.string().min(1),
  guestName: z.string().trim().min(2).max(80),
  bookingCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^GW-[A-Z0-9]{6}$/)
    .optional()
    .or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(100),
  text: z.string().trim().min(10).max(2000),
});

/**
 * POST /api/reviews — public review submission. Lands as "pending"; only
 * approved reviews are ever publicly readable. If a booking code is given
 * and matches a real booking for this hotel, the review is marked so the
 * panel can show "verified stay".
 */
export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`reviews:${clientIp(request)}`, 3)) {
      return errorResponse(
        "rate_limited",
        "Too many reviews. Please wait a minute and try again.",
        429
      );
    }

    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid review",
        400
      );
    }

    const db = adminDb();
    const hotelSnap = await db
      .collection("hotels")
      .doc(parsed.data.hotelId)
      .get();
    if (!hotelSnap.exists) {
      return errorResponse("not_found", "That branch was not found.", 404);
    }

    // Keep the code only when it matches a real booking at this branch.
    let bookingCode: string | undefined;
    if (parsed.data.bookingCode) {
      const match = await db
        .collection("bookings")
        .where("bookingCode", "==", parsed.data.bookingCode)
        .where("hotelId", "==", parsed.data.hotelId)
        .limit(1)
        .get();
      if (!match.empty) bookingCode = parsed.data.bookingCode;
    }

    await db.collection("reviews").add({
      hotelId: parsed.data.hotelId,
      guestName: parsed.data.guestName,
      ...(bookingCode ? { bookingCode } : {}),
      rating: parsed.data.rating,
      title: parsed.data.title,
      text: parsed.data.text,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
