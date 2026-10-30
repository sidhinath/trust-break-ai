# GhostNet AI — Product Requirements Document (PRD)

**Document Version:** 1.0.0-prod  
**Status:** Feature-Frozen / Hackathon Release  
**Target Release:** v1.1.0-prod  
**Authors:** GhostNet AI Core Engineering Team  
**Live Application:** [https://ghost-net-zeta.vercel.app](https://ghost-net-zeta.vercel.app)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Threat Landscape
The global digital economy faces a catastrophic escalation in social engineering fraud. According to FTC and FBI IC3 reports, digital fraud losses exceeded **\$10.3 billion** in 2023 alone, surging by over 30% annually. The root cause is not merely compromised network infrastructure, but the systematic exploitation of **human cognitive vulnerabilities** by generative AI:
- **Polymorphic Spear Phishing:** LLMs generate contextually tailored, linguistically perfect spear-phishing messages that bypass traditional keyword and spam filters.
- **Deepfake Audio Cloning:** Low-cost acoustic synthesis enables zero-latency voice cloning of executives and family members to execute emergency fund transfers.
- **Visual Camouflage & Typosquatting:** Homograph attacks, pixelated QR codes (quishing), and forged institutional portals exploit visual trust.
- **Zero-Hour Ephemeral Infrastructure:** Malicious URLs and payment redirections spin up and tear down within 15 minutes, rendering centralized reactive blacklists ineffective.

### 1.2 The Solution: GhostNet AI
GhostNet AI is an **autonomous, multimodal cyber-defense shield** designed to detect, deconstruct, and neutralize social engineering threats across every personal communication vector (SMS, email, URLs, QR codes, screenshots, and live audio) within **sub-second latency**.

Rather than relying purely on static domain blacklists or unconstrained LLM chat, GhostNet AI couples:
1. **Ultra-fast Groq LPU inference** (`llama-3.3-70b-versatile`) with a strict schema-enforced code defense (`safeParseVerdict`).
2. **On-device acoustic spectral analysis** (Wiener spectral flatness via Web Audio API & Fast Fourier Transforms).
3. **Multimodal vision OCR** via Google Gemini 2.5 Flash.
4. **Zero-latency pre-click browser interception** via a Chrome Manifest V3 extension.
5. **Decentralized crowd-sourced threat intelligence** synchronized through Supabase PostgreSQL with Row Level Security (RLS).

```
+-------------------------------------------------------------------------+
|                              USER PERIMETER                             |
|  [SMS / Text]     [URLs / Domains]     [Screenshots]     [Voice Audio]  |
+-------+------------------+-------------------+-----------------+--------+
        |                  |                   |                 |
        v                  v                   v                 v
+-------------------------------------------------------------------------+
|                        GHOSTNET EDGE SHIELD                             |
|  - Offline Heuristic Engine (RegEx / Entropy / Levenshtein / Punycode)  |
|  - Real-Time Camera QR Decoder (jsQR)                                   |
|  - In-Memory Acoustic Spectral Engine (Wiener Flatness / FFT)          |
+------------------------------------+------------------------------------+
                                     |
                         Fallback / Fast Analysis
                                     v
+-------------------------------------------------------------------------+
|                       MULTIMODAL AI INFERENCE ENGINE                    |
|  - Groq LPU (llama-3.3-70b-versatile, <850ms)                           |
|  - Google Gemini 2.5 Flash Vision (Multimodal OCR)                      |
|  - safeParseVerdict() & 10 Canonical Reason Codes Whitelist             |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  DECENTRALIZED THREAT INTELLIGENCE                      |
|  - Supabase PostgreSQL (Row Level Security enabled)                     |
|  - SHA-256 Domain / URL / Text Hash Fingerprinting                      |
|  - Daily Feed Sync (OpenPhish + URLhaus)                                |
+------------------------------------+------------------------------------+
```

---

## 2. Product Vision & Goals

### 2.1 Product Vision
To democratize enterprise-grade cognitive cyber defense for every citizen, mobile user, and remote worker—transforming passive victims into an interconnected, real-time threat detection mesh.

### 2.2 Core Goals
1. **Sub-Second Threat Verdicts:** Achieve end-to-end classification latency under 850 milliseconds for text and URLs via Groq LPUs.
2. **Deterministic Code Defense:** Eliminate LLM hallucinations by enforcing strict schema parsing and a whitelist of 10 standard reason codes.
3. **Zero-Knowledge Privacy:** Process voice audio ephemerally in volatile memory with zero server-side audio persistence or transcription storage.
4. **Active Pre-Click Interception:** Prevent users from ever loading a malicious domain via Manifest V3 browser DOM inspection.
5. **Resilient Dual-Mode Operation:** Provide 100% offline heuristic detection when network connectivity or backend APIs are unavailable.

### 2.3 Non-Goals (Hackathon Boundary)
- **Active Counter-Offensive Hacking:** GhostNet AI will not retaliate, port-scan, or DDOS attacker infrastructure.
- **Enterprise SIEM Replacement:** GhostNet AI is designed as a frontline user/endpoint perimeter defense, not a heavy enterprise log aggregator (Splunk/Datadog).
- **Native OS Kernel Drivers:** GhostNet AI operates via Web APIs, Capacitor mobile wrappers, and Chrome Extensions, avoiding invasive kernel-level extensions.

---

## 3. User Personas & Target Audience

| Persona | Demographics & Context | Primary Pain Points | GhostNet Solution |
| :--- | :--- | :--- | :--- |
| **Margaret (68)**<br>*Non-Technical Senior* | Retired, smartphone user, targets of digital arrest & electricity bill scams. | Fear of financial loss; unable to distinguish spoofed bank SMS from legitimate alerts. | 1-Tap Message Scanner with plain-English explanation, urgent warnings, and safe action checklists. |
| **Alex (24)**<br>*Web3 & Crypto Trader* | High-frequency trader, mobile-first, targets of quishing & fake token airdrops. | Malicious QR codes draining crypto wallets; typosquatted dApp URLs. | Real-time Live Camera QR Scanner + Pre-Click Browser Interceptor with zero-latency threat blocking. |
| **Priya (34)**<br>*Remote Knowledge Worker* | Remote enterprise PM, uses Slack/WhatsApp/Email, targets of CEO deepfakes. | Urgent voice messages requesting wire transfers or credential verification. | Voice Deepfake Analyzer combining acoustic Wiener flatness with LLM contextual intent detection. |
| **Dev (29)**<br>*Community Defender & Analyst* | Security enthusiast, opensource advocate, monitors regional scam waves. | Fragmented threat reporting tools; lack of transparent crowd-sourced IOC data. | Global Threat Intelligence map with live Supabase telemetry and SHA-256 fingerprint search. |

---

## 4. Functional Specifications (Core Capabilities)

### 4.1 Feature 1: SMS & Text Message Scam Scanner
- **Input:** Raw SMS, WhatsApp, email, or chat text strings up to 5,000 characters.
- **Processing Pipeline:**
  1. Local regex inspection for high-risk urgency tokens (`urgent`, `immediate`, `arrest`, `police`, `blocked`).
  2. Sub-second Groq LPU inference using `llama-3.3-70b-versatile`.
  3. `safeParseVerdict()` validation against markdown fences and schema violations.
  4. Whitelist enforcement of 10 canonical reason codes.
- **Output Schema:**
  ```typescript
  interface ScanResult {
    verdict: 'SAFE' | 'SUSPICIOUS' | 'SCAM';
    confidence: number; // 0 to 100
    riskScore: number;  // 0 to 100
    category: string;
    explanation: string;
    indicators: string[];
    actionItems: string[];
    reasonCodes: ReasonCode[];
    attackChain: {
      stage: 'Lure' | 'Hook' | 'Exploit' | 'Execution' | 'Extraction';
      description: string;
    }[];
    source: 'groq' | 'heuristic-fallback';
  }
  ```

### 4.2 Feature 2: URL & Typosquatting Scanner
- **Input:** Raw URL string, domain, or IP address.
- **Analysis Vector:**
  1. Shannon entropy calculation on domain tokens.
  2. Homoglyph / Punycode decoding (`xn--`).
  3. IP-literal host detection (e.g., `http://192.168.1.1/login`).
  4. Known URL shortener identification (`bit.ly`, `tinyurl.com`, `ow.ly`, `t.co`).
  5. Cross-reference against cached OpenPhish and URLhaus indicators in Supabase.
- **Output:** Domain risk score, identified typosquatting target, and redirect analysis.

### 4.3 Feature 3: Screenshot & Image OCR Analyzer
- **Input:** PNG, JPEG, or WebP screenshot uploads (up to 10MB).
- **Processing:**
  1. Google Gemini 2.5 Flash Vision OCR parsing of on-screen visual artifacts, fake logos, and embedded text.
  2. Extraction of suspicious phone numbers, UPI handles, and payment links.
  3. Automated routing to Groq text scam pipeline for unified risk assessment.

### 4.4 Feature 4: Real-Time Live Camera QR Scanner
- **Input:** Live camera feed via HTML5 `MediaDevices.getUserMedia()`.
- **Processing:**
  1. Canvas-based frame extraction at 30 FPS.
  2. `jsQR` real-time visual matrix decoding.
  3. Automated URL sanitization and instant submission to GhostNet URL defense pipeline.
  4. Visual HUD overlay with targeting reticle and immediate threat badge.

### 4.5 Feature 5: Voice Deepfake & Audio Analyzer
- **Input:** Live microphone recording or uploaded audio file (WAV/MP3, up to 6MB).
- **Processing:**
  1. Web Audio API / `fft.js` computation of **Wiener Spectral Flatness**:
     $$\text{Spectral Flatness} = \frac{\exp\left(\frac{1}{N} \sum_{k=0}^{N-1} \ln |X[k]|^2\right)}{\frac{1}{N} \sum_{k=0}^{N-1} |X[k]|^2}$$
  2. Synthetic voice detection: High spectral flatness indicates unnatural acoustic noise floors characteristic of neural vocoders (Bark, ElevenLabs).
  3. Whisper transcription and Groq behavioral intent analysis for social engineering pressure.
  4. Combined weighted score: $60\%$ acoustic anomaly score $+ 40\%$ conversational urgency score.
- **Privacy Guarantee:** Ephemeral memory processing only; raw audio buffers discarded immediately upon analysis completion.

### 4.6 Feature 6: Manifest V3 Chrome Browser Shield
- **Architecture:** MV3 Background Service Worker + Content Script.
- **Functionality:**
  1. Intercepts DOM link hover and click events.
  2. Queries local edge endpoint (`/api/blocklist-lite`) in under 15ms.
  3. Injects warning modal on high-risk link clicks, halting navigation until user confirmation.

### 4.7 Feature 7: Global Threat Intelligence
- **Data Source:** Supabase PostgreSQL `reports` and `threat_indicators` tables.
- **Functionality:**
  1. Interactive global heatmap visualizing scam velocity and geographic clusters.
  2. Live telemetry feed of sanitized threat submissions.
  3. Searchable database by SHA-256 indicator hash or normalized domain.
  4. Crowd-sourced community validation with upvote/flag capability.

### 4.8 Feature 8: Edge Pre-Click Interceptor (`/api/blocklist-lite`)
- **Specification:** Lightweight REST endpoint returning compressed array of high-velocity active threat domain hashes.
- **Performance:** HTTP edge-cached with `Cache-Control: s-maxage=300`, responding in `< 25ms` globally.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance & Latency
- **Text / URL Scan Latency:** $\le 850\text{ ms}$ at 95th percentile.
- **Audio FFT Analysis:** $\le 1200\text{ ms}$ for 10-second audio clips.
- **Pre-Click Blocklist Lookup:** $\le 30\text{ ms}$.
- **Client Bundle Size:** Optimized bundle chunks strictly $\le 460\text{ kB}$ (gzip) for instant mobile loading.

### 5.2 Accuracy & False Positive Thresholds
- **False Positive Rate (FPR):** $\le 2.0\%$ on clean legitimate transactional SMS/emails.
- **False Negative Rate (FNR):** $\le 1.0\%$ on known phishing and financial scam benchmarks.
- **Deterministic Reason Codes:** Exactly 10 canonical reason codes supported; unapproved codes filtered out automatically.

### 5.3 Security & Zero-Trust
- **Row Level Security (RLS):** Enabled on all Supabase tables (`public_blocklist`, `threat_indicators`, `scans`, `reports`).
- **Key Isolation:** Anonymous key (`VITE_SUPABASE_ANON_KEY`) restricted to read-only queries; Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) restricted to serverless edge execution.
- **Cron Authentication:** `/api/cron/sync-feeds` strictly protected with bearer `CRON_SECRET`.
- **Payload Guardrails:** HTTP 413 rejection on payloads exceeding 6MB; strict MIME-type validation.

