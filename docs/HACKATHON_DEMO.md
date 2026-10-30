# TrustBreak AI — Demonstration & Judging Playbook

* **Live Deployment:** [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app)
* **Local Fallback:** [http://localhost:5173](http://localhost:5173)

---

## 1. 30-Second Elevator Pitch

> "Phishing, voice deepfakes, and social engineering scams have evolved far beyond static blocklists and simple spam filters. Victims lose over $10 Billion annually because traditional security tools act as opaque black boxes outputting generic percentages with zero actionable context.
>
> **TrustBreak AI** is an autonomous, explainable multi-modal cybersecurity defense platform. Whether it is an urgent bank SMS, a typosquatted URL, a deceptive screenshot, a malicious QR code, an AI voice clone, or unvetted web navigation, TrustBreak reconstructs the attacker's full 5-stage cyber kill-chain, explains the adversary's true intent, flags standardized reason codes, and cross-references live cloud threat intelligence—with guaranteed 100% offline fallback resilience."

---

## 2. Recommended 2-Minute Judge Demo Order

| Time | Action | Page | Key Takeaway for Judges |
|:---|:---|:---|:---|
| **0:00 - 0:25** | **SMS Social Engineering** | `Message Scanner` | Paste urgent SBI KYC SMS. Show 5-Stage Threat Reconstruction, Attacker Intent, and Reason Codes. |
| **0:25 - 0:50** | **Domain and Typosquatting** | `Link Inspector` | Test `sbi-kyc-verification-portal.online`. Show brand mimicry detection and "What Happens If I Click?" sandbox. |
| **0:50 - 1:15** | **QR Camera and Threat Extraction** | `QR Code Inspector` | Open camera or click 1-Click QR benchmark. Show instant payload decode and risk scoring. |
| **1:15 - 1:40** | **Voice and Deepfake Call Detection** | `Voice & Audio Scam` | Click synthetic voice benchmark. Show acoustic Wiener entropy and linguistic analysis. |
| **1:40 - 2:00** | **Global Radar & Browser Shield** | `Global Threat Intelligence` / `Browser Shield` | Show live Supabase indicator feed, pre-click blocklist interceptor, and 51/51 test suite. |

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

### Scenario 3: Real-Time Live Camera QR Scanning
* **Where to Test**: Navigate to `QR Code Inspector` (`/QRScanner`).
* **Procedure**:
  1. Click **`Scan Camera`** to initialize WebRTC 30 FPS stream.
  2. Point camera at any QR code on screen or another phone.
  3. (Alternative for demo without secondary screen): Click **`Phishing Banking Portal QR`** from the 1-click benchmarks.
* **Expected Output**:
  * Decoded Target: `https://sbi-update-kyc.top/verify`
  * Instant Threat Flag: Malicious URL intercepted and evaluated before browser navigation.

---

### Scenario 4: Deepfake Audio Call Analysis
* **Where to Test**: Navigate to `Voice & Audio Scam` (`/VoiceScanner`).
* **Procedure**: Click **`Load Deepfake Police Scam Audio`** ➔ click **`Analyze Voice Safety`**.
* **Expected Output**:
  * **Acoustic Anomaly Verdict**: Synthetic Voice Detected (Spectral Flatness: `0.84`, High Harmonic Distortion).
  * **Transcript**: Extracted extortion/digital arrest coercive script.
  * **Combined Risk**: High Risk Voice Fraud.

---

## 4. Resilience & Offline Fallback Demonstration

Showcase that TrustBreak AI never crashes, even without internet access:
1. Open Chrome Developer Tools ➔ **Network** tab ➔ select **Offline**.
2. Run any Message or Link scan.
3. **Result**: Within **3ms**, TrustBreak's client-side regex heuristic engine returns a complete risk score and reason codes, clearly tagged with badge `source: offline-heuristic`.

---

## 5. Judge Q&A Defense Strategy

### Q: "How does TrustBreak AI differ from simple regex or blacklists?"
* **Answer**:
  1. **Multi-Model Inference:** Uses Groq LPU (`llama-3.3-70b`) for sub-second semantic intent understanding and Google Gemini 2.5 Flash for vision OCR.
  2. **Threat Reconstruction™:** Deconstructs the full 5-stage attack chain rather than giving a naked probability score.
  3. **Live Web Agent Sandbox:** TinyFish autonomous browser agent traces redirect chains and inspects DOM elements without client risk.
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
# Automated Tests (51 / 51 Passing across 18 test suites)
$ npm test
ℹ tests 51 | suites 18 | pass 51 | fail 0

# ESLint Static Analysis (0 warnings, 0 errors)
$ npm run lint

# TypeScript Strict Typecheck (0 errors)
$ npm run typecheck

# Vite Production Build (Compiled in <5s, all chunks <460kB)
$ npm run build
```
