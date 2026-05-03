"""
Batch img2img runner that drives a local ComfyUI server.

For each image in ./input/ (recursive), uploads it to ComfyUI, queues an
img2img workflow, waits for completion, and saves the stylized JPG into
./output/ at the same relative path. Idempotent: skips entries that already
have an output file. Errors on a single image do not stop the batch.

Usage:
    python batch.py                     # default settings
    python batch.py --server localhost:8188
    python batch.py --workflow workflow.json
"""
from __future__ import annotations

import argparse
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
INPUT_DIR = SCRIPT_DIR / "input"
OUTPUT_DIR = SCRIPT_DIR / "output"
DEFAULT_WORKFLOW = SCRIPT_DIR / "workflow.json"
DEFAULT_SERVER = "127.0.0.1:8188"

LOAD_IMAGE_NODE_ID = "10"
SEED_NODE_ID = "3"
SAVE_IMAGE_NODE_ID = "14"

UPLOAD_SUBFOLDER = "geotrade"
POLL_INTERVAL_SECONDS = 1.0
POLL_TIMEOUT_SECONDS = 600
JPEG_QUALITY = 92


class ComfyClient:
    def __init__(self, server: str) -> None:
        self.base_url = f"http://{server}"
        self.client_id = uuid.uuid4().hex
        self.session = requests.Session()

    def upload_image(self, path: Path) -> str:
        """Upload an image to ComfyUI's input folder. Returns the server-side reference."""
        with path.open("rb") as fh:
            files = {"image": (path.name, fh, "image/jpeg")}
            data = {
                "subfolder": UPLOAD_SUBFOLDER,
                "type": "input",
                "overwrite": "true",
            }
            r = self.session.post(
                f"{self.base_url}/upload/image", files=files, data=data, timeout=60
            )
            r.raise_for_status()
        payload = r.json()
        subfolder = payload.get("subfolder", UPLOAD_SUBFOLDER)
        name = payload["name"]
        return f"{subfolder}/{name}" if subfolder else name

    def queue_prompt(self, workflow: dict) -> str:
        body = {"prompt": workflow, "client_id": self.client_id}
        r = self.session.post(f"{self.base_url}/prompt", json=body, timeout=30)
        r.raise_for_status()
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
                status = entry.get("status", {})
                if status.get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI reported error: {status}")
                return entry["outputs"]
            time.sleep(POLL_INTERVAL_SECONDS)
        raise TimeoutError(f"Prompt {prompt_id} did not finish within {POLL_TIMEOUT_SECONDS}s")

    def fetch_image(self, filename: str, subfolder: str, type_: str) -> bytes:
        params = urlencode({"filename": filename, "subfolder": subfolder, "type": type_})
        r = self.session.get(f"{self.base_url}/view?{params}", timeout=60)
        r.raise_for_status()
        return r.content


def find_input_images(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*.jpg") if p.is_file())


def output_path_for(source: Path) -> Path:
    relative = source.relative_to(INPUT_DIR)
    return OUTPUT_DIR / relative


def build_workflow(template: dict, server_image_ref: str, seed: int) -> dict:
    workflow = copy.deepcopy(template)
    workflow[LOAD_IMAGE_NODE_ID]["inputs"]["image"] = server_image_ref
    workflow[SEED_NODE_ID]["inputs"]["seed"] = seed
    return workflow


def first_output_image(outputs: dict) -> tuple[str, str, str]:
    save_node = outputs.get(SAVE_IMAGE_NODE_ID)
    if not save_node or not save_node.get("images"):
        raise RuntimeError(f"No images in outputs: {outputs}")
    img = save_node["images"][0]
    return img["filename"], img.get("subfolder", ""), img.get("type", "output")


def save_as_jpg(png_bytes: bytes, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(png_bytes)) as img:
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(target, format="JPEG", quality=JPEG_QUALITY, optimize=True)


def process_one(client: ComfyClient, workflow_template: dict, source: Path) -> None:
    target = output_path_for(source)
    server_ref = client.upload_image(source)
    seed = random.randint(0, 2**31 - 1)
    workflow = build_workflow(workflow_template, server_ref, seed)
    prompt_id = client.queue_prompt(workflow)
    outputs = client.wait_for_completion(prompt_id)
    filename, subfolder, type_ = first_output_image(outputs)
    png_bytes = client.fetch_image(filename, subfolder, type_)
    save_as_jpg(png_bytes, target)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--server", default=DEFAULT_SERVER, help="ComfyUI host:port")
    parser.add_argument("--workflow", type=Path, default=DEFAULT_WORKFLOW, help="Workflow JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not INPUT_DIR.exists():
        print(f"ERROR: input folder not found: {INPUT_DIR}", file=sys.stderr)
        print("Run prepare.py first.", file=sys.stderr)
        return 1
    if not args.workflow.exists():
        print(f"ERROR: workflow not found: {args.workflow}", file=sys.stderr)
        return 1

    workflow_template = json.loads(args.workflow.read_text(encoding="utf-8"))

    sources = find_input_images(INPUT_DIR)
    if not sources:
        print(f"No JPG images found in {INPUT_DIR}. Did prepare.py run?")
        return 0

    todo = [s for s in sources if not output_path_for(s).exists()]
    print(f"Found {len(sources)} input images, {len(todo)} to process.")
    if not todo:
        return 0

    client = ComfyClient(args.server)
    try:
        client.session.get(f"{client.base_url}/system_stats", timeout=5).raise_for_status()
    except Exception as exc:
        print(f"ERROR: cannot reach ComfyUI at {client.base_url}: {exc}", file=sys.stderr)
        return 1

    failed: list[tuple[Path, Exception]] = []
    for source in tqdm(todo, desc="Stylizing", unit="img"):
        try:
            process_one(client, workflow_template, source)
        except Exception as exc:
            failed.append((source, exc))
            tqdm.write(f"FAILED {source.relative_to(INPUT_DIR)}: {exc}")

    if failed:
        print(f"\n{len(failed)} image(s) failed. Re-run to retry.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