### 5.4 High Availability & Resilience
- **Offline Fallback:** If Groq or Supabase are unreachable, client gracefully defaults to the built-in deterministic heuristic regex engine.
- **Edge Deployment:** Deployed across global Vercel Edge regions with automated failover.

---

## 6. Data Architecture & Database Entities

### 6.1 Entity Relationship Overview
```
+---------------------+           +------------------------+
|        scans        |           |   threat_indicators    |
+---------------------+           +------------------------+
| id: uuid (PK)       |           | id: uuid (PK)          |
| user_id: uuid       |           | indicator_hash: text(U)|
| scan_type: text     |           | indicator_type: text   |
| content_preview: txt|           | risk_score: int4       |
| risk_score: int4    |           | source: text           |
| verdict: text       |           | times_seen: int4       |
| reason_codes: text[]|           | last_seen_at: timestamptz
| created_at: tstz    |           +------------------------+
+---------------------+
           |
           v
+---------------------+           +------------------------+
|       reports       |           |    public_blocklist    |
+---------------------+           +------------------------+
| id: uuid (PK)       |           | id: uuid (PK)          |
| indicator_id: uuid  |           | domain_hash: text (U)  |
| scam_type: text     |           | category: text         |
| votes: int4         |           | threat_level: text     |
| reported_at: tstz   |           | active: boolean        |
+---------------------+           +------------------------+
```

