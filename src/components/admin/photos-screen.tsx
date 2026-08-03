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
            <li
              key={url}
              className="group relative overflow-hidden rounded-lg border border-cream-200"
            >
              <div className="relative aspect-[4/3] bg-cream-100">
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
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
                    if (
                      window.confirm("Delete this photo? This cannot be undone.")
                    ) {
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
        authedFetch(
          `/api/admin/room-types?hotelId=${encodeURIComponent(hotelId)}`
        ),
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

  /** Uploads sequentially; reports the last error inline, keeps going. */
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
        body: JSON.stringify({
          hotelId,
          roomTypeId: roomTypeId ?? undefined,
          url,
        }),
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
        <p
          role="alert"
          className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900"
        >
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
