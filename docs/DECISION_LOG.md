# Architecture Decision Records (ADR)

This log records major architectural decisions, evaluated alternatives, engineering tradeoffs, and rationales across the GhostNet AI engineering lifecycle.

---

## ADR 001: Selection of Groq LPU for Primary NLP Evaluation
* **Context:** Cybersecurity scan interfaces require sub-second response times (<800ms) to prevent user impatience and preemptive clicks on malicious links.
* **Options Considered:** OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Groq LPU (`llama-3.3-70b-versatile`).
* **Decision:** Selected Groq LPU for primary text and link evaluation.
* **Rationale:** Groq achieves 200–500ms inference latency, delivering near-instant scam verdicts with deep social engineering reasoning.
* **Tradeoffs:** Groq LPU text models cannot process visual pixel buffers, necessitating a multimodal companion model for screenshot analysis.

---

## ADR 002: Google Gemini 2.5 Flash for Visual Multimodal Evidence
* **Context:** Screenshot scam detection requires high-accuracy visual OCR (fake logos, payment QR codes, banking UI replicas) and rapid image parsing.
* **Options Considered:** Custom Tesseract OCR on edge vs AWS Textract vs Google Gemini 2.5 Flash Vision.
* **Decision:** Selected Google Gemini 2.5 Flash as the primary multimodal vision model.
* **Rationale:** Gemini 2.5 Flash provides state-of-the-art vision OCR, visual logo forgery detection, and layout understanding with low latency and favorable free-tier allowances.
* **Tradeoffs:** Cloud dependency requires offline heuristic fallback when network connectivity is lost.

---

## ADR 003: Supabase PostgreSQL with Strict RLS & Key Separation
* **Context:** User scan logs, threat indicators, and evidence files require strict data privacy and least-privilege access partitioning.
* **Options Considered:** Firebase Firestore vs Self-hosted MongoDB vs Supabase PostgreSQL.
* **Decision:** Selected Supabase (PostgreSQL 15 with Row-Level Security) with strict read/write key separation.
* **Rationale:** PostgreSQL RLS guarantees cryptographic data isolation at the database kernel level, preventing IDOR data leaks. Read endpoints use the public anonymous key, while writes to threat feeds are reserved exclusively for the server-side `SUPABASE_SERVICE_ROLE_KEY`.
* **Tradeoffs:** Managed database dependencies require robust connection pooling and fallback schemas.

---

## ADR 004: In-Memory FFT Spectral Wiener Flatness for Deepfake Audio
* **Context:** Emerging scam calls utilize synthetic text-to-speech vocoders and voice cloning. A lightweight, real-time method is needed to identify acoustic anomalies.
* **Options Considered:** Heavyweight Python PyTorch models (e.g. ResNet) on GPU servers vs In-memory JavaScript Fast Fourier Transform (`fft.js`) with Wiener entropy.
* **Decision:** Implemented client/server in-memory FFT computing spectral flatness, Wiener entropy, and high-frequency energy ratio combined with Groq Whisper transcription.
* **Rationale:** Executes in <50ms without specialized GPU infrastructure, detecting the telltale high-frequency artifacts and flat spectral distributions characteristic of neural vocoders.
* **Tradeoffs:** Acoustic analysis alone cannot prove malice, so it is paired with linguistic coercion detection for unified scoring.

---

## ADR 005: 10 Standardized Reason Codes with Code-Defense Sanitization
* **Context:** Unconstrained LLM outputs frequently invent hallucinated risk categories, resulting in unpredictable frontend chip rendering.
* **Options Considered:** Free-text risk tags vs Probabilistic probability distributions vs 10 Standardized Reason Codes with code-defense filtering.
* **Decision:** Established 10 immutable reason codes (`URGENCY_SCARE_TACTICS`, `REQUEST_OTP_PASSWORD`, `PAYMENT_REDIRECT`, `SUSPICIOUS_DOMAIN`, `IMPERSONATION_BRAND`, `MALICIOUS_ATTACHMENT`, `UNSOLICITED_CONTACT`, `POOR_GRAMMAR_FORMAT`, `REWARD_BAIT`, `THREAT_BLACKMAIL`).
* **Rationale:** `safeParseVerdict()` strips hallucinated codes and guarantees deterministic rendering across all platforms.
* **Tradeoffs:** Requires mapping novel emerging threat types into existing taxonomy buckets.

---

## ADR 006: Manifest V3 DeclarativeNetRequest for Browser Shield
* **Context:** Real-time web browsing defense must inspect and block malicious link navigations before hostile code executes in the browser.
* **Options Considered:** WebRequest blocking API (Manifest V2) vs Content script link injection vs Manifest V3 `declarativeNetRequest`.
* **Decision:** Built a Chrome Manifest V3 extension utilizing `declarativeNetRequest` combined with lightweight DOM hover event listeners and `/api/blocklist-lite`.
* **Rationale:** Fully compliant with Chrome MV3 security policies; intercepts navigations natively at the browser network layer without performance degradation.
* **Tradeoffs:** Requires maintaining a synchronized plaintext hash blocklist.

---

## ADR 007: Vercel Hobby Once-Daily Cron Schedule (`0 0 * * *`)
* **Context:** Scheduled threat feed synchronization (OpenPhish, URLhaus) was initially configured at `0 */6 * * *` (every 6 hours), which caused Vercel Hobby plan deployment rejections (`3Fpeeb1`).
* **Options Considered:** Upgrading to paid Vercel Pro vs External GitHub Actions cron vs Configuring once-daily cron (`0 0 * * *`).
* **Decision:** Configured `schedule: "0 0 * * *"` in `vercel.json`.
* **Rationale:** 100% compliant with Vercel Hobby free tier specifications, ensuring automated CI/CD builds succeed without paid infrastructure while keeping threat feeds updated daily.
* **Tradeoffs:** Feed sync occurs once every 24 hours rather than every 6 hours.

---

## ADR 008: Rebranding to Global Threat Intelligence
* **Context:** The term "Global Scam Heatmap" underrepresented the depth of real-time indicator synchronization, OpenPhish/URLhaus threat ingest, and community telemetry.
* **Options Considered:** "Scam Map" vs "Scam Heatmap" vs "Global Threat Intelligence".
* **Decision:** Adopted "Global Threat Intelligence & Radar" across all UI navigation, card titles, and documentation.
* **Rationale:** Better reflects enterprise cybersecurity positioning, emphasizing aggregated threat telemetry, live velocity tracking, and community intelligence feeds.
