"""
Style tester: runs 2 input images through 10 different styles and saves results
to test_output/<style_name>/<image_name>.jpg for easy comparison.

Usage:
    python test_styles.py image_nature.jpg image_ville.jpg
    python test_styles.py  # prompts for 2 image paths
"""
from __future__ import annotations

import copy
import io
import json
import random
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import urlencode

import requests
from PIL import Image
from tqdm import tqdm

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_WORKFLOW = SCRIPT_DIR / "workflow.json"
TEST_OUTPUT_DIR = SCRIPT_DIR / "test_output"
DEFAULT_SERVER = "127.0.0.1:8188"

LOAD_IMAGE_NODE_ID = "10"
SEED_NODE_ID = "3"
SAVE_IMAGE_NODE_ID = "14"
POSITIVE_NODE_ID = "6"
NEGATIVE_NODE_ID = "7"

UPLOAD_SUBFOLDER = "geotrade_test"
POLL_INTERVAL_SECONDS = 1.0
POLL_TIMEOUT_SECONDS = 600
JPEG_QUALITY = 92

BASE_NEGATIVE = (
    "photo, photograph, photorealistic, 3d render, cgi, low quality, blurry, "
    "ugly, distorted, watermark, text, signature, frame, border, deformed, "
    "oversaturated, neon, color shift, unnatural colors, wrong colors, faded, "
    "washed out, desaturated, pale, added colors, color hallucination"
)

