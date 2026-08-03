# Admin Photo Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owner/managers upload, delete and reorder branch-gallery and room-type photos from the admin panel; photos live in Firebase Storage and their URLs in the existing Firestore arrays.

**Architecture:** One new API route family (`/api/admin/photos`) does all mutations server-side with the Admin SDK (auth → validate → sharp re-encode → Storage upload → Firestore transaction). A new admin "Photos" screen drives it. The public site already reads `hotels.gallery` / `roomTypes.images`; we only add Storage hostnames to next/image and a small room-photo viewer.

**Tech Stack:** Next.js 15 route handlers (`request.formData()`), firebase-admin (Firestore + Storage), sharp (already a dependency), Zod, Vitest, existing admin auth-context pattern.

**Spec:** `docs/superpowers/specs/2026-08-03-admin-photo-management-design.md`

---

### Task 1: Pure photo-array helpers (TDD)

**Files:**
- Create: `src/lib/photos.ts`
- Test: `src/lib/photos.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/photos.test.ts
import { describe, expect, it } from "vitest";
import {
  appendPhoto,
  removePhoto,
  isPermutation,
  isOwnStorageUrl,
  MAX_PHOTOS,
} from "./photos";

describe("appendPhoto", () => {
  it("appends a url to the end", () => {
    expect(appendPhoto(["a"], "b")).toEqual(["a", "b"]);
  });
  it("refuses duplicates", () => {
    expect(() => appendPhoto(["a"], "a")).toThrow(/already/i);
  });
  it("refuses beyond MAX_PHOTOS", () => {
    const full = Array.from({ length: MAX_PHOTOS }, (_, i) => `p${i}`);
    expect(() => appendPhoto(full, "extra")).toThrow(/maximum/i);
  });
});

describe("removePhoto", () => {
  it("removes the url", () => {
    expect(removePhoto(["a", "b"], "a")).toEqual(["b"]);
  });
  it("throws when the url is absent", () => {
    expect(() => removePhoto(["a"], "x")).toThrow(/not found/i);
  });
});

describe("isPermutation", () => {
  it("true for same items reordered", () => {
    expect(isPermutation(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });
  it("false when lengths differ", () => {
    expect(isPermutation(["a"], ["a", "a"])).toBe(false);
  });
  it("false when items differ", () => {
    expect(isPermutation(["a", "b"], ["a", "x"])).toBe(false);
  });
});

describe("isOwnStorageUrl", () => {
  const bucket = "arunhotels-e4da4.firebasestorage.app";
  it("true for our firebasestorage download url", () => {
    expect(
      isOwnStorageUrl(
        `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/hotels%2Fgwala-inn%2F1.jpg?alt=media&token=t`,
        bucket
      )
    ).toBe(true);
  });
  it("false for repo-local paths", () => {
    expect(isOwnStorageUrl("/hotels/gwala-inn/hero.jpg", bucket)).toBe(false);
  });
  it("false for other hosts", () => {
    expect(isOwnStorageUrl("https://example.com/x.jpg", bucket)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/photos.test.ts`
Expected: FAIL — `Cannot find module './photos'`

- [ ] **Step 3: Implement the helpers**

```ts
// src/lib/photos.ts
// Pure helpers for gallery/images array mutations. Kept free of Firebase
// imports so they are unit-testable.

export const MAX_PHOTOS = 20;

export function appendPhoto(current: string[], url: string): string[] {
  if (current.includes(url)) {
    throw new Error("This photo is already in the list.");
  }
  if (current.length >= MAX_PHOTOS) {
    throw new Error(`Maximum of ${MAX_PHOTOS} photos reached. Delete one first.`);
  }
  return [...current, url];
}

export function removePhoto(current: string[], url: string): string[] {
  if (!current.includes(url)) {
    throw new Error("Photo not found in the list.");
  }
  return current.filter((u) => u !== url);
}

/** True when b contains exactly the same items as a (any order). */
export function isPermutation(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const count = new Map<string, number>();
  for (const x of a) count.set(x, (count.get(x) ?? 0) + 1);
  for (const x of b) {
    const c = count.get(x);
    if (!c) return false;
    count.set(x, c - 1);
  }
  return true;
}

/** True when the url points at an object in our Storage bucket. */
export function isOwnStorageUrl(url: string, bucket: string): boolean {
  return url.startsWith(
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`
  );
}

