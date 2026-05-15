"""
Style tester: runs input images through multiple styles and saves results
to test_output/<location>/<style>.jpg for easy comparison.

Automatically describes images via llava-phi3 (Ollama) before generation,
so prompts are content-aware per image. Descriptions cached in descriptions.json.

Usage:
    python test_styles.py               # runs all HARDCODED_IMAGES
    python test_styles.py img1.jpg img2.jpg
"""
from __future__ import annotations

import base64
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
from rich.text import Text

console = Console()

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_WORKFLOW = SCRIPT_DIR / "workflow.json"
TEST_OUTPUT_DIR = SCRIPT_DIR / "test_output"
DESCRIPTIONS_FILE = SCRIPT_DIR / "descriptions.json"
DEFAULT_SERVER = "127.0.0.1:8188"

LOAD_IMAGE_NODE_ID = "10"
SEED_NODE_ID = "3"
SAVE_IMAGE_NODE_ID = "14"
POSITIVE_NODE_ID = "6"
NEGATIVE_NODE_ID = "7"

OLLAMA_SERVER = "http://localhost:11434"
OLLAMA_MODEL = "llava-phi3"
DESCRIBE_PROMPT = (
    "Look carefully at this image and respond with comma-separated keywords only, no sentences, no labels. "
    "Include in this exact order: terrain, specific plants in foreground, specific plants in background, "
    "then write exactly 'no buildings' or 'buildings present', water features, lighting. "
    "Maximum 35 words. "
    "Example: 'desert canyon, tall saguaro cactus foreground, sparse scrub background, no buildings, winding river, golden sunset'"
)

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
        "positive": "ink and watercolor illustration, ink linework, watercolor wash, loose brushwork, paper texture",
        "negative": BASE_NEGATIVE + ", digital, flat, cartoon",
    },
    {
        "name": "02_oil_painting",
        "positive": "oil painting, impasto brushstrokes, thick paint texture, old master, canvas texture",
        "negative": BASE_NEGATIVE + ", flat, digital, sketch",
    },
    {
        "name": "03_concept_art",
        "positive": "cinematic concept art, matte painting, atmospheric perspective, ArtStation, epic lighting",
        "negative": BASE_NEGATIVE + ", flat, sketch, cartoon",
    },
    {
        "name": "04_impressionist",
        "positive": "impressionist painting, Monet style, visible expressive brushstrokes, painterly, dappled light",
        "negative": BASE_NEGATIVE + ", flat, digital, sharp edges",
    },
    {
        "name": "05_studio_ghibli",
        "positive": "Studio Ghibli anime style, hand-drawn animation cel, painterly background, soft warm colors",
        "negative": BASE_NEGATIVE + ", western cartoon, flat, 3d",
    },
    {
        "name": "06_digital_illustration",
        "positive": "digital illustration, painterly, editorial illustration, sharp clean linework, graphic",
        "negative": BASE_NEGATIVE + ", sketch, rough, cartoon",
    },
    {
        "name": "07_comic_art",
        "positive": "comic book illustration, bold ink outlines, cel shading, graphic novel, halftone",
        "negative": BASE_NEGATIVE + ", painterly, soft, amateur",
    },
    {
        "name": "08_watercolor_vivid",
        "positive": "watercolor painting, wet-on-wet technique, color bleeding, translucent washes, paper grain",
        "negative": BASE_NEGATIVE + ", digital, flat, ink lines",
    },
    {
        "name": "09_vintage_travel_poster",
        "positive": "vintage travel poster, 1950s retro illustration, flat graphic design, bold colors, lithograph print",
        "negative": BASE_NEGATIVE + ", modern, photorealistic, noisy",
    },
    {
        "name": "10_cinematic_painting",
        "positive": "cinematic painting, dramatic chiaroscuro, film lighting, painterly realism, moody atmosphere",
        "negative": BASE_NEGATIVE + ", flat, cartoon, bright",
    },
]

HARDCODED_IMAGES = [
    ("input/city/france/paris.jpg",           "paris"),
    ("input/archipelago/canary-islands.jpg",  "canary-islands"),
    ("input/city/united-states/atlanta.jpg",  "atlanta"),
    ("input/sea/mediterranean.jpg",           "mediterranean"),
    ("input/mountain/vinson.jpg",             "vinson"),
    ("input/desert/kalahari.jpg",             "kalahari"),
    ("input/ocean/pacific.jpg",               "pacific"),
    ("input/lake/superior.jpg",               "superior"),
    ("input/river/rio-grande.jpg",            "rio-grande"),
    ("input/island/senja.jpg",                "senja"),
    ("input/island/santorini.jpg",            "santorini"),
    ("input/island/honshu.jpg",               "honshu"),
    ("input/island/hokkaido.jpg",             "hokkaido"),
    ("input/island/manhattan.jpg",            "manhattan"),
    ("input/territory/hong-kong.jpg",         "hong-kong"),
    ("input/territory/aruba.jpg",             "aruba"),
    ("input/country/palau.jpg",               "palau"),
    ("input/country/armenie.jpg",             "armenia"),
]


