"""
Batch img2img runner that drives a local ComfyUI server.

For each image in ./input/ (recursive), uploads it to ComfyUI, queues an
img2img workflow, waits for completion, and saves the stylized JPG into
./output/ at the same relative path. Idempotent: skips entries that already
have an output file. Errors on a single image do not stop the batch.

Style routing:
  - city/*   → cinematic painting
  - all else → oil painting

Llava descriptions from descriptions.json are added to the positive prompt
when available (content-aware generation).

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
import shutil
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import urlencode

import requests
from PIL import Image
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.table import Table

console = Console()

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
INPUT_DIR = SCRIPT_DIR / "input"
OUTPUT_DIR = SCRIPT_DIR / "output"
AI_ASSETS_DIR = PROJECT_DIR / "src" / "assets" / "images" / "ai"
MANIFEST_FILE = PROJECT_DIR / "src" / "app" / "data" / "ai-manifest.ts"
DEFAULT_WORKFLOW = SCRIPT_DIR / "workflow.json"
DESCRIPTIONS_FILE = SCRIPT_DIR / "descriptions.json"
DEFAULT_SERVER = "127.0.0.1:8188"

LOAD_IMAGE_NODE_ID = "10"
SEED_NODE_ID = "3"
POSITIVE_NODE_ID = "6"
NEGATIVE_NODE_ID = "7"
SAVE_IMAGE_NODE_ID = "14"

UPLOAD_SUBFOLDER = "geotrade"
POLL_INTERVAL_SECONDS = 1.0
POLL_TIMEOUT_SECONDS = 600
JPEG_QUALITY = 92

BASE_NEGATIVE = (
    "photo, photograph, photorealistic, 3d render, cgi, low quality, blurry, "
    "ugly, distorted, watermark, text, signature, frame, border, deformed, "
    "oversaturated, neon, color shift, unnatural colors, wrong colors, faded, "
    "washed out, desaturated, pale, added colors, color hallucination"
)

STYLE_OIL_PAINTING = {
    "name": "oil painting",
    "positive": "oil painting, impasto brushstrokes, thick paint texture, old master, canvas texture",
    "negative": BASE_NEGATIVE + ", flat, digital, sketch",
}

STYLE_CINEMATIC_PAINTING = {
    "name": "cinematic painting",
    "positive": "cinematic painting, dramatic chiaroscuro, film lighting, painterly realism, moody atmosphere",
    "negative": BASE_NEGATIVE + ", flat, cartoon, bright",
}


def style_for(source: Path) -> dict:
    relative = source.relative_to(INPUT_DIR)
    if relative.parts[0] == "city":
        return STYLE_CINEMATIC_PAINTING
    return STYLE_OIL_PAINTING


def load_descriptions() -> dict[str, str]:
    if DESCRIPTIONS_FILE.exists():
        return json.loads(DESCRIPTIONS_FILE.read_text(encoding="utf-8"))
    return {}


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
    return OUTPUT_DIR / source.relative_to(INPUT_DIR)


def build_workflow(template: dict, server_image_ref: str, style: dict, description: str, seed: int) -> dict:
    workflow = copy.deepcopy(template)
    workflow[LOAD_IMAGE_NODE_ID]["inputs"]["image"] = server_image_ref
    workflow[SEED_NODE_ID]["inputs"]["seed"] = seed
    positive = f"{style['positive']}, {description}" if description else style["positive"]
    workflow[POSITIVE_NODE_ID]["inputs"]["text"] = positive
    workflow[NEGATIVE_NODE_ID]["inputs"]["text"] = style["negative"]
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


def process_one(client: ComfyClient, workflow_template: dict, source: Path, descriptions: dict[str, str]) -> None:
    target = output_path_for(source)
    server_ref = client.upload_image(source)
    style = style_for(source)
    description = descriptions.get(source.stem, "")
    seed = random.randint(0, 2**31 - 1)
    workflow = build_workflow(workflow_template, server_ref, style, description, seed)
    prompt_id = client.queue_prompt(workflow)
    outputs = client.wait_for_completion(prompt_id)
    filename, subfolder, type_ = first_output_image(outputs)
    png_bytes = client.fetch_image(filename, subfolder, type_)
    save_as_jpg(png_bytes, target)


def deploy_to_assets() -> int:
    if not OUTPUT_DIR.exists():
        return 0
    copied = 0
    for src in OUTPUT_DIR.rglob("*.jpg"):
        dst = AI_ASSETS_DIR / src.relative_to(OUTPUT_DIR)
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
    return copied


def update_manifest() -> int:
    paths = sorted(
        str(p.relative_to(AI_ASSETS_DIR)).replace("\\", "/")
        for p in AI_ASSETS_DIR.rglob("*.jpg")
        if p.is_file()
    )
    lines = ["// Auto-generated by img2img/batch.py — do not edit manually"]
    lines.append("export const AI_MANIFEST: readonly string[] = [")
    for p in paths:
        lines.append(f"  '{p}',")
    lines.append("];")
    MANIFEST_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(paths)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--server", default=DEFAULT_SERVER, help="ComfyUI host:port")
    parser.add_argument("--workflow", type=Path, default=DEFAULT_WORKFLOW, help="Workflow JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not INPUT_DIR.exists():
        console.print(f"[red]ERROR: input folder not found: {INPUT_DIR}[/red]")
        console.print("Run prepare.py first.")
        return 1
    if not args.workflow.exists():
        console.print(f"[red]ERROR: workflow not found: {args.workflow}[/red]")
        return 1

    workflow_template = json.loads(args.workflow.read_text(encoding="utf-8"))
    descriptions = load_descriptions()

    sources = find_input_images(INPUT_DIR)
    if not sources:
        console.print(f"No JPG images found in {INPUT_DIR}. Did prepare.py run?")
        return 0

    todo = [s for s in sources if not output_path_for(s).exists()]
    skipped = len(sources) - len(todo)
    city_count = sum(1 for s in todo if s.relative_to(INPUT_DIR).parts[0] == "city")
    other_count = len(todo) - city_count

    ks = workflow_template["3"]["inputs"]
    cn = workflow_template["17"]["inputs"]
    ckpt = workflow_template["4"]["inputs"]["ckpt_name"]
    config_lines = (
        f"[bold]{len(todo)} to generate[/bold]  ([dim]{skipped} already done[/dim])\n\n"
        f"[dim]checkpoint  [/dim]{ckpt}\n"
        f"[dim]denoise     [/dim]{ks['denoise']}  "
        f"[dim]cfg [/dim]{ks['cfg']}  "
        f"[dim]steps [/dim]{ks['steps']}  "
        f"[dim]sampler [/dim]{ks['sampler_name']}/{ks['scheduler']}\n"
        f"[dim]canny       [/dim]strength {cn['strength']}  "
        f"start {cn['start_percent']}  end {cn['end_percent']}\n"
        f"[dim]descriptions[/dim] {len(descriptions)} cached\n\n"
        f"[cyan]{city_count}[/cyan] city → cinematic painting  |  "
        f"[yellow]{other_count}[/yellow] other → oil painting"
    )
    console.print(Panel(config_lines, title="[bold]GeoTrade — Batch[/bold]", border_style="yellow"))

    if not todo:
        copied = deploy_to_assets()
        count = update_manifest()
        console.print(f"[green]All images already generated.[/green] Deployed {copied} new, manifest: {count} total.")
        return 0

    client = ComfyClient(args.server)
    try:
        client.session.get(f"{client.base_url}/system_stats", timeout=5).raise_for_status()
        console.print("[green]✓ ComfyUI connected[/green]\n")
    except Exception as exc:
        console.print(f"[red]✗ Cannot reach ComfyUI at {client.base_url}: {exc}[/red]")
        return 1

    failed: list[tuple[Path, Exception]] = []
    done = 0
    start_all = time.monotonic()

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Stylizing", total=len(todo))

        for source in todo:
            style = style_for(source)
            rel = source.relative_to(INPUT_DIR)
            label = f"[cyan]{style['name']}[/cyan] [dim]{rel}[/dim]"
            progress.update(task, description=label)
            t0 = time.monotonic()
            try:
                process_one(client, workflow_template, source, descriptions)
                elapsed = time.monotonic() - t0
                done += 1
                progress.print(f"  [green]✓[/green] {rel}  [dim]{elapsed:.0f}s[/dim]")
            except Exception as exc:
                elapsed = time.monotonic() - t0
                failed.append((source, exc))
                progress.print(f"  [red]✗[/red] {rel}  [dim]{elapsed:.0f}s — {exc}[/dim]")
            progress.advance(task)

    total_time = time.monotonic() - start_all

    copied = deploy_to_assets()
    count = update_manifest()

    table = Table(title="Résumé", border_style="yellow", show_header=False)
    table.add_column("", style="bold")
    table.add_column("", justify="right")
    table.add_row("[green]✓ Succès[/green]", str(done))
    table.add_row("[dim]↷ Skippés[/dim]", str(skipped))
    if failed:
        table.add_row("[red]✗ Échecs[/red]", str(len(failed)))
    table.add_row("[dim]Durée totale[/dim]", f"{total_time / 60:.1f} min")
    if done:
        table.add_row("[dim]Temps moyen/image[/dim]", f"{total_time / (done + len(failed)):.0f}s")
    table.add_row("[dim]Déployées vers assets[/dim]", str(copied))
    table.add_row("[dim]Total AI manifest[/dim]", str(count))
    console.print(table)

    if failed:
        console.print("\n[red bold]Échecs :[/red bold]")
        for src, exc in failed:
            console.print(f"  [red]✗[/red] {src.relative_to(INPUT_DIR)} — {exc}")
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
