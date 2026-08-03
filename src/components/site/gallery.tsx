"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/**
 * Interactive gallery: a large viewer with thumbnail strip below.
 * Arrow keys work; thumbnails scroll into view as you navigate.
 */
export function Gallery({
  images,
  hotelName,
}: {
  images: string[];
  hotelName: string;
}) {
  const [index, setIndex] = useState(0);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-maroon-950 sm:aspect-[16/10]">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`${hotelName} photo ${i + 1} of ${images.length}`}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className={`object-contain transition-opacity duration-500 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream-50/90 text-xl text-maroon-950 shadow-md transition hover:bg-cream-50"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream-50/90 text-xl text-maroon-950 shadow-md transition hover:bg-cream-50"
            >
              ›
            </button>
            <p className="absolute bottom-3 right-3 rounded-full bg-maroon-950/70 px-3 py-1 text-xs font-semibold text-cream-50">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg transition ${
                i === index
                  ? "ring-2 ring-marigold-500 ring-offset-2 ring-offset-cream-50"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