# ── Vision (Ollama / llava-phi3) ──────────────────────────────────────────────

def ensure_descriptions(image_paths: list[tuple[Path, str]]) -> dict[str, str]:
    cache: dict[str, str] = {}
    if DESCRIPTIONS_FILE.exists():
        cache = json.loads(DESCRIPTIONS_FILE.read_text(encoding="utf-8"))

    missing = [(p, name) for p, name in image_paths if name not in cache]
    if not missing:
        console.print(f"[dim]Descriptions : cache OK ({len(cache)} entrées)[/dim]")
        return cache

    try:
        requests.get(f"{OLLAMA_SERVER}/api/tags", timeout=5).raise_for_status()
    except Exception:
        console.print("[yellow]⚠ Ollama inaccessible — génération sans description.[/yellow]")
        return cache

    console.print(Panel(
        f"[bold cyan]llava-phi3[/bold cyan] — {len(missing)} image(s) à décrire",
        title="[bold]Vision[/bold]", border_style="cyan"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Descriptions", total=len(missing))
        for img_path, name in missing:
            progress.update(task, description=f"[cyan]{name}[/cyan]")
            img_b64 = base64.b64encode(img_path.read_bytes()).decode()
            r = requests.post(
                f"{OLLAMA_SERVER}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": DESCRIBE_PROMPT, "images": [img_b64], "stream": False},
                timeout=120,
            )
            r.raise_for_status()
            description = r.json()["response"].strip()
            cache[name] = description
            DESCRIPTIONS_FILE.write_text(
                json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            progress.advance(task)
            console.print(f"  [green]✓[/green] [bold]{name}[/bold]")
            console.print(f"    [dim]{description[:200]}[/dim]")

    # Décharge llava de la VRAM avant ComfyUI
    requests.post(
        f"{OLLAMA_SERVER}/api/generate",
        json={"model": OLLAMA_MODEL, "keep_alive": 0},
        timeout=15,
    )
    console.print("[dim]llava-phi3 déchargé de la VRAM.[/dim]\n")
    return cache


# ── ComfyUI client ────────────────────────────────────────────────────────────

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
        raise TimeoutError(f"Timeout ({POLL_TIMEOUT_SECONDS}s)")

    def fetch_image(self, filename: str, subfolder: str, type_: str) -> bytes:
        params = urlencode({"filename": filename, "subfolder": subfolder, "type": type_})
        r = self.session.get(f"{self.base_url}/view?{params}", timeout=60)
        r.raise_for_status()
        return r.content


def build_workflow(template: dict, server_image_ref: str, positive: str, negative: str, seed: int, description: str = "") -> dict:
    wf = copy.deepcopy(template)
    wf[LOAD_IMAGE_NODE_ID]["inputs"]["image"] = server_image_ref
    full_positive = f"{positive}, {description}" if description else positive
    wf[POSITIVE_NODE_ID]["inputs"]["text"] = full_positive
    wf[NEGATIVE_NODE_ID]["inputs"]["text"] = negative
    wf[SEED_NODE_ID]["inputs"]["seed"] = seed
    return wf


def save_as_jpg(png_bytes: bytes, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(png_bytes)) as img:
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(target, format="JPEG", quality=JPEG_QUALITY, optimize=True)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    if len(sys.argv) >= 2:
        image_paths = [(Path(p), Path(p).stem) for p in sys.argv[1:]]
    else:
        image_paths = [(SCRIPT_DIR / path, name) for path, name in HARDCODED_IMAGES]

    for p, _ in image_paths:
        if not p.exists():
            console.print(f"[red]✗ Fichier introuvable : {p}[/red]")
            return 1

    n_images = len(image_paths)
    n_styles = len(STYLES)
    wf_data = json.loads(DEFAULT_WORKFLOW.read_text(encoding="utf-8"))
    ks = wf_data["3"]["inputs"]
    cn = wf_data["17"]["inputs"]
    ckpt = wf_data["4"]["inputs"]["ckpt_name"]
    config_lines = (
        f"[bold]{n_styles} styles × {n_images} image(s)[/bold] = [bold cyan]{n_styles * n_images} rendus[/bold cyan]\n\n"
        f"[dim]checkpoint [/dim]{ckpt}\n"
        f"[dim]denoise    [/dim]{ks['denoise']}  [dim]cfg [/dim]{ks['cfg']}  [dim]steps [/dim]{ks['steps']}  "
        f"[dim]sampler [/dim]{ks['sampler_name']}/{ks['scheduler']}\n"
        f"[dim]canny      [/dim]strength {cn['strength']}  start {cn['start_percent']}  end {cn['end_percent']}"
    )
    console.print(Panel(config_lines, title="[bold]GeoTrade — Style Tester[/bold]", border_style="yellow"))

    descriptions = ensure_descriptions(image_paths)

    workflow_template = json.loads(DEFAULT_WORKFLOW.read_text(encoding="utf-8"))

    client = ComfyClient(DEFAULT_SERVER)
    try:
        client.session.get(f"{client.base_url}/system_stats", timeout=5).raise_for_status()
        console.print("[green]✓ ComfyUI connecté[/green]\n")
    except Exception as exc:
        console.print(f"[red]✗ ComfyUI inaccessible : {exc}[/red]")
        return 1

    tasks = [(style, img_path, folder) for style in STYLES for img_path, folder in image_paths]
    todo = [(s, p, f) for s, p, f in tasks
            if not (TEST_OUTPUT_DIR / f / s["name"]).with_suffix(".jpg").exists()]
    skipped = len(tasks) - len(todo)

    if skipped:
        console.print(f"[dim]↷ {skipped} rendu(s) déjà existants — skippés[/dim]\n")
    if not todo:
        console.print("[green]Tout est déjà généré.[/green]")
        return 0

    failed: list[tuple[str, str, Exception]] = []
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
        task = progress.add_task(f"Génération", total=len(todo))

        for style, img_path, folder in todo:
            label = f"[cyan]{style['name']}[/cyan] / [bold]{folder}[/bold]"
            progress.update(task, description=label)
            target = (TEST_OUTPUT_DIR / folder / style["name"]).with_suffix(".jpg")
            t0 = time.monotonic()
            try:
                server_ref = client.upload_image(img_path)
                desc = descriptions.get(folder, "")
                full_positive = f"{desc}, {style['positive']}" if desc else style["positive"]
                progress.print(f"    [dim]+ {full_positive}[/dim]")
                progress.print(f"    [dim]- {style['negative']}[/dim]")
                wf = build_workflow(workflow_template, server_ref, style["positive"], style["negative"], random.randint(0, 2**31 - 1), desc)
                prompt_id = client.queue_prompt(wf)
                outputs = client.wait_for_completion(prompt_id)
                save_node = outputs.get(SAVE_IMAGE_NODE_ID)
                if not save_node or not save_node.get("images"):
                    raise RuntimeError(f"Pas d'image en sortie")
                img_info = save_node["images"][0]
                png_bytes = client.fetch_image(img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output"))
                save_as_jpg(png_bytes, target)
                elapsed = time.monotonic() - t0
                done += 1
                progress.print(f"  [green]✓[/green] {label}  [dim]{elapsed:.0f}s[/dim]")
            except Exception as exc:
                elapsed = time.monotonic() - t0
                failed.append((style["name"], folder, exc))
                progress.print(f"  [red]✗[/red] {label}  [dim]{elapsed:.0f}s — {exc}[/dim]")
            progress.advance(task)

    total_time = time.monotonic() - start_all

    # ── Résumé ────────────────────────────────────────────────────────────────
    table = Table(title="Résumé", border_style="yellow", show_header=True)
    table.add_column("", style="bold")
    table.add_column("", justify="right")
    table.add_row("[green]✓ Succès[/green]", str(done))
    table.add_row("[dim]↷ Skippés[/dim]", str(skipped))
    if failed:
        table.add_row("[red]✗ Échecs[/red]", str(len(failed)))
    table.add_row("[dim]Durée totale[/dim]", f"{total_time / 60:.1f} min")
    if done:
        table.add_row("[dim]Temps moyen/rendu[/dim]", f"{total_time / (done + len(failed)):.0f}s")
    console.print(table)

    if failed:
        console.print("\n[red bold]Échecs :[/red bold]")
        for s, img, exc in failed:
            console.print(f"  [red]✗[/red] {s} / {img} — {exc}")
        return 2

    console.print(f"\n[green bold]Résultats dans :[/green bold] {TEST_OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
