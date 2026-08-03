"""One-time: convert branch photos from Downloads into public/hotels/<slug>/.

- HEIC (iPhone) files are decoded with pillow-heif; JPEGs read directly.
- Every image is resized to max 1600px wide, saved as progressive JPEG q82.
- First image (alphabetically) becomes hero.jpg; the rest gallery-2.jpg, ...
- Zero-byte files are skipped.
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

SOURCES = {
    "gwala-inn": r"C:\Users\aahla\Downloads\gwalaInn",
    "gwala-bhawan": r"C:\Users\aahla\Downloads\gwalaBhawan",
    "gwala-palace": r"C:\Users\aahla\Downloads\gwalapalace",
    "gwala-residency": r"C:\Users\aahla\Downloads\gwalaResidency",
    "gwala-dham": r"C:\Users\aahla\Downloads\gwalaDham",
}
DEST_ROOT = Path(r"C:\Users\aahla\Downloads\arun_hotels\public\hotels")
MAX_WIDTH = 1600
EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}

for slug, src in SOURCES.items():
    src_dir = Path(src)
    dest_dir = DEST_ROOT / slug
    dest_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        p for p in src_dir.iterdir()
        if p.suffix.lower() in EXTS and p.stat().st_size > 0
    )
    if not files:
        print(f"{slug}: NO USABLE IMAGES in {src}")
        continue

    print(f"{slug}: {len(files)} image(s)")
    for i, p in enumerate(files):
        name = "hero.jpg" if i == 0 else f"gallery-{i + 1}.jpg"
        out = dest_dir / name
        try:
            img = Image.open(p)
            img = ImageOps.exif_transpose(img)  # respect camera rotation
            img = img.convert("RGB")
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                img = img.resize(
                    (MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS
                )
            img.save(out, "JPEG", quality=82, progressive=True, optimize=True)
            kb = out.stat().st_size // 1024
            print(f"  {p.name} -> {name} ({img.width}x{img.height}, {kb} KB)")
        except Exception as e:  # noqa: BLE001 — report and continue
            print(f"  {p.name} FAILED: {e}", file=sys.stderr)

print("done")
