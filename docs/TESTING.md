# Testing Strategy & Automated Quality Gates

GhostNet AI enforces automated quality gates ensuring zero regressions across core scanning algorithms, multi-modal failover paths, cryptographic data isolation, and API security.

---

## 1. Automated Test Execution

All automated tests utilize Node.js's native test runner (`node --test`), delivering lightning-fast, zero-dependency test execution in under **400ms**:

```bash
npm test
```

### Full Automated Quality Gate Commands
```bash
# 1. Automated Unit & Integration Tests (40/40 Passing)
npm test

# 2. Static Code Analysis (ESLint 9)
npm run lint

# 3. Strict TypeScript Compilation Check
npm run typecheck

# 4. Production Web Bundle Build
npm run build
```

---

## 2. Test Suite Breakdown (40/40 Tests Across 15 Suites)

File: [`tests/scanner.test.js`](file:///d:/LOQ/Documents/Hackathon%20Project/GhostNet%20ai/GhostNet-app/GhostNet-app/tests/scanner.test.js)

```
▶ GhostNet AI Scanner Engine Tests (7 tests)
  ✔ should extract social engineering signals from an urgent KYC SMS
  ✔ should reconstruct a 5-stage attack chain for scam messages
  ✔ should infer clear plain-English attacker intent for UPI scam
  ✔ should identify similar scam patterns from the threat benchmark library
  ✔ should flag lookalike domains and typosquatting in URL analysis
  ✔ should safely identify clean legitimate messages
  ✔ should verify the threat library has valid benchmark scenarios

▶ Feature 1 — Reason Code Filtering (4 tests)
  ✔ should pass all 10 known reason codes through the filter
  ✔ should filter out unknown / hallucinated reason codes
  ✔ should return empty array for null / undefined / non-array input
  ✔ should return empty array for empty array input

▶ Feature 2 — Extended Heuristic Patterns (4 tests)
  ✔ should flag IP-literal URLs as high risk
  ✔ should detect "verification code" as OTP-related keyword
  ✔ should detect "outstanding dues" as payment-related keyword
  ✔ should flag additional URL shortener domains (ow.ly)

▶ Feature 6 — Voice Acoustic & Spectral Scoring (3 tests)
  ✔ should compute spectral flatness within valid bounds (0 to 1)
  ✔ should return default baseline for empty / short audio
  ✔ should combine text risk score with acoustic anomaly signal

▶ Feature 1 & 2 — Deterministic Reason Code Inference (2 tests)
  ✔ should attach reasonCodes and source to analyzeMessageContent
  ✔ should attach reasonCodes and source to analyzeUrlContent

▶ Audit Repairs — withTimeout Helper (2 tests)
  ✔ should resolve normally when promise completes before timeout
  ✔ should reject with timeout error when promise exceeds deadline

▶ Audit Repairs — safeParseVerdict Parsing & Code Defense (3 tests)
  ✔ should parse clean JSON with valid reason codes and explanation
  ✔ should extract JSON from markdown code fences and filter invalid codes
  ✔ should return null for malformed or non-JSON input

▶ Audit Repairs — Threat Feed & Domain Normalization (2 tests)
  ✔ should hash normalized domain with SHA-256 hex string
  ✔ should extract lowercase hostname from standard and malformed URLs

▶ Audit Repairs — PostgREST Upsert on_conflict Query Param (1 test)
  ✔ should include on_conflict query string parameter when specified

▶ Audit Repairs — Supabase Read/Write Separation (1 test)
  ✔ should allow read client using anon key when service role key is absent

▶ Audit Repairs — Cron Endpoint Security (2 tests)
  ✔ should reject with 401 when CRON_SECRET is not configured on server
  ✔ should reject with 401 when authorization token does not match CRON_SECRET

▶ Audit Repairs — Voice Scanner API Failure Modes (4 tests)
  ✔ should return 404 when voice scanner feature flag is disabled
  ✔ should reject unsupported HTTP methods with 405
  ✔ should fall back to safe baseline analysis when audio is empty/silent
  ✔ should reject oversized audio payload with 413 Payload Too Large

▶ Audit Repairs — Client Production Offline Fallback (1 test)
  ✔ should fall back to local heuristic analysis when network fetch fails

▶ Audit Repairs — Threat Feed Ingestion Logic (2 tests)
  ✔ should parse OpenPhish text feed lines into valid domains
  ✔ should parse URLhaus CSV records and skip headers/comments

▶ Audit Repairs — Pre-Click Blocklist Lite Endpoint (2 tests)
  ✔ should return 404 when ENABLE_PRE_CLICK_INTERCEPTOR is disabled
  ✔ should reject non-GET requests with 405 Method Not Allowed
```

---

## 3. Real-World Attack Scenarios Test Matrix

| Vector | Benchmark Input | Expected Score | Expected Reason Codes |
|:---|:---|:---:|:---|
| **Urgent KYC Smishing** | `"URGENT: State Bank of India account blocked. Complete mandatory KYC immediately at https://sbi-kyc-verify.top or access will be revoked within 24 hours."` | **90+** (High Threat) | `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `SUSPICIOUS_DOMAIN` |
| **Fake UPI Cashback** | `"Congratulations! You have received ₹5,000 festive cashback from PhonePe. Enter your UPI PIN to claim directly to bank."` | **85+** (High Threat) | `REWARD_BAIT`, `REQUEST_OTP_PASSWORD`, `PAYMENT_REDIRECT` |
| **Electricity Disconnection** | `"Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call Electricity Officer at +919876543210 immediately."` | **85+** (High Threat) | `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `UNSOLICITED_CONTACT` |
| **Courier Phishing** | `"IndiaPost: Your package cannot be delivered due to incomplete street address. Pay ₹25 re-delivery fee at https://indiapost-parcel-tracking.com."` | **88+** (High Threat) | `IMPERSONATION_BRAND`, `PAYMENT_REDIRECT`, `SUSPICIOUS_DOMAIN` |
| **PayPal Lookalike** | `https://paypal-security-verification.com/login` | **90+** (High Threat) | `SUSPICIOUS_DOMAIN`, `IMPERSONATION_BRAND` |
| **Synthetic Voice Call** | Base64 synthetic vocoder recording: *"Officer Sharma from Delhi Customs. Narcotics detected under your name. Pay bond to avoid digital arrest."* | **85+** (High Threat) | `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `PAYMENT_REDIRECT`, `THREAT_BLACKMAIL` |
| **Legitimate Message** | `"Hey, are we still meeting for lunch at 1 PM today?"` | **< 15** (Safe) | None (Empty reason codes) |

---

## 4. Manual QA & Demo Verification Checklist

* [x] **Guest Demo Mode**: Click `⚡ Explore as Guest / Judge Demo Mode` on login gate; dashboard opens instantly.
* [x] **QR Code Camera**: Open `QR Code Inspector`, toggle camera on, and point at suspicious QR code or click 1-click test benchmark.
* [x] **Deepfake Call Audio**: Open `Voice & Audio Scam`, click *Load Synthetic Benchmark*, observe real-time waveform and spectral Wiener flatness analysis.
* [x] **Browser Shield Sandbox**: Open `Browser Shield & Ext`, click test links, verify pre-click modal warning catches hostile domains.
* [x] **Global Threat Intelligence**: Open `Global Threat Intelligence`, verify live indicator counts and interactive city hotspot markers.
* [x] **Senior Mode**: Click `Senior Mode` in top command bar, confirm typography scales up and high-contrast color scheme is active.
