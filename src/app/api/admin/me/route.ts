import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

/** The signed-in admin's own profile — used by the client auth context. */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    return NextResponse.json({
      profile: {
        uid: admin.uid,
        email: admin.user.email,
        name: admin.user.name,
        role: admin.user.role,
        hotelId: admin.user.hotelId,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
