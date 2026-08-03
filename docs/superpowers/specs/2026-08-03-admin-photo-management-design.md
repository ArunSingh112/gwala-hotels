# Admin Photo Management — Design

**Date:** 2026-08-03
**Status:** Approved by owner (via chat)
**Depends on:** Firebase Storage enabled on project `arunhotels-e4da4` (requires
Blaze plan — owner must add a card in the Firebase console before production
use; the API degrades gracefully until then).

## Goal

Owner and branch managers can add, remove and reorder photos for each branch's
gallery and for each room type, directly from the admin panel — no developer
involvement, no redeploy.

## Scope

- Branch gallery photos (shown on hotel page gallery, hero, and cards).
- Room-type photos (`roomTypes/{id}.images` — field exists, currently unused).
- Permissions follow the existing model: owner manages all branches, a manager
  manages only their own branch.

Out of scope: image cropping/editing, captions, alt-text editing, photos for
attractions or site pages.

## Storage & data model

- Uploads go to Firebase Storage:
  - Branch: `hotels/{hotelId}/{timestamp}-{rand}.jpg`
  - Room: `hotels/{hotelId}/rooms/{roomTypeId}/{timestamp}-{rand}.jpg`
- Files are uploaded via the Admin SDK (server-side), made publicly readable,
  and referenced by their public URL.
- URLs are appended to the existing Firestore arrays:
  - `hotels/{id}.gallery` — first item is the cover/hero photo. `heroImage` is
    kept in sync with `gallery[0]` on every mutation.
  - `hotels/{id}/roomTypes/{id}.images`
- Existing repo photos (`/hotels/<slug>/hero.jpg` paths) stay valid; arrays may
  mix local paths and Storage URLs. Next/Image renders both (Storage hostname
  added to `next.config.ts` `images.remotePatterns`).
- Deleting a repo-path photo removes it from the array only (the file stays in
  the repo, harmless). Deleting a Storage URL also deletes the Storage object.

## API (new route family, existing auth pattern)

All routes: `requireAdmin` + `requireHotelAccess`; Zod-validated inputs;
`handleApiError` envelope. `target` is either `{hotelId}` (branch gallery) or
`{hotelId, roomTypeId}` (room photos).

- `POST /api/admin/photos` — multipart form (`file`, `hotelId`,
  `roomTypeId?`). Server validates type (JPEG/PNG/WebP) and size
  (≤10 MB), re-encodes with sharp (max width 1600, JPEG q82, EXIF rotation
  applied), uploads, appends URL to the array, returns the updated array.
  HEIC is rejected with a clear message telling the user to send JPEG
  (iPhone Settings → Camera → Formats → "Most Compatible"), since sharp
  cannot decode iPhone HEIC.
- `DELETE /api/admin/photos` — JSON `{hotelId, roomTypeId?, url}`. Removes
  from array; deletes Storage object when the URL points at our bucket.
- `PATCH /api/admin/photos` — JSON `{hotelId, roomTypeId?, urls: string[]}`.
  Replaces the array for reordering; must be a permutation of the current
  array (validated server-side).
- If Storage is not enabled on the project, POST returns
  `photo_storage_unavailable` with a human message; the UI shows it.

## Admin UI

- New "Photos" item in the admin sidebar (`/admin/photos`,
  `photos-screen.tsx`), branch picker at top (same pattern as Rooms screen;
  managers see only their branch).
- Section 1: **Branch gallery** — thumbnail grid; first tile badged "Cover
  photo"; each tile has move-left/move-right and delete (confirm dialog);
  multi-file upload button with per-file progress and inline per-file errors.
- Section 2: **Room photos** — one sub-section per room type, same grid and
  controls.
- Client-side pre-checks (type, size) for fast feedback; server re-validates.

## Site display

- Hotel page room cards: when a room type has images, show a small thumbnail
  (first image) beside the room details; clicking opens the existing Gallery
  viewer scoped to that room's photos. No images → unchanged layout.
- Branch gallery/hero/cards already read `gallery`/`heroImage` — no changes
  needed beyond remotePatterns.

## Error handling

- Per-file upload errors surface inline; other files in a batch continue.
- Array mutations are read-modify-write inside a Firestore transaction to
  avoid clobbering concurrent edits.
- Reorder rejects stale lists (not a permutation → 409, UI refreshes).

## Testing

- Unit: array mutation helpers (append, remove, reorder-permutation check),
  file-type/size validation.
- Manual: upload/delete/reorder from the admin panel against the live
  project; verify public site reflects changes after ISR revalidate (≤5 min).
