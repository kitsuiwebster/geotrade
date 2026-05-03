# Geotrade — Batch Style Transfer (img2img)

Transforme les ~1500 photos des cartes de Geotrade en illustrations premium
(encre + aquarelle, style éditorial) via **ComfyUI** + **Stable Diffusion XL**.

Pipeline en 2 étapes :

1. **`prepare.py`** — copie `src/assets/images/cards/` → `img2img/input/`
   en redimensionnant à **1344×768** (ratio match du `card-image-container`
   de l'UI), conversion JPG, structure miroir.
2. **`batch.py`** — pour chaque image de `input/`, appelle ComfyUI en
   img2img et écrit le rendu stylisé dans `output/`.

Les deux scripts sont **idempotents** : ils sautent les fichiers déjà
produits. Tu peux donc les relancer à volonté quand tu ajoutes de nouvelles
cartes.

---

## Pré-requis (à faire **une seule fois** sur Windows 11)

### 1. Vérifier la GPU
Ouvre PowerShell et lance :
```powershell
nvidia-smi
```
Tu dois voir ta RTX listée. VRAM minimum recommandée : **8 Go** (6 Go OK
mais lent).

### 2. Installer ComfyUI portable

1. Télécharge la version Windows portable :
   <https://github.com/comfyanonymous/ComfyUI/releases> →
   `ComfyUI_windows_portable_nvidia.7z`
2. Décompresse-la quelque part (ex. `D:\ComfyUI_windows_portable\`).
3. Lance `run_nvidia_gpu.bat`. Au premier démarrage, ça télécharge des
   dépendances. Tu dois finir par voir :
   ```
   Starting server
   To see the GUI go to: http://127.0.0.1:8188
   ```
4. Ouvre <http://127.0.0.1:8188> dans le navigateur pour vérifier.

### 3. Télécharger un checkpoint SDXL

Le `workflow.json` référence **`juggernautXL_v9.safetensors`**. C'est un
checkpoint SDXL gratuit et excellent en illustration.

1. Va sur <https://civitai.com/models/133005/juggernaut-xl> (compte
   Civitai gratuit requis pour télécharger).
2. Télécharge la dernière version (~6,5 Go).
3. Place le fichier dans :
   `ComfyUI_windows_portable\ComfyUI\models\checkpoints\`

> **Alternative** : si tu préfères un autre checkpoint SDXL (DreamShaper
> XL, RealVisXL, etc.), place-le dans le même dossier puis modifie le
> champ `ckpt_name` dans `workflow.json` au nom exact du fichier.

### 4. Installer Python (si pas déjà fait)

Python 3.10+ depuis <https://www.python.org/downloads/>. Coche
**"Add python.exe to PATH"** à l'install.

Vérification :
```powershell
python --version
```

### 5. Installer les dépendances Python du projet

Depuis le dossier `img2img/` (sur Windows, après avoir cloné le repo) :
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## Lancer le batch

Toujours depuis `img2img/` avec le venv activé :

### Étape 1 — préparer les images
```powershell
python prepare.py
```
Lit `..\src\assets\images\cards\` (récursif), écrit dans `input\`. Skippe
ce qui existe déjà. Compte attendu : ~1553 fichiers, quelques secondes
chacun en CPU.

### Étape 2 — lancer ComfyUI
Dans une **autre** fenêtre PowerShell :
```powershell
cd D:\ComfyUI_windows_portable
run_nvidia_gpu.bat
```
Laisse tourner. Tu dois voir le serveur prêt sur le port 8188.

### Étape 3 — lancer le batch img2img
Dans la première fenêtre (avec venv activé) :
```powershell
python batch.py
```
Le script :
- vérifie que ComfyUI répond
- pour chaque image de `input\` (récursif), upload + queue + poll +
  download + sauvegarde JPG dans `output\`
- montre une barre de progression `tqdm`
- continue sur l'image suivante en cas d'erreur (les échecs sont logués)

**Estimation** : ~10–25 s/image selon la GPU. 1500 images ≈ **4 à 10h**.
À lancer overnight.

### Re-runs
Relance simplement `prepare.py` puis `batch.py` après avoir ajouté de
nouvelles cartes. Les deux scripts ne re-traitent que les fichiers
manquants en sortie.

---

## Structure générée

```
img2img/
├── input/                  # généré par prepare.py (gitignoré)
│   ├── mountain/
│   │   ├── aconcagua.jpg   # 1344×768
│   │   └── ...
│   ├── city/<country>/<city>.jpg
│   └── ...
├── output/                 # généré par batch.py (gitignoré)
│   └── [structure miroir de input/]
├── batch.py
├── prepare.py
├── workflow.json
├── requirements.txt
├── .gitignore
└── README.md
```

`input/` et `output/` sont volontairement **exclus du git** (cf
`.gitignore`) — plusieurs Go d'images, à régénérer au besoin.

---

## Tuning (optionnel)

Tous les paramètres clés sont dans `workflow.json` (format API ComfyUI) :

| Champ | Node | Effet |
|---|---|---|
| `denoise` | `3.inputs.denoise` | 0.55 = stylisé tout en gardant le contenu. Baisse à 0.4 = plus fidèle, monte à 0.7 = plus créatif |
| `steps` | `3.inputs.steps` | 25 = bon équilibre qualité/temps. 30+ pour plus de détails |
| `cfg` | `3.inputs.cfg` | 7 = standard SDXL. Monte à 8–9 pour suivre le prompt plus strictement |
| `text` (pos) | `6.inputs.text` | Prompt positif (style "premium illustration") |
| `text` (neg) | `7.inputs.text` | Prompt négatif (anti-photo, anti-cartoon) |
| `ckpt_name` | `4.inputs.ckpt_name` | Nom exact du fichier checkpoint dans `models/checkpoints/` |

Pour tester un seul rendu avant de lancer 1500 images :
- ouvre l'UI ComfyUI dans le navigateur
- charge `workflow.json` (drag & drop)
- charge une image dans le node `Load Input Image`
- clique **Queue Prompt**
- ajuste `denoise` / prompt jusqu'à un rendu satisfaisant
- **réexporte le workflow** au format API (Settings → Enable Dev mode →
  bouton "Save (API Format)") et remplace `workflow.json`
