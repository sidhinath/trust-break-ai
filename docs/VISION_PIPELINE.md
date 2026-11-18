# Vision / Screenshot Scanner Pipeline

How a screenshot becomes a verdict, where each failure can occur, and how to
debug it in production.

## Flow

```
ScreenshotScanner.jsx
  └─ analyzeScreenshot(file)                     src/lib/api.js
       ├─ toScreenshotPayload()                  File → canvas → 1280px JPEG → base64
       ├─ POST /api/analyze  { type:'screenshot', payload:{ image_base64, mime_type } }
       │    └─ api/analyze.js
       │         ├─ resolveGeminiKey()           header → GEMINI_API_KEY → aliases
       │         ├─ normalizeImageBase64()       strips data: prefix, validates base64
       │         ├─ Gemini  (gemini-2.5-flash → gemini-flash-latest → 2.0-flash → 2.5-flash-lite)
       │         ├─ Groq Llama-4 Vision          (if GROQ_API_KEY is set)
       │         └─ OpenAI gpt-4.1-mini          (only for screenshot_url)
       └─ if server returned `unverified` → retry with the browser's own Gemini key
```

Every provider result is normalised by `normalizeVisionResult()` in
`src/lib/vision.js`, which is shared by the API route and the browser client.

## API keys

Accepted environment variable names (checked in this order, server side):

| Order | Name |
|---|---|
| 1 | `GEMINI_API_KEY` ← use this |
| 2 | `GOOGLE_GENERATIVE_AI_API_KEY` |
| 3 | `GOOGLE_API_KEY` |
| 4 | `GEMINI_KEY` |
| 5 | `VITE_GEMINI_API_KEY` |

A key pasted in **Security & Settings → AI Keys** is stored in `localStorage`
under `trustbreak_gemini_api_key` and sent on every request as the
`x-gemini-api-key` header. The header always wins over the environment.

## Diagnostics

`GET /api/vision-health` → key detection, which env vars were checked, the key
fingerprint (never the key), and the model chain.

`GET /api/vision-health?probe=1` → also sends a minimal text prompt to
`gemini-2.5-flash` and returns Google's exact HTTP status and error message.

The scanner UI also exposes:

- a human-readable reason code,
- a **Run vision diagnostics** button (calls the endpoint above),
- a collapsible **Scan diagnostics** block with every model attempt.

## Degraded reason codes

| `degraded_reason` | Meaning | Fix |
|---|---|---|
| `no-image-payload` | The image never reached the server | Check the browser console for `Image preprocessing failed`; canvas may be blocked |
| `invalid-image-payload` | Base64 rejected before the API call | Re-upload the file |
| `image-download-failed` | `screenshot_url` could not be fetched | Use a direct upload instead |
| `gemini-key-missing` | No key in the header or any accepted env var | Add `GEMINI_API_KEY` in Vercel and redeploy |
| `gemini-timeout` | No response within `VISION_TIMEOUT_MS` (45s) | Raise the limit or check regional latency |
| `gemini-call-failed` | Google returned 4xx/5xx for every model | Read `vision_diagnostics.attempts[].error` — usually *API not enabled*, *key restricted*, or *quota* |
| `vision-providers-failed` | Gemini and Groq both rejected the request | Verify both keys |

A degraded response is **not** a risk verdict: `fraud_score` is `0` with
`unverified: true`, and the UI shows “Image not analyzed” instead of a score.

## Common production failures

- **`API key not valid`** — key copied with quotes/spaces, or it belongs to a
  different Google Cloud project. `inspectKey()` trims quotes and rejects
  placeholders; the diagnostics show the exact reason string.
- **`Generative Language API has not been used in project … or it is disabled`**
  — enable the Generative Language API for that project in Google Cloud.
- **`Requests from referer … are blocked`** — the key has HTTP-referrer
  restrictions. Create a server key with no application restrictions.
- **Key set for Preview but testing Production** — `runtime.vercelEnv` in the
  health report shows which environment answered.
- **Old deployment** — if `/api/vision-health` returns HTML/404, the project was
  not redeployed after the change.
