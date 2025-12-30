# Stability AI

```bash
 curl -sS -X POST "https://api.stability.ai/v2beta/stable-image/generate/core" \
  -H "Authorization: Bearer {stability_ai_api_key}" \
  -H "Accept: image/*" \
  -F "prompt=stylized toulouse" \
  -F "aspect_ratio=16:9" \
  -F "output_format=png" \
  -o "./generated.png"
```

```bash
curl -sS -X POST "https://api.stability.ai/v2beta/stable-image/generate/core" \
  -H "Authorization: Bearer $STABILITY_KEY" \
  -H "Accept: image/*" \
  -F "image=@input.png" \
  -F "prompt=stylized illustration of Toulouse, warm southern colors, river city, abstract skyline, collectible card game art, no real landmarks" \
  -F "strength=0.35" \
  -F "aspect_ratio=16:9" \
  -F "output_format=png" \
  -o "./generated.png"
```

Une image de cette résolution = 2 credit
100 credit = 2$
10k images = 400$