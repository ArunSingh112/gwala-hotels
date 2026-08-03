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
