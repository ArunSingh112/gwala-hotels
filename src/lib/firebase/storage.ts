import "server-only";
import { randomUUID } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { adminDb } from "@/lib/firebase/admin"; // ensures app is initialised
import { ApiError } from "@/lib/api/errors";

// Firebase Storage via the Admin SDK. Download URLs use the classic
// firebasestorage.googleapis.com token format so they work regardless of
// bucket ACL configuration.

export function storageBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ??
    `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
  );
}

function bucket() {
  adminDb(); // touch the app so getStorage() finds it
  return getStorage().bucket(storageBucketName());
}

/**
 * Upload an already-processed JPEG buffer. Returns its public download URL.
 * Throws ApiError photo_storage_unavailable when the bucket doesn't exist
 * (Storage not enabled in the Firebase console yet).
 */
export async function uploadPhoto(
  objectPath: string,
  jpeg: Buffer
): Promise<string> {
  const token = randomUUID();
  const file = bucket().file(objectPath);
  try {
    await file.save(jpeg, {
      contentType: "image/jpeg",
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/does not exist|notFound|404/i.test(msg)) {
      throw new ApiError(
        "photo_storage_unavailable",
        "Photo storage is not set up yet. Enable Storage in the Firebase console (requires the Blaze plan), then try again.",
        503
      );
    }
    throw err;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucketName()}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

/** Delete an object; missing objects are ignored (idempotent delete). */
export async function deletePhoto(objectPath: string): Promise<void> {
  try {
    await bucket().file(objectPath).delete();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/does not exist|notFound|404/i.test(msg)) return;
    throw err;
  }
}
