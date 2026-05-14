# img2img — Usage

ComfyUI doit tourner sur `http://127.0.0.1:8188` pour tous les scripts.

## Batch complet (idempotent)

```powershell
cd img2img
python prepare.py   # copie + redimensionne src/assets/images/cards/ → input/
python batch.py     # stylise input/ → output/ (saute les fichiers déjà faits)
```

Relancer après ajout de nouvelles cartes : `prepare.py` puis `batch.py` — seuls les fichiers manquants sont traités.

## Test de styles

```powershell
cd img2img
python test_styles.py "input\city\france\paris.jpg" "input\sea\mediterranean.jpg"
```

Passe les images en argument (autant que voulu). Génère 10 styles par image dans `test_output/<lieu>/<style>.jpg`.

Une fois satisfait du style, copier les rendus dans les assets Angular :

```powershell
Copy-Item -Recurse -Force "img2img\test_output\*" "src\assets\styles-test\"
```

## Paramètres clés (`workflow.json`)

| Param | Valeur | Effet |
|---|---|---|
| `denoise` | 0.6 | Fidélité au contenu (↓ = plus fidèle) |
| `strength` | 0.85 | Force du ControlNet Canny (↑ = structure plus stricte) |
| `cfg` | 5.0 | Adhérence au prompt (↓ = couleurs plus naturelles) |
| `ckpt_name` | `juggernautXL_ragnarokBy.safetensors` | Checkpoint SDXL |
