import { NextResponse } from "next/server";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/api/auth";
import { errorResponse, handleApiError, ApiError } from "@/lib/api/errors";
import type { AdminUser } from "@/lib/types";

function requireOwner(admin: Awaited<ReturnType<typeof requireAdmin>>) {
  if (admin.user.role !== "owner") {
    throw new ApiError("forbidden", "Only the owner can manage users.", 403);
  }
}

/** GET /api/admin/users — owner only: every admin account. */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    requireOwner(admin);

    const snap = await adminDb().collection("users").get();
    const users = snap.docs.map((d) => {
      const u = d.data() as AdminUser;
      return {
        uid: d.id,
        email: u.email,
        name: u.name,
        role: u.role,
        hotelId: u.hotelId,
        active: u.active,
      };
    });
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

const createManagerSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  hotelId: z.string().min(1),
});

/**
 * POST /api/admin/users — owner only: create a manager. Creates the Auth
 * user with the Admin SDK and writes users/{uid} in the same request.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    requireOwner(admin);

    const parsed = createManagerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Invalid manager details",
        400
      );
    }

    const hotelSnap = await adminDb()
      .collection("hotels")
      .doc(parsed.data.hotelId)
      .get();
    if (!hotelSnap.exists) {
      return errorResponse("not_found", "That branch was not found.", 404);
    }

    let uid: string;
    try {
      const created = await adminAuth().createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.name,
      });
      uid = created.uid;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        return errorResponse(
          "invalid_input",
          "An account with that email already exists.",
          409
        );
      }
      throw e;
    }

    await adminDb().collection("users").doc(uid).set({
      email: parsed.data.email,
      name: parsed.data.name,
      role: "manager",
      hotelId: parsed.data.hotelId,
      active: true,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ uid }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
