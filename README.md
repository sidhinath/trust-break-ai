# TrustBreak AI

> **Autonomous Multi-Modal AI Cybersecurity & Digital Scam Prevention Platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trust--break--ai.vercel.app-00e5ff?style=for-the-badge&logo=vercel&logoColor=white)](https://trust-break-ai.vercel.app)
[![Repository](https://img.shields.io/badge/GitHub-sidhinath%2Ftrust--break--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sidhinath/trust-break-ai.git)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live App:** https://trust-break-ai.vercel.app  
**Source Code:** https://github.com/sidhinath/trust-break-ai.git

---

## Overview

TrustBreak AI is a full-stack, multi-modal cyber-defense platform that detects, explains, and mitigates social engineering threats across **messages, links, screenshots, QR codes, and voice calls** in real time.

Instead of giving users an unexplained "scam" label, TrustBreak AI returns an explainable verdict with:

- A fraud score from `0–100`
- A risk level (`safe`, `suspicious`, `scam`)
- Standardized reason codes
- A plain-English explanation
- The attacker's likely intent

The platform combines fast LLM inference, multimodal vision, speech transcription, live web investigation, deterministic local heuristics, and a Supabase-backed data layer. It also includes a **Senior & Family Safety Mode**, a **Chrome MV3 Browser Shield extension**, and an **Android build via Capacitor**.

---

## AI Models Used

TrustBreak AI uses a **primary model + automatic fallback chain** so the platform keeps working if a provider is unavailable, rate-limited, or missing an API key.

| Provider | Model | Purpose |
|---|---|---|
| **Groq** | `llama-3.3-70b-versatile` | Primary text analysis for messages, URLs, and community scam reports |
| **Groq** | `llama-3.1-8b-instant` | Fast fallback for text analysis |
| **Groq** | `llama3-70b-8192`, `llama3-8b-8192` | Legacy Llama fallbacks |
| **Groq** | `mixtral-8x7b-32768` | Additional fallback model |
| **Groq** | `whisper-large-v3` | Speech-to-text transcription for voice and audio scans |
| **Google Gemini** | `gemini-2.5-flash` | Primary multimodal vision model for screenshots and OCR |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro` | Vision fallback chain |
| **Google Gemini** | `gemini-1.5-flash` | Audio/deepfake call and voice-cloning analysis |
| **OpenAI** | `gpt-4.1-mini` | Optional vision fallback for screenshot analysis |
| **TinyFish** | Web automation agent | Live headless-browser investigation of suspicious websites |
| **Local engine** | Deterministic heuristic rules + `fft.js` | Offline fallback, URL/domain rules, and acoustic spectral analysis |

### How the fallback chain works

1. **Text scans** → Groq Llama 3.3 70B → smaller Groq models → local heuristic engine.
2. **Screenshot scans** → Gemini 2.5 Flash → Gemini fallback models → OpenAI GPT-4.1-mini → local OCR/heuristics.
3. **Voice scans** → Gemini audio analysis → Groq Whisper transcription + Llama analysis → local acoustic heuristics.
4. **Web investigation** → TinyFish live browser agent, with graceful failure if the service is unavailable.

The app remains usable without AI keys: it automatically falls back to on-device heuristic analysis.

---

## Key Features

- **Multi-modal scanning** — SMS/email text, URLs, screenshots, QR codes, and voice recordings
- **Explainable AI verdicts** — fraud score, risk level, confidence, reasons, attack intent, and fixed reason codes
- **Voice & deepfake detection** — Groq Whisper transcription plus acoustic spectral analysis with `fft.js`
- **Screenshot & OCR analysis** — Gemini vision with OpenAI fallback
- **QR code inspector** — camera scanning or image upload using `jsQR`
- **Browser Shield** — Chrome Manifest V3 extension for pre-click URL protection
- **Live threat intelligence** — community reports, Supabase Realtime updates, and a live threat radar
- **Senior & Family Safety Mode** — larger touch targets, high contrast, and simplified explanations
- **Dual persistence** — Supabase database with local-first `localStorage` fallback
- **Offline resilience** — deterministic local rules keep core scanning available without network access
- **Authentication** — Supabase email/password auth, email confirmation, guest browsing, and protected routes
- **Cross-platform** — responsive web app plus Android support through Capacitor

---

## Authentication & Access Control

TrustBreak AI uses **Supabase Auth** with the following behavior:

- **Sign Up** with full name, email, and password
- **Email confirmation** before the first sign-in (configurable in Supabase)
- **Sign In / Sign Out** from the navbar and account modal
- **Guest mode** — visitors can skip onboarding and browse public pages
- **Protected routes** — scanners, reports, settings, profile, and other sensitive pages require a real account
- **Pre-navigation login prompt** — guests are prompted before opening a protected feature
- **Session persistence** — sessions survive page reloads through Supabase's persisted session and automatic token refresh
- **Resume after login** — after signing in from a protected-route prompt, the user is taken to the page they originally requested

### Public pages

`Home`, `ScanHub` (hub shell), `Threats`, `Technology`, `BusinessModel`, `PrivacyPolicy`, `Terms`, `CookiePolicy`, `RefundPolicy`

### Protected pages

`MessageScanner`, `LinkScanner`, `ScreenshotScanner`, `QRScanner`, `VoiceScanner`, `BrowserShield`, `ScamHeatmap`, `ReportScam`, `Reports`, `Settings`, `Profile`, `PrivacyCenter`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, React Router |
| Styling / UI | Tailwind CSS, Radix UI, shadcn/ui components, Framer Motion, Lucide icons |
| Data fetching | TanStack React Query |
| Charts / Maps | Recharts, React Leaflet |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL, Row Level Security, Realtime, Storage |
| AI / Inference | Groq, Google Gemini, OpenAI, TinyFish |
| Voice / Audio | Web Audio API, `fft.js`, Groq Whisper |
| QR / Vision | `jsQR`, browser camera APIs, Gemini vision |
| Backend | Vercel Serverless Functions (`/api`) |
| Deployment | Vercel Edge CDN + daily Vercel Cron |
| Mobile | Capacitor (Android) |
| Browser Extension | Chrome Manifest V3 |

---

## Architecture

```text
User Input
   │
   ├── Message / URL ──────► Groq Llama 3.3 70B ──► Fallback Groq models ──► Local heuristics
   ├── Screenshot / QR ────► Gemini 2.5 Flash ────► Gemini fallbacks ──────► OpenAI GPT-4.1-mini
   ├── Voice / Audio ──────► Gemini audio ────────► Whisper + Llama ───────► Acoustic heuristics
   └── Suspicious Website ─► TinyFish browser agent ───────────────────────► Local URL rules
                                    │
                                    ▼
                     Explainable verdict + reason codes
                                    │
                                    ▼
              Supabase (Auth, PostgreSQL, Realtime, Storage)
                                    │
                                    ▼
                    Web app · Android app · Chrome extension
```

Serverless endpoints:

- `/api/analyze` — text, URL, screenshot, and report analysis
- `/api/analyze-voice` — voice transcription and deepfake/scam analysis
- `/api/blocklist-lite` — pre-click interceptor blocklist
- `/api/tinyfish/investigate` — live web investigation
- `/api/health` — health check
- `/api/cron/sync-feeds` — daily threat-feed synchronization

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm
- A Supabase project (for authentication and data persistence)
- Optional: Groq, Gemini, OpenAI, and TinyFish API keys for full AI functionality

### 1. Clone the repository

```bash
git clone https://github.com/sidhinath/trust-break-ai.git
cd trust-break-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values.

**Client-safe variables** (bundled into the frontend):

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-publishable-or-anon-key"
```

**Server-only variables** (never prefix with `VITE_`):

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

GROQ_API_KEY="your-groq-api-key"
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"          # optional
TINYFISH_API_KEY="your-tinyfish-api-key"      # optional

CRON_SECRET="your-high-entropy-secret"
ENABLE_VOICE_SCANNER="true"
ENABLE_PRE_CLICK_INTERCEPTOR="true"
```

> Never commit `.env` or expose the service-role key in client code.

### 4. Apply the Supabase schema

Run the SQL setup against your Supabase project. The scripts require a Supabase Personal Access Token and project ref:

```bash
# PowerShell
$env:SUPABASE_PAT="your-supabase-personal-access-token"
$env:SUPABASE_PROJECT_REF="your-project-ref"
npm run supabase:setup
```

This creates and configures the `scan_history`, `scam_reports`, and `threat_indicators` tables, RLS policies, and related functions.

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:5173.

### 6. Production build

```bash
npm run build
npm run preview
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run the scanner and TinyFish test suites |
| `npm run typecheck` | Run TypeScript checks |
| `npm run dev:vercel` | Run the project with Vercel CLI (includes `/api` functions) |
| `npm run supabase:setup` | Apply `supabase/full-setup.sql` |
| `npm run supabase:sql` | Apply a specific SQL file |
| `npm run supabase:reset` | Reset the Supabase setup |

---

## Mobile & Browser Extension

### Android (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
```

### Chrome extension

The Manifest V3 extension lives in `extension/`.

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` directory

---

## Deployment

The production app is deployed on **Vercel**:

**Live:** https://trust-break-ai.vercel.app

Deployment steps:

1. Import the repository into Vercel.
2. Add all required environment variables in **Project Settings → Environment Variables**.
3. Deploy the `main` branch.
4. Apply the Supabase schema if it has not been applied yet.
5. Configure the Supabase **Site URL** and **Redirect URLs** for your production domain.
6. Verify `/api/health` after deployment.

`vercel.json` configures security headers, SPA rewrites, serverless function limits, and the daily cron job.

---

## Project Structure

```text
TrustBreak AI/
├── api/                     # Vercel serverless functions
│   ├── analyze.js           # Text, URL, screenshot, report analysis
│   ├── analyze-voice.js     # Voice transcription and deepfake analysis
│   ├── blocklist-lite.js    # Pre-click blocklist endpoint
│   ├── tinyfish/            # Live web investigation
│   └── cron/                # Daily threat-feed sync
├── extension/               # Chrome MV3 Browser Shield extension
├── src/
│   ├── components/          # UI, scanners, auth, dashboard components
│   ├── hooks/               # Reusable hooks, including protected-feature gating
│   ├── lib/                 # Auth, Supabase, API, scanner, and data utilities
│   ├── pages/               # Application pages
│   ├── App.jsx              # Routing and global providers
│   └── Layout.jsx           # Navigation, auth controls, protected-route gate
├── supabase/                # SQL schema, RLS policies, and seed data
├── docs/                    # PRD, deployment, security, and demo documentation
├── tests/                   # Node test suites
└── vercel.json              # Vercel configuration
```

---

## Documentation

More detailed documentation is available in [`docs/`](./docs):

- Product Requirements Document
- Architecture and technology overview
- Deployment and infrastructure guide
- Security and privacy documentation
- Demo guide and final demo checklist
- Business model and roadmap

---

## License

**MIT License** © 2024–2026 TrustBreak AI

---

## Links

- **Live Demo:** https://trust-break-ai.vercel.app
- **GitHub Repository:** https://github.com/sidhinath/trust-break-ai.git
- **Issues:** https://github.com/sidhinath/trust-break-ai/issues