/** Extract the Storage object path from one of our download urls. */
export function storagePathFromUrl(url: string, bucket: string): string | null {
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`;
  if (!url.startsWith(prefix)) return null;
  const encoded = url.slice(prefix.length).split("?")[0];
  return decodeURIComponent(encoded);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/photos.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/photos.ts src/lib/photos.test.ts
git commit -m "Add pure photo-array helpers for gallery management"
```

---

### Task 2: Storage helper and new error code

**Files:**
- Modify: `src/lib/api/errors.ts:6-14` (add error code)
- Create: `src/lib/firebase/storage.ts`

- [ ] **Step 1: Add `photo_storage_unavailable` to the error-code union**

In `src/lib/api/errors.ts` change:

```ts
export type ApiErrorCode =
  | "invalid_input"
  | "not_found"
  | "rooms_unavailable"
  | "invalid_status_transition"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "photo_storage_unavailable"
  | "internal";
```

- [ ] **Step 2: Create the Storage helper**

```ts
// src/lib/firebase/storage.ts
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (clean)

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/errors.ts src/lib/firebase/storage.ts
git commit -m "Add Firebase Storage helper and photo_storage_unavailable error code"
```

---

### Task 3: `/api/admin/photos` route (POST upload, DELETE remove, PATCH reorder)

**Files:**
- Create: `src/app/api/admin/photos/route.ts`

The route works on either the branch gallery (`hotels/{id}.gallery`, keeping
`heroImage` = `gallery[0]` in sync) or a room type's images
(`hotels/{id}/roomTypes/{rtId}.images`) depending on whether `roomTypeId` is
sent. All Firestore mutations run in a transaction.

- [ ] **Step 1: Create the route**

```ts
// src/app/api/admin/photos/route.ts
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Smoke-test auth guard (server must be running: `npm run dev`)**

Run: `curl -s -X POST http://localhost:3000/api/admin/photos | head -c 200`
Expected: `{"error":{"code":"unauthorized","message":"Please sign in."}}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/photos/route.ts
git commit -m "Add /api/admin/photos: upload, delete, reorder for galleries and room photos"
```

---

### Task 4: Allow Storage images in next/image

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add remotePatterns**

```ts
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray lockfile exists in the user home directory; pin the tracing
  // root so Next.js doesn't infer the wrong workspace.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Type-check and commit**

Run: `npx tsc --noEmit` — expected clean.

```bash
git add next.config.ts
git commit -m "Allow Firebase Storage images in next/image"
```

---

### Task 5: Admin Photos screen

**Files:**
- Create: `src/components/admin/photos-screen.tsx`
- Create: `src/app/admin/photos/page.tsx`
- Modify: `src/components/admin/admin-chrome.tsx:8-16` (nav entry)

- [ ] **Step 1: Create the screen component**

```tsx
// src/components/admin/photos-screen.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface BranchOption {
  slug: string;
  name: string;
}
interface RoomTypeRow {
  id: string;
  name: string;
  images?: string[];
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp";

/** One photo grid (branch gallery or a room type) with its own uploader. */
function PhotoGrid({
  title,
  subtitle,
  photos,
  coverLabel,
  busy,
  onUpload,
  onDelete,
  onMove,
}: {
  title: string;
  subtitle?: string;
  photos: string[];
  coverLabel: boolean;
  busy: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (url: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-maroon-900">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-maroon-700">{subtitle}</p>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn-primary !min-h-10 !px-4 !py-2 text-sm"
        >
          {busy ? "Uploading…" : "+ Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) onUpload(files);
          }}
        />
      </div>

      {photos.length === 0 ? (
        <p className="mt-4 rounded-lg bg-cream-100 p-4 text-sm text-maroon-800">
          No photos yet — add the first one.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-lg border border-cream-200">
              <div className="relative aspect-[4/3] bg-cream-100">
                <Image src={url} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-cover" />
              </div>
              {coverLabel && i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-marigold-500 px-2 py-0.5 text-xs font-bold text-maroon-950">
                  Cover photo
                </span>
              )}
              <div className="flex items-center justify-between gap-1 bg-white p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={busy || i === 0}
                    onClick={() => onMove(i, -1)}
                    className="rounded px-2 py-0.5 text-sm font-bold text-maroon-800 hover:bg-cream-100 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={busy || i === photos.length - 1}
                    onClick={() => onMove(i, 1)}
                    className="rounded px-2 py-0.5 text-sm font-bold text-maroon-800 hover:bg-cream-100 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Delete this photo? This cannot be undone.")) {
                      onDelete(url);
                    }
                  }}
                  className="rounded px-2 py-0.5 text-sm font-bold text-maroon-700 hover:bg-marigold-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PhotosScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [hotelId, setHotelId] = useState(profile?.hotelId ?? "");
  const [gallery, setGallery] = useState<string[] | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null); // "gallery" | roomTypeId

  useEffect(() => {
    void authedFetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((body) => {
        const hs = (body.hotels ?? []).map(
          (h: { slug: string; name: string }) => ({ slug: h.slug, name: h.name })
        );
        setBranches(hs);
        setHotelId((prev) => prev || hs[0]?.slug || "");
      })
      .catch(() => {});
  }, [authedFetch]);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setGallery(null);
    setRoomTypes(null);
    setError(null);
    try {
      const [hotelsRes, rtRes] = await Promise.all([
        authedFetch("/api/admin/hotels"),
        authedFetch(`/api/admin/room-types?hotelId=${encodeURIComponent(hotelId)}`),
      ]);
      const hotelsBody = await hotelsRes.json();
      const rtBody = await rtRes.json();
      if (!hotelsRes.ok || !rtRes.ok) {
        setError("Failed to load photos. Refresh to try again.");
        return;
      }
      const hotel = (hotelsBody.hotels ?? []).find(
        (h: { slug: string; gallery?: string[] }) => h.slug === hotelId
      );
      setGallery(hotel?.gallery ?? []);
      setRoomTypes(
        (rtBody.roomTypes ?? []).map((rt: RoomTypeRow) => ({
          id: rt.id,
          name: rt.name,
          images: rt.images ?? [],
        }))
      );
    } catch {
      setError("Failed to load photos. Check your connection.");
    }
  }, [authedFetch, hotelId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Shared mutation runner: uploads sequentially, reports first error. */
  async function upload(roomTypeId: string | null, files: File[]) {
    setBusyKey(roomTypeId ?? "gallery");
    setError(null);
    try {
      for (const file of files) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setError(`${file.name}: larger than 10 MB — skipped.`);
          continue;
        }
        const form = new FormData();
        form.set("file", file);
        form.set("hotelId", hotelId);
        if (roomTypeId) form.set("roomTypeId", roomTypeId);
        const res = await authedFetch("/api/admin/photos", {
          method: "POST",
          body: form,
        });
        const body = await res.json();
        if (!res.ok) {
          setError(`${file.name}: ${body.error?.message ?? "upload failed."}`);
          continue;
        }
        applyPhotos(roomTypeId, body.photos as string[]);
      }
    } catch {
      setError("Network error during upload.");
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(roomTypeId: string | null, url: string) {
    setBusyKey(roomTypeId ?? "gallery");
    setError(null);
    try {
      const res = await authedFetch("/api/admin/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomTypeId: roomTypeId ?? undefined, url }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Delete failed.");
        return;
      }
      applyPhotos(roomTypeId, body.photos as string[]);
    } catch {
      setError("Network error — nothing was deleted.");
    } finally {
      setBusyKey(null);
    }
  }

  async function move(roomTypeId: string | null, index: number, dir: -1 | 1) {
    const current =
      roomTypeId === null
        ? gallery ?? []
        : roomTypes?.find((rt) => rt.id === roomTypeId)?.images ?? [];
    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);

    setBusyKey(roomTypeId ?? "gallery");
    setError(null);
    try {
      const res = await authedFetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          roomTypeId: roomTypeId ?? undefined,
          urls: next,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Reorder failed.");
        await load();
        return;
      }
      applyPhotos(roomTypeId, body.photos as string[]);
    } catch {
      setError("Network error — order unchanged.");
    } finally {
      setBusyKey(null);
    }
  }

  function applyPhotos(roomTypeId: string | null, photos: string[]) {
    if (roomTypeId === null) {
      setGallery(photos);
    } else {
      setRoomTypes((rts) =>
        (rts ?? []).map((rt) =>
          rt.id === roomTypeId ? { ...rt, images: photos } : rt
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          Photos
        </h1>
        {profile?.role === "owner" && (
          <select
            aria-label="Branch"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            className="field-input !w-auto"
          >
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-maroon-700">
        JPEG, PNG or WebP, up to 10 MB each. Photos are resized automatically.
        The first gallery photo is the cover shown on the website.
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {gallery === null || roomTypes === null ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading photos…
        </p>
      ) : (
        <>
          <PhotoGrid
            title="Branch gallery"
            subtitle="Shown on the hotel page and the homepage."
            photos={gallery}
            coverLabel
            busy={busyKey === "gallery"}
            onUpload={(files) => void upload(null, files)}
            onDelete={(url) => void remove(null, url)}
            onMove={(i, dir) => void move(null, i, dir)}
          />
          {roomTypes.map((rt) => (
            <PhotoGrid
              key={rt.id}
              title={`Room photos — ${rt.name}`}
              photos={rt.images ?? []}
              coverLabel={false}
              busy={busyKey === rt.id}
              onUpload={(files) => void upload(rt.id, files)}
              onDelete={(url) => void remove(rt.id, url)}
              onMove={(i, dir) => void move(rt.id, i, dir)}
            />
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

```tsx
// src/app/admin/photos/page.tsx
import { PhotosScreen } from "@/components/admin/photos-screen";

export default function AdminPhotosPage() {
  return <PhotosScreen />;
}
```

- [ ] **Step 3: Add the nav entry**

In `src/components/admin/admin-chrome.tsx`, change the NAV array:

```ts
const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/rooms", label: "Rooms & Pricing" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Branch Settings" },
  { href: "/admin/users", label: "Users", ownerOnly: true },
];
```

- [ ] **Step 4: Verify the admin hotels API returns `gallery`**

Check `src/app/api/admin/hotels/route.ts` — the mapped hotel object must
include `gallery`. If it doesn't, add `gallery: h.gallery ?? [],` to the
returned object (next to the other fields).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 6: Manual check**

With `npm run dev` running, open http://localhost:3000/admin/photos, sign in
as the owner. Expected: branch picker, gallery grid showing the existing
repo photos, one section per room type (empty). Reorder arrows work
(persist after refresh). Upload will fail with the friendly
"Photo storage is not set up yet…" message until Storage is enabled — that
exact message appearing inline IS a pass for this step.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/photos-screen.tsx src/app/admin/photos/page.tsx src/components/admin/admin-chrome.tsx src/app/api/admin/hotels/route.ts
git commit -m "Add admin Photos screen: upload, delete, reorder gallery and room photos"
```

---

### Task 6: Room photos on the public hotel page

**Files:**
- Create: `src/components/site/room-photos.tsx`
- Modify: `src/app/hotels/[slug]/page.tsx` (room card, add thumbnail)

- [ ] **Step 1: Create the RoomPhotos client component**

```tsx
// src/components/site/room-photos.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Gallery } from "@/components/site/gallery";

/**
 * Thumbnail of a room type's first photo; clicking opens a modal with the
 * full Gallery viewer. Renders nothing when there are no photos.
 */
export function RoomPhotos({
  images,
  roomName,
}: {
  images: string[];
  roomName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (images.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${images.length} photo${images.length === 1 ? "" : "s"} of ${roomName}`}
        className="group relative block aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg border border-cream-200 sm:w-32"
      >
        <Image
          src={images[0]}
          alt={`${roomName} photo`}
          fill
          sizes="128px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {images.length > 1 && (
          <span className="absolute bottom-1 right-1 rounded bg-maroon-950/70 px-1.5 py-0.5 text-[10px] font-bold text-cream-50">
            +{images.length - 1}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${roomName} photos`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-950/80 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-cream-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-maroon-900">
                {roomName}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close photos"
                className="grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-lg text-maroon-950 hover:bg-cream-300"
              >
                ✕
              </button>
            </div>
            <Gallery images={images} hotelName={roomName} />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Add the thumbnail to the room card**

In `src/app/hotels/[slug]/page.tsx`, import the component:

```ts
import { RoomPhotos } from "@/components/site/room-photos";
```

Then change the room-type card body (the `<article>` inside the Rooms
section) so the left side shows the thumbnail beside the text. Replace:

```tsx
                      <div>
                        <h3 className="font-display text-lg font-semibold text-maroon-900">
                          {rt.name}
                        </h3>
```

with:

```tsx
                      <div className="flex gap-4">
                        <RoomPhotos images={rt.images ?? []} roomName={rt.name} />
                        <div>
                          <h3 className="font-display text-lg font-semibold text-maroon-900">
                            {rt.name}
                          </h3>
```

and close the extra `</div>` after the "Sleeps …" paragraph (the block that
ends with `</p>` before the price column's `<div className="flex shrink-0`):

```tsx
                          <p className="mt-2 text-sm font-semibold text-maroon-700">
                            Sleeps {rt.maxAdults} adult{rt.maxAdults === 1 ? "" : "s"}
                            {rt.maxChildren > 0 &&
                              ` + ${rt.maxChildren} child${rt.maxChildren === 1 ? "" : "ren"}`}
                          </p>
                        </div>
                      </div>
```

- [ ] **Step 3: Type-check and render check**

Run: `npx tsc --noEmit` — expected clean.
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/hotels/gwala-inn` — expected `200` (room cards unchanged because `images` is empty).

- [ ] **Step 4: Commit**

```bash
git add src/components/site/room-photos.tsx "src/app/hotels/[slug]/page.tsx"
git commit -m "Show room-type photos on hotel pages with modal gallery"
```

---

### Task 7: Full verification

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all pass (60 existing + 9 new = 69, 4 skipped integration)

- [ ] **Step 2: Production build**

Stop the dev server first (it locks `.next` on Windows), then:
Run: `npx next build`
Expected: build completes; route list includes `ƒ /api/admin/photos` and `○ /admin/photos`

- [ ] **Step 3: End-to-end manual test (requires Storage enabled)**

Only possible after the owner enables Storage (Blaze plan):
1. `/admin/photos` → pick a branch → Add photos → choose a JPEG → thumbnail appears.
2. Reorder with arrows → refresh → order kept.
3. Delete a photo → confirm → gone from grid and from Firebase console Storage browser.
4. Public hotel page shows the new gallery within 5 minutes (ISR).
Until Storage is enabled, verify instead that upload shows the friendly
"Photo storage is not set up yet…" error inline.

- [ ] **Step 4: Commit any stragglers and report**

```bash
git status --short   # should be clean
```
