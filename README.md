# TrustBreak AI — Autonomous Scam Defense Platform

> **Explainable, Multi-Modal Cyber Defense Against Social Engineering, Phishing, Deepfakes & Fraud**

[![Live Demo](https://img.shields.io/badge/Live%20Production-trust--break--ai.vercel.app-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://trust-break-ai.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-sidhinath%2Ftrust--break--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sidhinath/trust-break-ai.git)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20(Android%20%7C%20iOS%20%7C%20Desktop)-34d399?style=for-the-badge&logo=pwa&logoColor=white)](https://trust-break-ai.vercel.app)
[![Automated Verification](https://img.shields.io/badge/Verification-104%20%2F%20104%20passed-10b981?style=for-the-badge&logo=checkmarx&logoColor=white)](#-automated-verification)
[![License](https://img.shields.io/badge/License-MIT-059669?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live Web Application:** [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app)  
**Source Repository:** [https://github.com/sidhinath/trust-break-ai.git](https://github.com/sidhinath/trust-break-ai.git)

---

## 🌟 Executive Summary

**TrustBreak AI** is a production-grade, multi-modal cyber-defense platform designed to detect, explain, and mitigate modern digital deception in real time. From sophisticated spear-phishing SMS (smishing) and deceptive QR code redirections (quishing) to AI-generated voice cloning and weaponized payment portals, TrustBreak AI breaks down attacks into explainable, actionable insights.

Instead of presenting an opaque or arbitrary warning label, TrustBreak AI delivers **transparent, explainable security verdicts**:
- **Dynamic Threat Score (`0–100`)** calibrated by multi-layered heuristic and LLM telemetry.
- **Categorical Risk Tiering** (`Safe`, `Suspicious`, `High Risk / Malicious`).
- **Standardized MITRE ATT&CK & Reason Codes** with forensic indicator breakdowns.
- **Plain-Language Explanations** detailing attacker psychology, deceptive tricks, and step-by-step guidance.
- **Instant Emergency Actions** including 1-tap blocking, evidence export, and direct integration with India's **1930 Cyber Crime Helpline**.

Built with a high-contrast **Emerald Green (`#10b981`) Cybersecurity Design System**, smooth Dark/Light theme switching, zero mobile input freezes, and an offline-first architecture, TrustBreak AI provides continuous defense across Web, Mobile PWA, and Desktop.

---

## 🛡️ Multi-Modal Protection Engines

TrustBreak AI unifies comprehensive digital scam detection under specialized analysis suites:

```
                                  TRUSTBREAK AI MULTI-MODAL GATEWAY
                                                  │
         ┌───────────────────┬────────────────────┼────────────────────┬───────────────────┐
         ▼                   ▼                    ▼                    ▼                   ▼
  💬 Message Scanner   🔗 Link Inspector   📸 Vision OCR       🎙️ Voice & Audio    📱 QR Inspector
  (SMS, WhatsApp,     (Homoglyph/Typos,   (Payment screens,   (Deepfake clones,   (Deceptive URLs,
   Telegram, Smish)    SSL, Redirection)   Fake KYC, Urgency)  Biometric analysis) UPI payment traps)
         │                   │                    │                    │                   │
         └───────────────────┴────────────────────┼────────────────────┴───────────────────┘
                                                  ▼
                                     CENTRALIZED `aiRouter`
                           (Deduplication Cache + Multi-Provider Fallback)
                                                  │
                 ┌────────────────────────────────┴──────────────────────────────┐
                 ▼                                                               ▼
        [TEXT / LINK / QR PIPELINE]                                  [MULTIMODAL / AUDIO PIPELINE]
    1. Primary: openai/gpt-oss-20b (Groq)                       1. Primary: gemini-3.5-flash-lite (Google)
    2. Fallback 1: llama-3.1-8b-instant (Groq)                  2. Fallback 1: gemini-3.8-flash (Google)
    3. Fallback 2: gemini-3.5-flash-lite (Google)               3. Fallback 2: Client-side FFT & Audio Heuristics
    4. Offline: Deterministic Heuristic Engine
                                                  │
                                                  ▼
                                       NORMALIZED JSON VERDICT
                        (Score, Risk Tier, Reason Codes, Plain Explanations)
```

### 1. Message Scanner (Smishing & Social Engineering)
- Inspects SMS, WhatsApp, Telegram, and email communications for linguistic urgency, psychological coercion, impersonation (banks, postal services, tax authorities), and credential harvesting.
- Extracts and isolates embedded URLs and phone numbers for deep inspection.

### 2. Link & URL Inspector
- Evaluates URLs against known threat feeds, internationalized domain names (IDN homoglyph attacks), open redirectors, typosquatting patterns, and deceptive subdomains (e.g., `paypal.com.verify-login.ru`).
- Performs live header verification, protocol integrity validation, and suspicious TLD flagging (`.top`, `.xyz`, `.click`, `.buzz`).

### 3. Screenshot Vision OCR (Multimodal Image Scanner)
- Upload or capture screenshots of mobile screens, suspicious chats, fake payment receipts, banking portals, or fake electricity bill cut-off notices.
- Utilizes Google Gemini's multimodal vision engine to extract text, identify fake branding elements, detect forged security seals, and spotlight extortion cues.
- Includes automatic client-side image compression to ensure instant uploads on slow mobile cellular networks.

### 4. QR Code Inspector (Quishing Defense)
- Real-time in-browser camera scanning or image drag-and-drop powered by `jsQR`.
- Safely extracts the encapsulated payload (URL, UPI payment string, Wi-Fi configuration, or vCard) and subjects it to full multi-modal threat analysis *before* execution.
- Identifies malicious payment request strings that attempt to drain accounts via unauthorized UPI intent links.

### 5. Voice & Audio Deepfake Detector
- Analyzes voice call recordings, suspicious voicemails, and audio messages to protect users against synthetic voice cloning, CEO fraud, and virtual kidnapping scams.
- Employs Web Audio API and `fft.js` for acoustic spectral analysis (frequency variance, pitch consistency, synthetic silence detection) combined with automated speech-to-text transcription.

### 6. Threat Radar & Bento Intelligence
- Asymmetric 3-column Bento grid featuring live global threat telemetry, regional threat distributions, radar scans, and community-reported attack vectors.
- Supabase-backed live threat feed with instant search, category filters, and verifiable community upvoting.

---

## 👨‍👩‍👧‍👦 Senior & Family Safety Mode

TrustBreak AI features a dedicated, accessible interface mode tailored specifically for elderly citizens, non-technical family members, and digitally vulnerable users.

- **Bilingual Interface (English & हिन्दी):** Complete real-time localization across all buttons, explanations, badges, and scanner prompts.
- **Voice Guide (`Read Aloud` / `बोलकर समझाएं`):** Integrated text-to-speech audio narration using native Web Speech Synthesis with automatic language detection (English or Hindi voice).
- **Simplified 1-Tap Scans:** Direct camera photo upload, clipboard paste, and large 56px touch targets optimized for tremor or motor difficulty.
- **Plain-English Explanations:** Strips complex technical jargon (e.g., "heuristic entropy variance") and presents clear, comforting guidance (e.g., *"This message is fake. Do not click the link or send any money."*).
- **Direct 1930 Helpline Access:** Instant 1-tap phone dialer button to reach India's **National Cyber Crime Helpline (1930)** and access national complaint guidelines.

---

## ⚡ Centralized AI Router Architecture (`aiRouter`)

TrustBreak AI features an enterprise-grade, multi-provider model routing layer located at `src/lib/aiRouter.js` and `api/_lib/resilience.js`. This architecture guarantees high availability, zero vendor lock-in, and immunity against API rate limits or regional outages.

### 1. Dual Fallback Chains
- **Text / Link / QR / Extension Pipeline:**
  1. **Primary:** `openai/gpt-oss-20b` (Groq LPU — near-instant inference speed)
  2. **Fallback 1:** `llama-3.1-8b-instant` (Groq LPU — high daily token quota)
  3. **Fallback 2:** `gemini-3.5-flash-lite` (Google Gemini — cross-provider failover)
  4. **Fallback 3:** Local Deterministic Heuristic Engine (zero network dependency)
- **Vision / Screenshot / Audio Pipeline:**
  1. **Primary:** `gemini-3.5-flash-lite` (Google Gemini — high multimodal throughput & 500 RPD)
  2. **Fallback 1:** `gemini-3.8-flash` (Google Gemini — enterprise multimodal backup)
  3. **Fallback 2:** Client-Side Acoustic & Optical Heuristics

### 2. High-Resilience & Anti-Crash Mechanisms
- **24-Hour Deduplication Cache:** Every scanned URL or message is hashed (SHA-256). Identical repeated scans return immediately from the local/edge cache, eliminating duplicate external API calls during viral phishing waves.
- **Automatic 1.5s Jitter Retry on 429/503:** If Groq or Gemini returns HTTP 429 (Rate Limit) or 503 (Provider Overload), the engine pauses for 1.5 seconds and retries seamlessly before triggering cross-provider failover.
- **Per-IP Rate Limiting:** All `/api/*` endpoints are protected with lightweight, in-memory sliding-window rate limiters to prevent API abuse.
- **Unified Normalized JSON Schema:** Regardless of which model or provider responds, the payload is normalized into a strict schema (`score`, `verdict`, `category`, `summary`, `indicators`, `recommendation`), ensuring that the frontend UI never breaks or receives malformed data.

---

## 📲 Progressive Web App (PWA) & Mobile Ready

TrustBreak AI is a certified, fully installable **Progressive Web App (PWA)**:

- **Cross-Platform Standalone Mode:** Installable directly to the home screen or desktop without third-party app stores on **Android, iOS, macOS, Windows, and Linux**.
- **Native Install Interception:** Intercepts `beforeinstallprompt` to surface a clean, accessible **"📲 Install App"** button inside the sidebar, mobile navigation drawer, and Settings page.
- **Zero Input Freeze on Mobile:** Initial splash screen unmounts instantly (`<600ms`), while heavy Recharts and Leaflet graphics hydrate asynchronously in the background. Mobile header buttons (`← Back`, `Sign In`, `Menu`) remain 100% responsive from the first frame (`0.0s`).
- **Offline Shell & Caching:** Standard Service Worker (`public/sw.js`) caches static assets, logos, fonts, and core views for instant loading under intermittent or disconnected network states.
- **Silent PWA Auto-Updates:** Immediate service worker activation via `skipWaiting()` + `clients.claim()` delivers seamless background updates on mobile and desktop — no manual refresh or "reload to update" prompt.

---

## ⚡ Performance & Scalability

TrustBreak AI is engineered to stay fast as traffic, devices, and scan history grow:

- **Sub-Second Load Performance:** Route-level code splitting with `React.lazy` + `Suspense` keeps the initial bundle small (secondary views load on demand), `preconnect` hints warm Supabase / API / Groq / Gemini origins before the JS bundle boots, and Supabase scan history is fetched in 20-row pages (`.range(0, 19)`) instead of pulling every row at once with a `Load More` action.
- **Dual-Layer Caching:** An in-browser `localStorage` cache (24-hour TTL) inside the centralized `aiRouter` works alongside server-side 24-hour deduplication, so identical message, URL, and investigation requests resolve instantly — online or offline — with zero wasted API quota. Only complete, verified verdicts are cached; degraded results are never persisted.
- **Head-Only KPI Counts:** Dashboard totals use Supabase `{ count: 'exact', head: true }` queries, so KPI cards stay accurate with millions of rows without transferring or scanning the full history table.

---

## 📱 Mobile-First Experience

- **Quick-Scan Bottom Sheet:** One-tap access to **Message, Link, Screenshot, QR, and Voice** scanners directly from the Command Center dashboard.
- **Responsive Cards & Tabs:** Threat Radar tabs, Reports filter pills, scan log cards, and Settings action rows reflow cleanly on small screens — every button and timestamp stays inside its card border with no horizontal overflow.
- **Focused Dashboard:** The Command Center shows only the latest **4 Recent Inspections** plus a full-width **View All History** action when more records exist.
- **Touch-Ready Controls:** 44px+ targets, non-wrapping action pills, and stacked mobile actions keep the interface comfortable and easy to tap.

---

## ✅ Automated Verification

**104 / 104 automated end-to-end verification tests pass**, covering the centralized `aiRouter` (fallback chains, normalized verdict schema, cache behavior), scam-detection heuristics (smishing, lookalike KYC URLs, legitimate domains), Hindi/English Senior Mode translations, and PWA configuration (manifest, service worker activation). The suite has since grown to **107 / 107** with three additional cache regression tests.

```bash
npm test           # scanner, tinyfish, extension, blocklist, auth, and cache regression suites
npm run verify:app # 10 core app verification checks
npm run lint       # zero lint violations
npm run build      # production build succeeds
```

---

## 🧩 Chrome Browser Shield Extension (Manifest V3)

TrustBreak AI includes an official Manifest V3 Chrome extension located in the `extension/` directory, extending real-time phishing protection directly into everyday browsing.

### Features:
- Real-time pre-click link inspection and background threat analysis.
- Live DOM context scanning using Groq LPU models.
- Direct 1-click bridge to open detailed threat reports in the TrustBreak AI Web App.

### Installation Instructions:
1. Build the production extension package:
   ```bash
   npm run build:extension
   ```
2. Open Google Chrome (or Brave / Microsoft Edge / Opera) and navigate to:
   ```text
   chrome://extensions
   ```
3. Toggle the **Developer mode** switch in the upper-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the `dist-extension/` directory generated by the build (or select `extension/` for live source development).

---

## 🛠️ Technology Stack

| Domain | Technologies & Libraries |
|---|---|
| **Core Framework** | React 18, Vite 6, React Router (HashRouter for edge/PWA compatibility) |
| **Styling & Design System** | Tailwind CSS 3, Radix UI primitives, Lucide React, Framer Motion |
| **AI Inference & LLMs** | Groq LPU (`gpt-oss-20b`, `llama-3.1-8b-instant`, `whisper-large-v3`), Google Gemini (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) |
| **Data Layer & Realtime** | Supabase (PostgreSQL, Row Level Security, Supabase Auth, Supabase Realtime) |
| **State & Async Querying** | TanStack React Query v5 |
| **Computer Vision & Audio** | `jsQR`, Canvas API, Web Audio API, `fft.js` |
| **Edge Serverless Backend** | Vercel Serverless Functions (`/api`), Vercel Cron |
| **Mobile & Extension** | Progressive Web App (PWA) + Capacitor Android + Chrome Manifest V3 Extension |

---

## 🚀 Local Development & Setup

### Prerequisites
- **Node.js:** v18.0.0+ (Node 20 or 22 LTS recommended)
- **Package Manager:** `npm` (v9+)
- **API Keys (Optional but recommended):**
  - Groq API Key ([console.groq.com](https://console.groq.com))
  - Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com))
  - Supabase Project ([supabase.com](https://supabase.com))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sidhinath/trust-break-ai.git
cd trust-break-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Populate the required configuration keys:
```env
# Client-Safe Variables (Frontend Bundled)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Serverless & Edge API Keys (Never commit to public VCS)
GROQ_API_KEY="gsk_your_groq_api_key"
GEMINI_API_KEY="AIzaSy_your_gemini_api_key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Operational Feature Flags
ENABLE_VOICE_SCANNER="true"
ENABLE_PRE_CLICK_INTERCEPTOR="true"
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` to explore the application locally.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches Vite local development server with HMR |
| `npm run build` | Compiles frontend assets, PWA manifest, and service worker into `dist/` |
| `npm run preview` | Starts local HTTP server previewing the compiled production bundle |
| `npm run build:extension` | Validates MV3 CSP constraints and packages the Chrome extension to `dist-extension/` |
| `npm test` | Runs automated test suites for scanners, auth, and heuristic/cache logic |
| `npm run verify:app` | Runs the 10 core end-to-end app verification checks (`aiRouter`, heuristics, Senior Mode, PWA) |
| `npm run lint` | Analyzes codebase for formatting and lint violations |
| `npm run supabase:setup` | Provisions database tables, RLS policies, and telemetry schemas in Supabase |

---

## 🔒 Security, Privacy & DPDP Act 2023 Compliance

TrustBreak AI is built around a **Privacy Sovereignty Architecture**:
- **Zero Raw PII Storage:** Scanned messages, voice clips, and screenshot buffers are processed ephemerally in volatile memory and purged immediately after risk classification.
- **Client-Side Image Hashing:** Visual inputs are pre-hashed and compressed on the client device before network transit.
- **DPDP Act (2023) Alignment:** Configured in compliance with India's **Digital Personal Data Protection Act, 2023**, respecting data minimization, explicit user consent banners, and clear user-requested data purging controls.
- **Headquartered & Engineered:** Designed and engineered in **Greater Noida, Uttar Pradesh, India**.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See [LICENSE](LICENSE) for complete terms and rights.

**TrustBreak AI** — *Autonomous Multi-Modal Scam Defense for Everyone.*  
Website: [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app) | Issues & Roadmap: [GitHub Issues](https://github.com/sidhinath/trust-break-ai/issues)
