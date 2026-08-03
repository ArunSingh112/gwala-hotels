import { NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { adminDb } from "@/lib/firebase/admin";
import { deletePhoto, storageBucketName, uploadPhoto } from "@/lib/firebase/storage";
import { requireAdmin, requireHotelAccess } from "@/lib/api/auth";
import { ApiError, errorResponse, handleApiError } from "@/lib/api/errors";
import {
  appendPhoto,
  isOwnStorageUrl,
  isPermutation,
  removePhoto,
  storagePathFromUrl,
} from "@/lib/photos";

export const runtime = "nodejs"; // sharp needs Node, not Edge

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** The Firestore doc + field a request targets. */
function targetRef(hotelId: string, roomTypeId: string | null) {
  const db = adminDb();
  return roomTypeId
    ? {
        ref: db
          .collection("hotels")
          .doc(hotelId)
          .collection("roomTypes")
          .doc(roomTypeId),
        field: "images" as const,
      }
    : { ref: db.collection("hotels").doc(hotelId), field: "gallery" as const };
}

/** Run an array mutation in a transaction; returns the new array. */
async function mutatePhotos(
  hotelId: string,
  roomTypeId: string | null,
  mutate: (current: string[]) => string[]
): Promise<string[]> {
  const { ref, field } = targetRef(hotelId, roomTypeId);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new ApiError("not_found", "Branch or room type not found.", 404);
    }
    const current = (snap.data()?.[field] ?? []) as string[];
    const next = mutate(current);
    const update: Record<string, unknown> = { [field]: next };
    if (field === "gallery") update.heroImage = next[0] ?? "";
    tx.update(ref, update);
    return next;
  });
}

/** POST — multipart form: file, hotelId, roomTypeId? */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const form = await request.formData();
    const hotelId = String(form.get("hotelId") ?? "");
    const roomTypeId = form.get("roomTypeId") ? String(form.get("roomTypeId")) : null;
    const file = form.get("file");

    if (!hotelId || !(file instanceof File)) {
      return errorResponse("invalid_input", "hotelId and file are required.", 400);
    }
    requireHotelAccess(admin, hotelId);

    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse("invalid_input", "Photo is larger than 10 MB.", 400);
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      const hint = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
        ? " iPhone HEIC photos aren't supported — set Camera → Formats to “Most Compatible”, or share the photo via WhatsApp first."
        : "";
      return errorResponse(
        "invalid_input",
        `Only JPEG, PNG or WebP photos are accepted.${hint}`,
        400
      );
    }

    // Re-encode: EXIF rotation applied, max width 1600, JPEG q82.
    const input = Buffer.from(await file.arrayBuffer());
    let jpeg: Buffer;
    try {
      jpeg = await sharp(input)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer();
    } catch {
      return errorResponse(
        "invalid_input",
        "That file could not be read as an image.",
        400
      );
    }

    const objectPath = roomTypeId
      ? `hotels/${hotelId}/rooms/${roomTypeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
      : `hotels/${hotelId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const url = await uploadPhoto(objectPath, jpeg);

    try {
      const photos = await mutatePhotos(hotelId, roomTypeId, (cur) =>
        appendPhoto(cur, url)
      );
      return NextResponse.json({ photos });
    } catch (err) {
      // Firestore mutation failed after upload — clean up the orphan object.
      await deletePhoto(objectPath).catch(() => {});
      if (err instanceof Error && !(err instanceof ApiError)) {
        return errorResponse("invalid_input", err.message, 400);
      }
      throw err;
    }
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1).optional(),
  url: z.string().min(1),
});

/** DELETE — JSON {hotelId, roomTypeId?, url} */
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse("invalid_input", "hotelId and url are required.", 400);
    }
    const { hotelId, roomTypeId = null, url } = parsed.data;
    requireHotelAccess(admin, hotelId);

    let photos: string[];
    try {
      photos = await mutatePhotos(hotelId, roomTypeId, (cur) =>
        removePhoto(cur, url)
      );
    } catch (err) {
      if (err instanceof Error && !(err instanceof ApiError)) {
        return errorResponse("invalid_input", err.message, 400);
      }
      throw err;
    }

    // Only objects in our bucket are deletable files; repo paths just leave.
    const bucket = storageBucketName();
    if (isOwnStorageUrl(url, bucket)) {
      const path = storagePathFromUrl(url, bucket);
      if (path) await deletePhoto(path);
    }
    return NextResponse.json({ photos });
  } catch (err) {
    return handleApiError(err);
  }
}

const reorderSchema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1).optional(),
  urls: z.array(z.string().min(1)).max(30),
});

/** PATCH — JSON {hotelId, roomTypeId?, urls} (full reordered list) */
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const parsed = reorderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse("invalid_input", "hotelId and urls are required.", 400);
    }
    const { hotelId, roomTypeId = null, urls } = parsed.data;
    requireHotelAccess(admin, hotelId);

    const photos = await mutatePhotos(hotelId, roomTypeId, (cur) => {
      if (!isPermutation(cur, urls)) {
        throw new ApiError(
          "invalid_input",
          "The photo list changed while you were reordering. Refresh and try again.",
          409
        );
      }
      return urls;
    });
    return NextResponse.json({ photos });
  } catch (err) {
    return handleApiError(err);
  }
}
