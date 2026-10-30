# Product Roadmap & Research Vision

TrustBreak AI advances from an agile prototype to an enterprise-grade cyber defense intelligence platform deployed live at [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app).

---

## 1. Completed Deliverables (v1.7.0 Production Release)

* [x] **Feature 1 — Explainable Risk Scoring:** 10 standardized reason codes (`URGENCY_SCARE_TACTICS`, `REQUEST_OTP_PASSWORD`, etc.) with code-defense parser.
* [x] **Feature 2 — Hardened Deterministic Offline Heuristics:** Offline regex and NLP scoring engine with `withTimeout(promise, 9000)` protection.
* [x] **Feature 3 — Public Threat Feed Synchronization:** Automated daily cron ingestion of OpenPhish and URLhaus with SHA-256 domain hashing.
* [x] **Feature 4 — Community Threat Intelligence Telemetry:** Supabase PostgreSQL `threat_indicators` database with atomic PostgREST upsert (`on_conflict=indicator_hash`).
* [x] **Feature 5 — Live QR Code Camera Scanner:** Real-time WebRTC camera viewfinder and canvas decoding via `jsQR` with fallback image uploading.
* [x] **Feature 6 — Voice & Deepfake Call Detector:** In-memory Fast Fourier Transform (`fft.js`) spectral flatness (Wiener entropy) and Groq Whisper-large-v3 transcription with HTTP 413 (>6MB) guards.
* [x] **Feature 7 — TinyFish Autonomous Web Investigation Agent:** Headless server-side browser investigation engine tracing redirect hops, page DOM, and credential forms.
* [x] **Feature 8 — Real-Time Chromium Browser Extension (MV3):** Manifest V3 extension featuring background tab monitoring, automated hash checks, and warning overlays.
* [x] **Feature 9 — Pre-Click Interceptor & Sandbox:** Low-latency `/api/blocklist-lite` streaming API and zero-execution educational link sandbox.
* [x] **Feature 10 — Senior & Family Safety Mode Complete Release:** Accessible high-contrast UI, minimum 48dp+ touch targets, plain-English explanations, Web Speech API audio assistance, offline 1930 emergency guidance, and trusted contact alert sharing.
* [x] **Threat Reconstruction™:** Interactive 5-stage cyber kill-chain mapper (`Ingress` ➔ `Psychological Coercion` ➔ `Phishing Gateway` ➔ `Credential Harvesting` ➔ `Loss`).
* [x] **Attacker Intent Engine:** Plain-English adversary motivation translation.
* [x] **Instant Theme Engine:** Persistent Light and Dark mode with ThreeUI ambient living particle fields.
* [x] **Cross-Platform Mobile:** Native Android package (`com.trustbreak.app`) configured and tested via Capacitor 8.5 with bundled `TrustBreak AI.apk`.
* [x] **Guest / Judge Demo Mode:** 1-click `⚡ Explore as Guest / Judge Demo Mode` login gate bypass.
* [x] **Automated Quality Gates:** 51/51 tests across 18 suites in `tests/scanner.test.js` and `tests/tinyfish.test.js` passing in <500ms.
* [x] **Production Deployment:** Live locked deployment at [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app).

---

## 2. Near-Term Roadmap (Q4 2026 — Q1 2027)

* [ ] **Android Native Share-to-Scan Target:** System-level Android intent allowing users to share suspicious messages directly from WhatsApp, SMS, or Telegram without copy-pasting.
* [ ] **Multilingual Regional Indian & Global Languages:** Fine-tuned local NLP heuristic models for Hindi, Tamil, Telugu, Bengali, Spanish, and French.
* [ ] **Automated Bank & Law Enforcement Helpline Registry:** Dynamic directory connecting users directly to verified corporate hotlines (State Bank of India, HDFC, ICICI, PayPal, FedEx) and national reporting authorities.
* [ ] **Firefox & Safari Extension Ports:** Porting the MV3 Browser Shield to Firefox WebExtensions and Safari App Extensions.

---

## 3. Long-Term Research Vision (2027+)

* [ ] **On-Device Small Language Model (SLM) via WebGPU:** Quantized on-device 1B-parameter threat classification running entirely in client hardware using WebGPU and MediaPipe for 100% private, zero-cloud scans.
* [ ] **Decentralized Threat Blockchain Oracle:** Cryptographically signed threat indicators syndicated across participating enterprise security vendors with zero centralized control.
* [ ] **Enterprise SOC Multi-Tenant Dashboard:** Organization-wide phishing simulation, workforce threat awareness analytics, and SIEM/SOAR API webhooks.
