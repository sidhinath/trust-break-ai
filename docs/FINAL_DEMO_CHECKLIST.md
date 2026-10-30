# GhostNet AI — Final Production Demo Lock & Judging Checklist

This document is the authoritative quick-reference checklist for demonstrating GhostNet AI during hackathon judging and live product evaluations.

* **Live Production URL:** [https://ghost-net-zeta.vercel.app](https://ghost-net-zeta.vercel.app)
* **Local Fallback:** [http://localhost:5173](http://localhost:5173)

---

## 1. Pre-Demo Setup (1 Minute Before Judging)
- [ ] Open the live deployment at [https://ghost-net-zeta.vercel.app](https://ghost-net-zeta.vercel.app) (or `http://localhost:5173`).
- [ ] If prompted by the login gate, click **"⚡ Explore as Guest / Judge Demo Mode"** for instant access.
- [ ] Ensure browser permissions allow Camera and Microphone on the deployed domain.
- [ ] Verify the header displays **"PRO DEFENSE"** and theme is set to Dark Mode (default).

---

## 2. Required Environment Variables Matrix

| Variable | Scope | Sensitivity | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | Server-Only | High | Primary Google Gemini deep multimodal analysis |
| `GROQ_API_KEY` | Server-Only | High | Groq LPU sub-second inference & Whisper STT |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Critical | Batch threat feed synchronization & upserts |
| `CRON_SECRET` | Server-Only | High | Bearer token for scheduled feed sync |
| `VITE_SUPABASE_URL` | Client & Server | Low | Supabase endpoint URL |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Low | Supabase public anonymous queries & auth |
| `ENABLE_VOICE_SCANNER` | Server-Only | Low | Voice scanner endpoint toggle (`true`/`false`) |
| `ENABLE_PRE_CLICK_INTERCEPTOR` | Server-Only | Low | Blocklist lite endpoint toggle (`true`/`false`) |

---

## 3. Live Edge Deployment Verification
- [ ] Main Index: `GET /` returns `HTTP 200 OK`.
- [ ] `Permissions-Policy` header includes `camera=(self), microphone=(self)`.
- [ ] Security headers active: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
- [ ] `/api/blocklist-lite` serves plain-text threat domain hashes.

---

## 4. Exact SMS Test Input & Procedure
- **Page**: Navigate to `Message Scanner`.
- **Paste this exact text**:
  ```text
  URGENT: State Bank of India account blocked due to KYC. Update immediately at https://sbi-kyc-verify.top or funds will be frozen within 24 hours. Enter OTP to verify identity.
  ```
- **Click**: *"Inspect & Reconstruct Threat"*.
- **Verify**:
  - Score: `90-100 / 100` (`HIGH THREAT SCAM DETECTED`).
  - Attacker Objective explains banking credential and OTP interception.
  - 5-Stage Cyber Kill-Chain highlights *Ingress* -> *Social Engineering* -> *Phishing Gateway* -> *Credential Harvesting* -> *Loss*.
  - Standardized Reason Codes: `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `REQUEST_OTP_PASSWORD`, `SUSPICIOUS_DOMAIN`.

---

## 5. Exact URL Test Input & Procedure
- **Page**: Navigate to `Link Inspector`.
- **Paste this exact URL**:
  ```text
  https://paypal-security-verification.com/login
  ```
- **Click**: *"Inspect Link Safety"*.
- **Verify**:
  - Score: `85-95 / 100` (`HIGH THREAT SCAM DETECTED`).
  - Brand Mimicry flags *PayPal* (official: `paypal.com`).
  - Reason Codes: `SUSPICIOUS_DOMAIN`, `IMPERSONATION_BRAND`.
  - Click *"Launch Simulation"* to demonstrate the educational sandbox.

---

## 6. QR Camera Test Procedure
- **Page**: Navigate to `QR Code Inspector` (`/QRScanner`).
- **Option A (Physical Camera)**: Click *"Scan Camera"*, allow browser permissions, point at any QR code on screen.
- **Option B (1-Click Benchmark)**: Click *"Phishing Banking Portal QR"*.
- **Verify**: Instant payload decode and recursive routing to threat analysis.

---

## 7. Voice Deepfake Test Procedure
- **Page**: Navigate to `Voice & Audio Scam` (`/VoiceScanner`).
- **Option A (Physical Mic)**: Click *"Start Recording"*, speak 5 seconds, click *"Stop Recording"* -> *"Analyze Voice Safety"*.
- **Option B (1-Click Benchmark)**: Click *"Load Deepfake Police Scam Audio"*.
- **Verify**:
  - Acoustic indicator renders synthetic-voice probability with Wiener entropy score.
  - Transcript renders and social engineering signals are scored.

---

## 8. Global Threat Intelligence Verification
- **Page**: Navigate to `Global Threat Intelligence` (`/ScamHeatmap`).
- **Verify**:
  - Total Syndicated Threats count displays live community & synced indicators.
  - Interactive city nodes (Bengaluru, Mumbai, Delhi, London, New York) render with surge velocity.

---

## 9. Browser Shield Verification
- **Page**: Navigate to `Browser Shield & Ext` (`/BrowserShield`).
- **Verify**:
  - Pre-Click Interception Sandbox renders.
  - Hover and click test links to trigger the warning interstitial.

---

## 10. Offline Fallback Test
- Disconnect Wi-Fi or turn off network adapter.
- Run a message scan or link scan in the UI.
- **Verify**: The UI immediately displays a full verdict card tagged with `source: offline-heuristic` in `< 5ms`.

---

## 11. Final Quality Gates Record
- Automated Tests: **40 / 40 passing** (`tests/scanner.test.js` across 15 test suites).
- Linter: **0 errors** (`eslint . --quiet`).
- Typecheck: **0 errors** (`tsc -p ./jsconfig.json`).
- Build: **Clean production build** (`vite build` in `< 5s`).
- Git Diff Check: **0 whitespace or check errors** (`git diff --check`).