STYLES = [
    {
        "name": "01_ink_watercolor",
        "positive": (
            "premium hand-drawn illustration, refined ink and watercolor wash, "
            "editorial illustration style, elegant detailed linework, "
            "exact same colors as input, true-to-life color reproduction, "
            "sophisticated composition, detailed textures, professional, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", cartoonish, amateur",
    },
    {
        "name": "02_oil_painting",
        "positive": (
            "classical oil painting, old master technique, impasto brushstrokes, "
            "exact same colors as input, true-to-life color reproduction, "
            "detailed and textured, dramatic lighting, museum quality, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", flat, digital, cartoon, sketch, line art",
    },
    {
        "name": "03_concept_art",
        "positive": (
            "cinematic concept art, professional matte painting, atmospheric lighting, "
            "exact same colors as input, true-to-life color reproduction, "
            "highly detailed environment, ArtStation quality, epic composition, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", flat, simple, sketch, cartoonish, amateur",
    },
    {
        "name": "04_impressionist",
        "positive": (
            "impressionist painting, Monet style, expressive thick brushstrokes, "
            "exact same colors as input, true-to-life color reproduction, "
            "painterly texture, lively and detailed, fine art, museum quality, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", flat, digital, cartoon, sketch",
    },
    {
        "name": "05_studio_ghibli",
        "positive": (
            "Studio Ghibli anime illustration style, highly detailed, "
            "exact same colors as input, true-to-life color reproduction, "
            "beautiful painterly background, professional animation art, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", simple, flat, western cartoon",
    },
    {
        "name": "06_digital_illustration",
        "positive": (
            "professional digital illustration, detailed painterly style, "
            "exact same colors as input, true-to-life color reproduction, "
            "sharp details, editorial quality, ArtStation quality, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", flat, sketch, amateur, cartoon, simple",
    },
    {
        "name": "07_comic_art",
        "positive": (
            "high-end comic book illustration, detailed inking, "
            "exact same colors as input, true-to-life color reproduction, "
            "dynamic shading, professional graphic novel quality, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", simple, amateur, childish",
    },
    {
        "name": "08_watercolor_vivid",
        "positive": (
            "fine art watercolor painting, wet-on-wet technique, expressive brushwork, "
            "exact same colors as input, true-to-life color reproduction, "
            "detailed, professional fine art watercolor, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", digital, flat, ink lines",
    },
    {
        "name": "09_vintage_travel_poster",
        "positive": (
            "vintage travel poster illustration, 1950s retro art style, "
            "exact same colors as input, true-to-life color reproduction, "
            "detailed graphic design, strong composition, highly detailed, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", photorealistic, noisy, modern digital",
    },
    {
        "name": "10_cinematic_painting",
        "positive": (
            "cinematic oil painting, dramatic light and shadow, "
            "exact same colors as input, true-to-life color reproduction, "
            "highly detailed environment, painterly texture, museum quality, masterpiece"
        ),
        "negative": BASE_NEGATIVE + ", flat, cartoon, sketch, amateur",
    },
]


class ComfyClient:
    def __init__(self, server: str) -> None:
        self.base_url = f"http://{server}"
        self.client_id = uuid.uuid4().hex
        self.session = requests.Session()

    def upload_image(self, path: Path) -> str:
        with path.open("rb") as fh:
            files = {"image": (path.name, fh, "image/jpeg")}
            data = {"subfolder": UPLOAD_SUBFOLDER, "type": "input", "overwrite": "true"}
            r = self.session.post(f"{self.base_url}/upload/image", files=files, data=data, timeout=60)
            r.raise_for_status()
        payload = r.json()
        subfolder = payload.get("subfolder", UPLOAD_SUBFOLDER)
        name = payload["name"]
        return f"{subfolder}/{name}" if subfolder else name

    def queue_prompt(self, workflow: dict) -> str:
        body = {"prompt": workflow, "client_id": self.client_id}
        r = self.session.post(f"{self.base_url}/prompt", json=body, timeout=30)
        if not r.ok:
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:500]}")
        return r.json()["prompt_id"]

    def wait_for_completion(self, prompt_id: str) -> dict:
        deadline = time.monotonic() + POLL_TIMEOUT_SECONDS
        url = f"{self.base_url}/history/{prompt_id}"
        while time.monotonic() < deadline:
            r = self.session.get(url, timeout=15)
            r.raise_for_status()
            data = r.json()
            entry = data.get(prompt_id)
            if entry and entry.get("outputs"):
                if entry.get("status", {}).get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI error: {entry['status']}")
                return entry["outputs"]
            time.sleep(POLL_INTERVAL_SECONDS)
        raise TimeoutError(f"Timeout for prompt {prompt_id}")

    def fetch_image(self, filename: str, subfolder: str, type_: str) -> bytes:
        params = urlencode({"filename": filename, "subfolder": subfolder, "type": type_})
        r = self.session.get(f"{self.base_url}/view?{params}", timeout=60)
        r.raise_for_status()
        return r.content


def build_workflow(template: dict, server_image_ref: str, positive: str, negative: str, seed: int) -> dict:
    wf = copy.deepcopy(template)
    wf[LOAD_IMAGE_NODE_ID]["inputs"]["image"] = server_image_ref
    wf[POSITIVE_NODE_ID]["inputs"]["text"] = positive
    wf[NEGATIVE_NODE_ID]["inputs"]["text"] = negative
    wf[SEED_NODE_ID]["inputs"]["seed"] = seed
    return wf


def save_as_jpg(png_bytes: bytes, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(png_bytes)) as img:
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(target, format="JPEG", quality=JPEG_QUALITY, optimize=True)


def main() -> int:
    if len(sys.argv) >= 2:
        image_paths = [Path(p) for p in sys.argv[1:]]
    else:
        print("Donne au moins un chemin d'image :")
        p = input("  Image : ").strip().strip('"')
        image_paths = [Path(p)]

    for p in image_paths:
        if not p.exists():
            print(f"ERROR: fichier introuvable : {p}")
            return 1

    workflow_template = json.loads(DEFAULT_WORKFLOW.read_text(encoding="utf-8"))

    client = ComfyClient(DEFAULT_SERVER)
    try:
        client.session.get(f"{client.base_url}/system_stats", timeout=5).raise_for_status()
    except Exception as exc:
        print(f"ERROR: ComfyUI inaccessible : {exc}")
        return 1

    tasks = [(style, img) for style in STYLES for img in image_paths]
    total = len(tasks)
    print(f"\n{total} rendus à générer ({len(STYLES)} styles × {len(image_paths)} images : {', '.join(p.stem for p in image_paths)})\n")

    failed = []
    for i, (style, img_path) in enumerate(tqdm(tasks, desc="Styles", unit="rendu"), 1):
        target = (TEST_OUTPUT_DIR / img_path.stem / style["name"]).with_suffix(".jpg")
        if target.exists():
            tqdm.write(f"  skip (déjà fait) : {target.relative_to(SCRIPT_DIR)}")
            continue
        try:
            server_ref = client.upload_image(img_path)
            wf = build_workflow(workflow_template, server_ref, style["positive"], style["negative"], random.randint(0, 2**31 - 1))
            prompt_id = client.queue_prompt(wf)
            outputs = client.wait_for_completion(prompt_id)
            save_node = outputs.get(SAVE_IMAGE_NODE_ID)
            if not save_node or not save_node.get("images"):
                raise RuntimeError(f"Pas d'image en sortie : {outputs}")
            img_info = save_node["images"][0]
            png_bytes = client.fetch_image(img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output"))
            save_as_jpg(png_bytes, target)
            tqdm.write(f"  ✓ {style['name']} / {img_path.stem}")
        except Exception as exc:
            failed.append((style["name"], img_path.name, exc))
            tqdm.write(f"  FAILED {style['name']} / {img_path.name}: {exc}")

    print(f"\nRésultats dans : {TEST_OUTPUT_DIR}")

    if failed:
        print(f"\n{len(failed)} échec(s) :")
        for s, img, exc in failed:
            print(f"  {s} / {img}: {exc}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
