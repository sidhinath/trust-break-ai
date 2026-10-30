# REST API Reference Specification

GhostNet AI exposes four serverless edge microservices designed for low latency, resilient failover, and zero-trust authentication.

---

## Microservices Overview

| Method | Path | Function / Purpose | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/analyze` | Multi-modal threat scanner for messages, links, screenshots, and threat indicators. | Optional (Public with rate-limits) |
| `POST` | `/api/analyze-voice` | Synthetic voice and deepfake call detector (Wiener flatness + Whisper STT). | Optional (`ENABLE_VOICE_SCANNER=true`) |
| `POST` | `/api/tinyfish/investigate` | Autonomous web investigation agent executing headless browser analysis. | Optional (Client API / Serverless) |
| `GET` | `/api/blocklist-lite` | Low-latency plaintext SHA-256 domain hash stream for browser pre-click defense. | None (`ENABLE_PRE_CLICK_INTERCEPTOR=true`) |
| `GET` / `POST` | `/api/cron/sync-feeds` | Scheduled public threat feed sync (OpenPhish + URLhaus). | `Bearer <CRON_SECRET>` |

---

## 1. `POST /api/analyze`

The primary multi-modal intelligence gateway. Evaluates text messages, URLs, screenshots, and community reports.

### Request Headers
```http
Content-Type: application/json
```

### Request Payloads

#### A. Message / SMS / Smishing Scan
```json
{
  "type": "message",
  "payload": {
    "message": "URGENT: Your SBI bank account has been blocked due to missing KYC. Update immediately at https://sbi-kyc-verify.top or funds will be seized within 24 hours."
  }
}
```

#### B. Link / URL Domain Inspection
```json
{
  "type": "link",
  "payload": {
    "url": "https://paypal-security-verification.com/login"
  }
}
```

#### C. Screenshot Vision Analysis
```json
{
  "type": "screenshot",
  "payload": {
    "screenshot_url": "https://your-supabase-project.supabase.co/storage/v1/object/public/evidence/sample-evidence.png"
  }
}
```

#### D. Community Scam Report Syndication
```json
{
  "type": "report",
  "payload": {
    "report_type": "message",
    "scam_content": "Caller claimed electricity bill unpaid and instructed to install QuickSupport APK",
    "phone_number": "+919876543210",
    "url": "https://fake-bill-pay.in",
    "region": "India"
  }
}
```

### Successful Response (`200 OK`)
```json
{
  "riskScore": 92,
  "riskLevel": "high",
  "threatType": "Financial Smishing & KYC Phishing",
  "socialEngineeringTactics": [
    "Fabricated time-sensitive bank penalty",
    "Coercive urgency threat",
    "Unverified lookalike domain"
  ],
  "reasonCodes": [
    "URGENCY_SCARE_TACTICS",
    "IMPERSONATION_BRAND",
    "SUSPICIOUS_DOMAIN"
  ],
  "source": "ai",
  "intent": "Attacker is attempting to harvest banking credentials and OTP tokens via a fraudulent portal.",
  "threatReconstruction": [
    {
      "step": 1,
      "phase": "Ingress Vector",
      "description": "Unsolicited SMS received from an unverified long-code sender."
    },
    {
      "step": 2,
      "phase": "Social Engineering Cue",
      "description": "Fake KYC deadline creates panic regarding account suspension."
    },
    {
      "step": 3,
      "phase": "Phishing Gateway",
      "description": "User is redirected to the typosquatting domain sbi-kyc-verify.top."
    },
    {
      "step": 4,
      "phase": "Credential Harvesting",
      "description": "Victim is prompted for NetBanking username, password, and OTP."
    },
    {
      "step": 5,
      "phase": "Loss & Impact",
      "description": "Adversary drains bank accounts via unauthorized fund transfers."
    }
  ],
  "recommendedActions": [
    "Do NOT click the provided link or download attachments",
    "Call the official State Bank of India customer service number",
    "Report the incident to the National Cyber Crime Helpline (1930)"
  ],
  "familyAdvice": "This is a fake bank message trying to steal your savings. Ignore it and do not tap the link."
}
```

---

## 2. `POST /api/analyze-voice`

Acoustic and linguistic analysis of suspected voice calls, deepfake synthetic speech, and robotic extortion messages.

### Request Headers
```http
Content-Type: application/json
```

### Request Payload
```json
{
  "audioBase64": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8...",
  "mimeType": "audio/webm"
}
```

### Payload Guardrails
* **HTTP 413 Payload Too Large:** Rejects base64 strings exceeding 6MB (~4.5MB binary audio) to prevent serverless memory overflow.
* **HTTP 404 Feature Disabled:** Returns `404 Not Found` if `ENABLE_VOICE_SCANNER` is not set to `true`.

### Successful Response (`200 OK`)
```json
{
  "riskScore": 88,
  "riskLevel": "high",
  "transcription": "This is Officer Sharma from Delhi Police Customs. A parcel under your name contains narcotics. Transfer bail amount immediately to avoid digital arrest.",
  "isSyntheticAudio": true,
  "confidence": "high",
  "spectralFeatures": {
    "spectralFlatness": 0.524,
    "highFrequencyRatio": 0.412,
    "zeroCrossingRate": 0.185,
    "jitter": 0.042
  },
  "linguisticSignals": [
    "Digital arrest coercion",
    "Police authority impersonation",
    "Immediate financial transfer demand"
  ],
  "reasonCodes": [
    "URGENCY_SCARE_TACTICS",
    "IMPERSONATION_BRAND",
    "PAYMENT_REDIRECT",
    "THREAT_BLACKMAIL"
  ],
  "source": "voice-ai",
  "recommendedActions": [
    "Hang up immediately — law enforcement never conducts arrests over video or phone",
    "Do not transfer funds to any 'safe government account'",
    "Report the calling number to the Cyber Crime Portal"
  ]
}
```

---

## 3. `GET /api/blocklist-lite`

Optimized low-latency hash stream for client-side pre-click link interception in the Chrome extension and browser sandbox.

### Request
```http
GET /api/blocklist-lite
```

### Response (`200 OK`)
```
# GhostNet AI Public Blocklist Lite
# Format: SHA-256 (hex) | Domain
# Updated: 2026-09-12T16:00:00.000Z
a8b2c4e5f6... paypal-update-security.com
d4e5f6a1b2... sbi-kyc-verification.top
9f8e7d6c5b... fedex-tracking-parcel-id.online
```

---

## 4. `GET|POST /api/cron/sync-feeds`

Automated scheduled synchronization worker that fetches, extracts, hashes, and upserts public threat intelligence feeds from OpenPhish and URLhaus into the Supabase database.

### Request Headers
```http
Authorization: Bearer <CRON_SECRET>
```

### Security Enforcement
* Rejects with `HTTP 401 Unauthorized` if `CRON_SECRET` is not configured on the server.
* Rejects with `HTTP 401 Unauthorized` if the bearer token does not match `CRON_SECRET`.
* Rejects unsupported HTTP methods with `HTTP 405 Method Not Allowed`.

### Response (`200 OK`)
```json
{
  "ok": true,
  "openPhish": {
    "fetched": 1250,
    "upserted": 1250
  },
  "urlhaus": {
    "fetched": 3420,
    "upserted": 3420
  },
  "totalProcessed": 4670,
  "timestamp": "2026-09-12T00:00:05.123Z"
}
```

---

## 5. Common Error Responses

All endpoints adhere to standardized JSON error envelopes:

```json
{
  "error": "Human-readable error description",
  "code": "ERROR_CODE_STRING",
  "details": null
}
```

| HTTP Status | Meaning | Typical Trigger |
|:---:|:---|:---|
| `400` | Bad Request | Missing required `type` or `payload` property. |
| `401` | Unauthorized | Missing or invalid `CRON_SECRET` on cron endpoints. |
| `404` | Not Found | Feature flag disabled for the requested endpoint. |
| `405` | Method Not Allowed | Sending `POST` to a `GET`-only route or vice-versa. |
| `413` | Payload Too Large | Audio payload exceeding the 6MB serverless threshold. |
| `500` | Internal Error | Unhandled server exception (automatically falls back to local heuristics). |
| `504` | Gateway Timeout | AI provider exceeded the 9000ms deadline (handled by `withTimeout`). |
