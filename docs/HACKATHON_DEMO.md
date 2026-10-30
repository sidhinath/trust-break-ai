# GhostNet AI — Hackathon Demonstration & Judging Playbook

* **Live Deployment:** [https://ghost-net-zeta.vercel.app](https://ghost-net-zeta.vercel.app)
* **Local Fallback:** [http://localhost:5173](http://localhost:5173)

---

## 1. 30-Second Elevator Pitch

> "Phishing, voice deepfakes, and social engineering scams have evolved far beyond static blocklists and simple spam filters. Victims lose over $10 Billion annually because traditional security tools act as opaque black boxes outputting generic percentages with zero actionable context.
>
> **GhostNet AI** is an autonomous, explainable multi-modal cybersecurity defense platform. Whether it is an urgent bank SMS, a typosquatted URL, a deceptive screenshot, a malicious QR code, an AI voice clone, or unvetted web navigation, GhostNet reconstructs the attacker's full 5-stage cyber kill-chain, explains the adversary's true intent, flags standardized reason codes, and cross-references live cloud threat intelligence—with guaranteed 100% offline fallback resilience."

---

## 2. Recommended 2-Minute Judge Demo Order

| Time | Action | Page | Key Takeaway for Judges |
|:---|:---|:---|:---|
| **0:00 - 0:25** | **SMS Social Engineering** | `Message Scanner` | Paste urgent SBI KYC SMS. Show 5-Stage Threat Reconstruction, Attacker Intent, and Reason Codes. |
| **0:25 - 0:50** | **Domain and Typosquatting** | `Link Inspector` | Test `sbi-kyc-verification-portal.online`. Show brand mimicry detection and "What Happens If I Click?" sandbox. |
| **0:50 - 1:15** | **QR Camera and Threat Extraction** | `QR Code Inspector` | Open camera or click 1-Click QR benchmark. Show instant payload decode and risk scoring. |
| **1:15 - 1:40** | **Voice and Deepfake Call Detection** | `Voice & Audio Scam` | Click synthetic voice benchmark. Show acoustic Wiener entropy and linguistic analysis. |
| **1:40 - 2:00** | **Global Radar & Browser Shield** | `Global Threat Intelligence` / `Browser Shield` | Show live Supabase indicator feed, pre-click blocklist interceptor, and 40/40 test suite. |

---

## 3. Exact Demonstration Scenarios & Expected Outputs

### Scenario 1: SMS Banking Phishing & OTP Harvest
* **Input Text**:
  ```text
  URGENT: State Bank of India account blocked due to KYC. Update immediately at https://sbi-kyc-verification.top or funds will be frozen within 24 hours. Enter OTP to verify identity.
  ```
* **Where to Test**: Click **`Banking Scam: Urgent Bank KYC...`** on the Home top bar ➔ click **`Inspect & Reconstruct Threat`**.
* **Expected Output**:
  * **Verdict**: `HIGH THREAT SCAM DETECTED` (Risk Score: `92-98 / 100`)
  * **Attacker Intent**: *"Harvest banking login credentials and intercept two-factor authentication (OTP) to drain bank funds."*
  * **Standard Reason Codes**: `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `REQUEST_OTP_PASSWORD`, `SUSPICIOUS_DOMAIN`
  * **Attack Progression (5 Stages)**:
    1. *Ingress Vector* (Unsolicited SMS)
    2. *Social Engineering Cue* (Account freeze panic)
    3. *Phishing Gateway* (Deceptive external link)
    4. *Credential Harvesting* (OTP & NetBanking credential extraction)
    5. *Financial Impact* (Unauthorized fund transfer)

---

### Scenario 2: Typosquatting & Malicious Domain Lookup
* **Input URL**:
  ```text
  https://paypal-security-verification.com/login
  ```
* **Where to Test**: `Link Inspector` ➔ URL input area ➔ Click **`Inspect Link Safety`**.
* **Expected Output**:
  * **Verdict**: `HIGH THREAT SCAM DETECTED` (Risk Score: `85-95 / 100`)
  * **Brand Mimicry**: Impersonating PayPal (Official: `paypal.com`)
  * **Domain Age**: Newly Registered Domain
  * **Reason Codes**: `SUSPICIOUS_DOMAIN`, `IMPERSONATION_BRAND`
  * **Interactive Feature**: Click **`Launch Simulation`** on the educational sandbox card to walk through how the credential harvesting form tricks victims without executing hostile code.

---

### Scenario 3: QR Code Camera Threat Inspection
* **Where to Test**: `QR Code Inspector` (`/QRScanner`).
* **Camera Test**: Click **`Scan Camera`**, allow browser permissions, point at any test QR code.
* **1-Click Test**: Click **`Phishing Banking Portal QR`** benchmark button.
* **Expected Output**:
  * Raw decoded payload: `https://sbi-kyc-verification-portal.online/login?token=urgent-freeze`
  * Instant recursive routing into domain analyzer with high-threat verdict.

---

### Scenario 4: Voice Deepfake & Social Engineering Call
* **Where to Test**: `Voice & Audio Scam` (`/VoiceScanner`).
* **1-Click Test**: Click **`Load Deepfake Police Scam Audio`** benchmark ➔ Click **`Analyze Voice Safety`**.
* **Expected Output**:
  * **Acoustic Indicator**: `High synthetic-voice probability` (Wiener Flatness: `> 0.45`).
  * **Transcription**: Monospace audio transcript capturing coercive "digital arrest" keywords.
  * **Reason Codes**: `URGENCY_SCARE_TACTICS`, `IMPERSONATION_BRAND`, `PAYMENT_REDIRECT`, `THREAT_BLACKMAIL`.

---

## 4. Offline & Low-Connectivity Resilience Plan

If convention Wi-Fi drops or API quotas are exhausted:
1. **GhostNet is 100% Offline-Resilient**: The client and server include an integrated deterministic heuristic engine (`src/lib/scanner.js`).
2. **Instant Local Execution**: Every scan instantly returns calibrated risk scores, attack chains, and reason codes (`source: "offline-heuristic"`) in under 5 milliseconds.
3. **No Login Requirement**: Judges can click **`⚡ Explore as Guest / Judge Demo Mode`** on the login gate to bypass authentication instantly.

---

## 5. Judge FAQs & Technical Evidence

### Q: "How is this different from a simple ChatGPT wrapper?"
* **Answer**:
  1. **Dual-Engine Architecture:** Combines sub-second Groq LPU inference with deterministic regex & NLP rule engines.
  2. **Threat Reconstruction™:** Patented 5-stage attack chain synthesis.
  3. **Live Supabase Threat Telemetry:** Pre-checks against synchronized URLhaus and OpenPhish domains before calling any LLM.
  4. **Acoustic Spectral Analysis:** Executes in-memory Fast Fourier Transform (`fft.js`) spectral flatness (Wiener entropy) calculations directly on audio waveforms.

### Q: "How do you prevent AI hallucinations?"
* **Answer**:
  1. Rigid JSON schema validation via `safeParseVerdict()`.
  2. Strict code-defense whitelist filtering against 10 immutable reason codes (`src/lib/reasonCodes.js`). All hallucinated tokens are dropped.

### Q: "How is user privacy protected?"
* **Answer**:
  1. **Stateless Processing:** Input messages, URLs, screenshots, and audio recordings are evaluated ephemerally in RAM and never stored without explicit user consent.
  2. **Database Isolation:** PostgreSQL Row-Level Security partitioned by cryptographic `auth.uid()`.
  3. **1-Click Audit Purge:** Permanent hard-delete available in `/PrivacyCenter`.

---

## 6. Automated Quality Assurance Summary

```bash
# Automated Tests (40 / 40 Passing)
$ npm test
ℹ tests 40 | suites 15 | pass 40 | fail 0

# ESLint Static Analysis (0 warnings, 0 errors)
$ npm run lint

# TypeScript Strict Typecheck (0 errors)
$ npm run typecheck

# Vite Production Build (Compiled in <5s, all chunks <460kB)
$ npm run build
```
