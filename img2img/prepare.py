"""
Prepare source images for ComfyUI batch processing.

Reads from ../src/assets/images/cards/ (recursive) and writes to ./input/
keeping the same folder structure. Each image is converted to JPG at the
target resolution with center-crop to match the card UI display ratio.

Idempotent: existing output files are skipped, so it's safe to re-run after
new images are added to the source folder.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pillow_avif  # noqa: F401  (registers AVIF support in Pillow)
from PIL import Image, ImageOps
from tqdm import tqdm

SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE_DIR = SCRIPT_DIR.parent / "src" / "assets" / "images" / "cards"
INPUT_DIR = SCRIPT_DIR / "input"

TARGET_WIDTH = 1344
TARGET_HEIGHT = 768
JPEG_QUALITY = 95
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def find_source_images(root: Path) -> list[Path]:
    return sorted(
        p
        for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def target_path_for(source: Path) -> Path:
    relative = source.relative_to(SOURCE_DIR).with_suffix(".jpg")
    return INPUT_DIR / relative


def process_image(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        resized = ImageOps.fit(
            img,
            (TARGET_WIDTH, TARGET_HEIGHT),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        resized.save(target, format="JPEG", quality=JPEG_QUALITY, optimize=True)


def main() -> int:
    if not SOURCE_DIR.exists():
        print(f"ERROR: source folder not found: {SOURCE_DIR}", file=sys.stderr)
        return 1

    sources = find_source_images(SOURCE_DIR)
    if not sources:
        print(f"No images found in {SOURCE_DIR}")
        return 0

    to_process = [s for s in sources if not target_path_for(s).exists()]

    print(f"Found {len(sources)} source images, {len(to_process)} to process.")
    if not to_process:
        return 0

    failed: list[tuple[Path, Exception]] = []
    for source in tqdm(to_process, desc="Preparing", unit="img"):
        target = target_path_for(source)
        try:
            process_image(source, target)
        except Exception as exc:
            failed.append((source, exc))
            tqdm.write(f"FAILED {source.relative_to(SOURCE_DIR)}: {exc}")

    if failed:
        print(f"\n{len(failed)} image(s) failed.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
