# Stability AI

```bash
 ash@alakazam  ~/Desktop  curl -sS -X POST "https://api.stability.ai/v2beta/stable-image/generate/core" \
  -H "Authorization: Bearer {stability_ai_api_key}" \
  -H "Accept: image/*" \
  -F "prompt=stylized toulouse" \
  -F "aspect_ratio=16:9" \
  -F "output_format=png" \
  -o "./generated.png"
```