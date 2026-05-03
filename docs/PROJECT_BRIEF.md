# Projet : Batch Style Transfer – Photos → Dessin/Aquarelle

## Objectif

Transformer automatiquement **1500 photos de paysages** en images stylisées (dessin, aquarelle, etc.) via un pipeline batch local, **sans coût**.

---

## Stack technique cible

- **ComfyUI** – interface et API locale de diffusion (img2img)
- **Stable Diffusion XL** – modèle de génération (checkpoint local, ex: DreamShaper XL)
- **Python** – script batch qui boucle sur les images et appelle l'API REST de ComfyUI
- **Matériel** : Windows + GPU NVIDIA RTX (VRAM ≥ 6 GB)

---

## Architecture du projet

```
project-style-transfer/
├── input/            # 1500 photos originales (.jpg / .png)
├── output/           # images stylisées générées
├── workflow.json     # workflow ComfyUI exporté (img2img)
├── batch.py          # script principal à créer
└── requirements.txt  # dépendances Python
```

---

## Ce que doit faire `batch.py`

1. Lister toutes les images dans `input/`
2. Pour chaque image :
   - L'encoder en base64 (ou l'uploader via l'API ComfyUI)
   - Envoyer une requête POST à `http://localhost:8188/prompt` avec le workflow img2img
   - Attendre la fin du job (polling sur `/history`)
   - Récupérer l'image générée et la sauvegarder dans `output/` avec le même nom de fichier
3. Logger la progression (image X / 1500)
4. Gérer les erreurs sans stopper le batch (continuer sur l'image suivante)

---

## Paramètres img2img à utiliser

| Paramètre | Valeur recommandée |
|---|---|
| Prompt | `watercolor landscape painting, detailed, artistic` |
| Negative prompt | `photo, realistic, blurry, ugly` |
| Denoising strength | `0.55` (fidèle au contenu, stylisé) |
| Steps | `25` |
| CFG Scale | `7` |
| Sampler | `DPM++ 2M Karras` |

---

## Prérequis avant de lancer le script

- [ ] ComfyUI installé et lancé sur `http://localhost:8188`
- [ ] Checkpoint SDXL placé dans `ComfyUI/models/checkpoints/`
- [ ] `workflow.json` exporté depuis ComfyUI (workflow img2img fonctionnel testé manuellement)
- [ ] Dossier `input/` rempli avec les 1500 images
- [ ] Dossier `output/` créé et vide

---

## Estimation

- ~10–30 secondes par image selon le GPU
- **1500 images ≈ 4 à 12 heures de calcul en continu**
- Prévoir de lancer le batch overnight

---

## Ce qui est à créer

- `batch.py` – script Python complet
- `requirements.txt` – dépendances (requests, Pillow, tqdm)
- *(optionnel)* `workflow.json` – template de workflow ComfyUI img2img de base
