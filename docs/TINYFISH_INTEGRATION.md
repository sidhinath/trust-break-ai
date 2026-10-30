# GhostNet AI — TinyFish API Web Automation Integration

This document details the architectural design, security controls, server-side implementation, API contracts, local setup, and testing procedures for the **TinyFish Web Automation** integration in GhostNet AI.

---

## 1. Overview & Objectives

TinyFish API (`https://agent.tinyfish.ai/v1/automation/run-sse`) powers GhostNet's live browser investigation engine. It enables automated, server-side read-only inspection of suspicious websites to extract DOM text, title claims, payment forms, credential harvesting attempts, and coercive patterns without exposing users or client applications to hostile execution.

---

## 2. Architecture & Data Flow

```
[ GhostNet Web / Android App ]
             │
             │ POST /api/tinyfish/investigate { url }
             ▼
[ Vercel Edge Serverless Function ]
  ├── 1. SSRF & Scheme Validation (http/https only, blocks localhost/169.254.169.254/private IPs)
  ├── 2. Per-IP Rate Limiting (max 10 req/min)
  ├── 3. Server-Only TINYFISH_API_KEY Secret Management
  │
  ▼ (POST https://agent.tinyfish.ai/v1/automation/run-sse)
[ TinyFish Agent Service ]
  │   └── Live Browser Read-Only Automation (Stealth Profile)
  │
  ▼ (Server-Sent Events: text/event-stream)
[ SSE Stream Parser & Event Normalization ]
  │   └── Captures progress, observations, risk indicators, limitations
  │
  ▼
[ GhostNet Threat Evidence Evaluator ]
  │   └── Combines TinyFish observations with GhostNet URL heuristics
  │
  ▼
[ Unified Verdict & UI Investigation Card ]
```

---

## 3. Environment Variable Configuration

| Variable | Scope | Exposure | Description |
|:---|:---:|:---:|:---|
| `TINYFISH_API_KEY` | **Server-Only Secret** | Server Functions (`api/`) | Server-side TinyFish automation API key. **NEVER prefix with `VITE_`.** |

### Local Setup
Add your key to `.env.local`:
```bash
TINYFISH_API_KEY=sk-tinyfish-your-api-key
```

### Production Deployment (Vercel)
1. Go to **Vercel Dashboard ➔ Project Settings ➔ Environment Variables**.
2. Key: `TINYFISH_API_KEY`
3. Value: `sk-tinyfish-...`
4. Target: **Production**, **Preview**, **Development**.

---

## 4. API Endpoints & Request / Response Specifications

### `POST /api/tinyfish/investigate`

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <user_jwt> (optional)
```

#### Request Body
```json
{
  "url": "https://suspicious-phishing-portal.com/login"
}
```

#### Response Body (`HTTP 200 OK`)
```json
{
  "fraud_score": 92,
  "risk_level": "scam",
  "confidence": "high",
  "reasons": [
    "Lookalike domain mimicking PayPal",
    "[TinyFish Observation] Requests credentials or authentication codes (OTP/Password)",
    "[TinyFish Observation] Employs urgency or threat scare tactics"
  ],
  "analysis": "Live browser inspection observed a fake banking portal attempting to harvest credentials.",
  "attack_intent": "Harvest banking credentials and OTP codes.",
  "source": "tinyfish-agent",
  "reasonCodes": [
    "REQUEST_OTP_PASSWORD",
    "URGENCY_SCARE_TACTICS font-bold",
    "LOOKALIKE_DOMAIN"
  ],
  "tinyfishInvestigation": {
    "investigationId": "tf-1728562300-a8f9x",
    "url": "https://suspicious-phishing-portal.com/login",
    "status": "completed",
    "websiteTitle": "PayPal Security Verification",
    "websitePurpose": "Credential harvesting form",
    "observations": [
      "Displayed fake PayPal logo and login prompt",
      "Countdown timer of 5 minutes shown"
    ],
    "riskIndicators": [
      "Requests credentials or authentication codes (OTP/Password)"
    ],
    "limitations": [],
    "timestamp": "2026-10-10T12:00:00.000Z"
  }
}
```

---

## 5. Security & SSRF Protection Controls

1. **Zero Client Secret Exposure:**
   `TINYFISH_API_KEY` is loaded strictly inside serverless handlers (`api/tinyfish/investigate.js`). It is never bundled into frontend JavaScript, Android assets, or public responses.

2. **Server-Side SSRF Protection (`isProhibitedTarget`):**
   Blocks all requests targeting:
   - `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`.
   - Cloud Metadata endpoints (`169.254.169.254`).
   - Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
   - Private TLDs (`.local`, `.internal`, `.lan`, `.home`, `.arpa`).

3. **Strict Scheme & Length Guardrails:**
   - Accepts exclusively `http:` and `https:` schemes. Rejects `file:`, `ftp:`, `javascript:`, `data:`, `gopher:`.
   - Enforces maximum URL length of **2048 characters**.

4. **Abuse & Rate Limit Protection:**
   Per-IP rate limiting allows a maximum of **10 investigation requests per minute**.

5. **Read-Only Agent Goal Safety Contract:**
   The TinyFish automation agent is given a strict goal prompt mandating:
   - NO form submissions or button clicks.
   - NO credential/OTP entries or financial transfers.
   - NO file downloads or prompt injection execution.

---

## 6. Testing & Quality Verification

Run the full automated test suite:
```bash
npm test
```

### Verified Test Suites (`tests/tinyfish.test.js`):
- Goal Construction & Read-Only Safety Rules.
- SSE Stream Chunk & Multiline Parsing (`parseSseBuffer`).
- Result Normalization (`normalizeTinyFishResult`).
- SSRF & Prohibited IP Target Rejections.
- Error Code Handling (`MISSING_TINYFISH_KEY`, `INVALID_API_KEY`, `RATE_LIMIT_EXCEEDED`, `TIMEOUT`).

---

## 7. Rollback Instructions

If a emergency recovery to pre-integration state is required:
```bash
# View rollback instructions
cat docs/TINYFISH_ROLLBACK.md

# Switch back to baseline branch
git checkout main
```