### 6.2 Key Constraints
- Unique index on `threat_indicators(indicator_hash)` for idempotent PostgREST upsert (`on_conflict=indicator_hash`).
- Unique index on `public_blocklist(domain_hash)`.
- Ephemeral audio buffers are **never written** to PostgreSQL or any disk store.

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

| Metric | Target | Tracking Mechanism |
| :--- | :--- | :--- |
| **Detection Speed** | $< 850\text{ ms}$ avg | Vercel Serverless Function telemetry |
| **Classification Accuracy** | $> 98.5\%$ | Automated test benchmark suite (40 test vectors) |
| **False Alarm Rate** | $< 2.0\%$ | Legitimate banking SMS benchmark tests |
| **System Uptime** | $99.95\%$ | Vercel Edge & Supabase Cloud monitoring |
| **Acoustic FFT Throughput** | $100\%$ client-side | Web Audio API execution metrics |
| **Offline Resilience** | $100\%$ availability | Automated heuristic fallback tests |

---

## 8. Release Roadmap & Milestones

- [x] **Milestone 1: Core Heuristics & Groq Cascade** (Completed)
- [x] **Milestone 2: Multimodal OCR & Camera QR** (Completed)
- [x] **Milestone 3: Voice Acoustic FFT Engine** (Completed)
- [x] **Milestone 4: Supabase Live RLS Integration** (Completed)
- [x] **Milestone 5: Manifest V3 Browser Extension** (Completed)
- [x] **Milestone 6: 40/40 Automated Test Suite** (Completed)
- [x] **Milestone 7: Global Threat Intelligence & Demo Polish** (Completed)
- [ ] **Phase 2 (Post-Hackathon):** On-device WebGPU Small Language Model (SLM) for 100% offline private inference.
- [ ] **Phase 3 (Post-Hackathon):** Native Android Telephony Call Interceptor (Capacitor native plugin).

---

## 9. Conclusion
GhostNet AI represents a paradigm shift in personal cybersecurity. By fusing hardware-accelerated AI, client-side digital signal processing, zero-trust database security, and proactive browser interception, GhostNet AI neutralizes modern social engineering attacks before cognitive exploitation can occur.
