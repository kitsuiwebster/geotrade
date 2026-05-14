# Img2img — Statut & prochaines étapes

Setup côté Linux terminé et pushé.

## ✅ Fait

- `geotrade/img2img/` créé et committé (commits `88e8342` + `88b19ec`)
- 6 fichiers en place : `prepare.py`, `batch.py`, `workflow.json`, `requirements.txt`, `.gitignore`, `README.md`
- `input/` et `output/` gitignorés (vides pour l'instant, normal)
- Tout syntaxiquement validé

## ⏳ Reste à faire (sur la machine Windows 11 + RTX)

1. Cloner geotrade
2. Installer ComfyUI portable
3. Télécharger Juggernaut XL → `models/checkpoints/`
4. `cd img2img`, venv + `pip install -r requirements.txt`
5. `python prepare.py` (~1553 images à redimensionner, quelques minutes)
6. Lancer ComfyUI dans un autre terminal
7. Tester 1 image manuellement dans l'UI ComfyUI (drag & drop du `workflow.json`) pour valider le style avant le batch
8. `python batch.py` (4–10h overnight)

Toutes les étapes Windows sont détaillées dans `README.md`.
