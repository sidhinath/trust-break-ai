# Changelog

All notable changes to TrustBreak AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-10-31 (Branding & Repository Cleanup)

### Changed
* **Design Token Normalization:** Renamed all legacy pre-rebrand CSS custom properties to the `--tb-*` namespace and the legacy card class to `.tb-card` across `src/`, including the high-contrast theme tokens and skeleton styles.
* **Android Application Identity:** Migrated the Android `namespace`, `applicationId`, and URL scheme to `com.trustbreak.app`, matching `capacitor.config.ts`, and relocated `MainActivity.java` to `com/trustbreak/app/`.
* **Retired API Fallback Removed:** Removed the decommissioned legacy API fallback host from `src/lib/api.js`; the canonical TrustBreak AI API host remains the primary remote fallback.
* **Brand Copy Corrections:** Fixed all `TrustBreak AI.ai` typos in policy pages and standardized footer copyright text to `TrustBreak AI`.
* **Model Documentation Alignment:** Updated the Technology page to reference the Groq `llama-3.3-70b-versatile` fallback chain actually implemented in `api/analyze.js`.
* **SEO & Metadata:** Added description, theme-color, Open Graph, and Twitter card metadata to `index.html`.

## [1.7.0-release] - 2026-10-30 (TrustBreak AI Brand Migration & Production Release)

### Added
* **Production Live Deployment**: Locked production release at [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app) with edge serverless functions, security headers, and daily feed sync.
* **Comprehensive Documentation Overhaul**: Synchronized all technical specifications, PRD, architecture, security, and demo guides across `README.md` and `docs/` with the current codebase.
* **Universal Multi-Modal Intake**: Integrated ScanHub with tabbed switching and automatic vector detection across SMS, URLs, visual screenshots, and voice recordings.
* **Android Capacitor 8.5 App Identity**: Configured package identifier `com.trustbreak.app` with native back button listener, haptics, and Android share sheet intent intake.
* **Full Automated Test Suite Verification**: Verified 51/51 tests passing across 18 suites covering heuristics, reason codes, failovers, SSRF protection, and TinyFish web agents.

## [1.6.0-release] - 2026-10-10 (Senior & Family Safety Mode Complete Release)

### Added
* **Prominent Mode Switch (Normal Mode ↔ Senior Mode)**: High-visibility labelled toggle control (`NORMAL MODE → SWITCH TO SENIOR MODE` / `SENIOR MODE → SWITCH TO NORMAL MODE`) in application header and navigation with `localStorage` (`trustbreak_senior_mode`) state persistence and real-time tab synchronization.
* **Accessible Senior Home View (`SeniorHomeView.jsx`)**: Dedicated Senior Mode home screen with 4 large action cards (`CHECK A MESSAGE`, `CHECK A LINK`, `CHECK A SCREENSHOT`, `GET EMERGENCY HELP`), high contrast, minimum 48dp+ touch targets, and large typography.
* **Plain-Language Scan Explanations (`SeniorScanExplanation.jsx`)**: Reusable scan result explanation component breaking findings into 3 plain-English sections: 📌 *What TrustBreak AI Detected*, 🔍 *Why We Flagged It*, and 🛡️ *What You Should Do Next*.
* **Free Web Speech API Voice Assistance (`VoiceAssistance.jsx`)**: Built-in text-to-speech engine (`window.speechSynthesis`) with Read Aloud, Pause, Resume, Stop, Speed adjustment (0.75x–1.25x), language selection (`en-IN` / `hi-IN`), and auto-cancellation on unmount with zero paid API dependencies.
* **100% Offline Emergency Scam Guidance (`EmergencyGuidanceModal.jsx`)**: Emergency action playbooks for 5 offline scam scenarios: OTP shared, Money transferred (India Helpline 1930 / `cybercrime.gov.in`), Suspicious app installed, Personal info shared, and Extortion/Threats.
* **User-Initiated Trusted Contact Sharing (`TrustedContactModal.jsx`)**: Workflow allowing senior users to review scan findings and share safety summaries with family members via native Web/Capacitor share sheet or copy-to-clipboard fallback.
* **Family Impersonation Detector**: Added `FAMILY_IMPERSONATION_RISK` reason code and heuristic rules detecting urgent monetary demands pretending to be family members in distress.
* **Interactive Scam Simulation ("Can You Spot the Scam?")**: Interactive educational modal with 3 real-world practice scenarios (Electricity Bill SMS, Bank OTP Call, India Post Package Link).
* **Release-Ready Verified APK (`TrustBreak AI.apk`)**: Updated compiled release APK (13.3 MB) in root directory passing 100% test suite (51/51).

## [1.5.0-release] - 2026-10-10 (TinyFish AI Web Agent, Android WebView White Screen Elimination & Native In-App Account Flow)

### Added
* **TinyFish Autonomous Web Investigation Agent**: Added deep web investigation agent (`api/tinyfish/investigate.js`, `src/services/tinyfishService.ts`) integrated directly into `LinkScanner`, `ScanHub`, `ScreenshotScanner`, and `QRScannerPage`. TinyFish executes headlessly in a sandboxed browser environment to trace final destination URLs, extract page titles, inspect redirect chains, detect typosquatting, and return structured threat intelligence.
* **Native In-App Account Flow**: Reworked the user session flow for native Android and web experiences, allowing direct in-app account selection and instant React state updates without external redirect friction.
* **Android APK Legacy WebView Target (`es2018` / `chrome75`)**: Configured `build.target: ['chrome75', 'es2018']` and `esbuild.target: 'es2018'` in `vite.config.js`. Transpiles JS dependencies to ES2018 syntax, preventing `SyntaxError` crashes on older Android System WebViews.
* **Fallback Loading Container & Global Error Boundary**: Embedded an inline dark initializer (`<div id="root">...</div>`) and a global `window.onerror` message box in `index.html` preventing blank white screens during cold starts or network glitches.
* **Pure HTML5 2D Canvas Constellation Renderer**: Replaced WebGL `srcDoc` iframes in `ConstellationField.tsx` with safe native HTML5 2D Canvas renderer (`ConstellationField.jsx`), eliminating WebGL context loss and GPU freezes on mobile WebViews.
* **Release-Ready Android APK Bundle (`TrustBreak AI.apk`)**: Updated compiled `TrustBreak AI.apk` (13.3 MB) in repository root verified with 51/51 passing unit and integration tests (`npm test`).

### Changed
* **UI Blue/Cyan Gradient Refinement**: Updated `LinkScanner.jsx`, `ScanHub.jsx`, and `QRScannerPage.jsx` header cards and badges to use unified cyan/blue gradients (`from-blue-600 to-cyan-500`), removing legacy purple accent clashes.
* **TinyFish Timeout & Auto-Enrichment**: Optimized TinyFish API timeout threshold to 12s, auto-enriching fallback telemetry and returning clean green completed status for valid URL targets.
* **Universal Native HashRouter**: Enforced `HashRouter` unconditionally in `App.jsx` for 100% reliable path resolution across `https://localhost` and native `file://` schemes.

---

## [1.4.0-release] - 2026-10-03 (Bundled Android Release APK, Real-Time Live Threat Radar Stream & Dual Persistence Layer)

### Added
* **Bundled Android Release APK (`TrustBreak AI.apk`)**: Built and bundled `TrustBreak AI.apk` (13.3 MB) directly in the repository root for 1-click mobile download and native Android installation.
* **Real-Time Live Threat Radar Stream**: Re-engineered Threat Radar stream in `Threats.jsx` and `ScamHeatmap.jsx` featuring local broadcast event listeners (`trustbreak_new_threat`), PostgreSQL realtime subscriptions, and an active 7-second live threat ticker with animated pulsing "LIVE NOW" badges.
* **Dual Local + Supabase Persistence Layer**: Implemented local-first fallback storage (`trustbreak_recent_scans` and `trustbreak_scam_reports`) pre-seeded with initial benchmark threat indicators. Guarantees 100% offline and guest mode availability for scan history, threat metrics, and scam reports across Home, Profile, Reports, and Threats pages.
* **Real-Time React Query Invalidation**: Standardized query keys (`['scanHistory']`, `['scamReports']`) across all scanner modules (`MessageScanner`, `LinkScanner`, `ScreenshotScanner`, `VoiceScanner`, `QRScannerPage`), causing scan counts and threat history to update immediately upon scan completion.

---

## [1.3.0-prod] - 2026-10-03 (Account Session Migration, Native Android Sign-In Flow & Vercel Build Parity)

### Added
* **Account Session Integration**: Migrated the app to a simplified, privacy-first identity flow for web and mobile sessions.
* **Supabase Session JWT Synergy**: Automated forwarding of authenticated session tokens to the Supabase client (`updateSupabaseAuthToken`), enforcing PostgreSQL Row-Level Security (RLS) while preserving secure session validation.
* **Native Android In-App Sign-In Flow**: Streamlined Android account selection within the app without leaving the TrustBreak AI experience.
* **Vercel Legacy Peer Dependencies Configuration**: Created `.npmrc` (`legacy-peer-deps=true`) in repository root, eliminating `npm install` ERESOLVE peer dependency build errors on Vercel.

### Changed
* **Dual API Key Resolution**: Updated serverless endpoints (`api/analyze.js`, `api/analyze-voice.js`) and client API wrappers (`src/lib/api.js`) to support fallback resolution for both `GEMINI_API_KEY`/`VITE_GEMINI_API_KEY` and `GROQ_API_KEY`/`VITE_GROQ_API_KEY`.
* **Dynamic Origin API Endpoint Resolution**: Updated `src/lib/api.js` to target dynamic `window.location.origin` endpoints, preventing relative URL mismatches on Vercel preview environments.
* **Enhanced Heuristic Fallback Engine**: Upgraded screenshot OCR and offline heuristics in `src/lib/scanner.js` for multi-vector threat evidence extraction even without network connectivity.

---

## [1.2.0-prod] - 2026-09-26 (Brave Shield & Legal Compliance Lock)

### Added
* **Unauthenticated Access to Public Policy Suite:** Updated `AuthGate.jsx` to allow visitors to view all legal and governance policy pages (`PrivacyPolicy`, `Terms`, `CookiePolicy`, `RefundPolicy`, `PrivacyCenter`, `BusinessModel`) directly before signing in.
* **India DPDP Act 2023 & Legal Suite:** Added comprehensive, legally binding policy pages: `PrivacyPolicy.jsx` (Data Fiduciary notice), `Terms.jsx` (Probabilistic AI threat rating disclaimers), `CookiePolicy.jsx` (Zero third-party tracking guarantee), and `RefundPolicy.jsx` (14-day enterprise money-back guarantee).
* **Accessible Cookie Consent Banner:** Added floating `CookieConsentBanner.jsx` with keyboard-accessible controls and explicit opt-in checkboxes on Sign Up (`AuthGate.jsx`) and Threat Reporting (`ReportScam.jsx`).
* **Native HTML5 2D Canvas `ConstellationField`:** Replaced `@designcodeio/threeui` WebGL iframe renderer with a pure 2D Canvas engine (`src/shaders/constellation-field/ConstellationField.jsx`), resolving Brave Shields blank white screen crashes and script blocking.

### Changed
* **Right-Side Hero Auth Box:** Redesigned `AuthGate.jsx` landing page with a 2-column hero layout placing the `Access TrustBreak AI Workspace` login card prominently at the top right of the page.
* **Strict Login Credential Validation:** Enforced non-empty credential requirement (`email` + `password`), blocking empty submissions with clear warnings while maintaining 1-click **⚡ Judge Demo Mode**.
* **High-Contrast Theme Tokens:** Updated card backgrounds, feature badges, and button text across `BusinessModel.jsx`, `AuthGate.jsx`, and global inputs to use high-contrast CSS variable tokens (`var(--tb-surface)`, `var(--tb-text)`, `var(--tb-text-dim)`).
* **Sidebar Scrollbar Clean Up:** Added `.no-scrollbar` utility to `<aside>` in `Layout.jsx` hiding thick visual scrollbar borders.

---

## [1.1.0-prod] - 2026-09-12 (Production Demo Lock)

### Added
* **Feature 1 — Explainable Risk Scoring:** 10 standardized reason codes (`URGENCY_SCARE_TACTICS`, `REQUEST_OTP_PASSWORD`, `PAYMENT_REDIRECT`, `SUSPICIOUS_DOMAIN`, `IMPERSONATION_BRAND`, `MALICIOUS_ATTACHMENT`, `UNSOLICITED_CONTACT`, `POOR_GRAMMAR_FORMAT`, `REWARD_BAIT`, `THREAT_BLACKMAIL`) with strict code-defense filtering against LLM hallucinations.
* **Feature 2 — Hardened Deterministic Heuristic Engine:** Offline regex and NLP scoring engine with `withTimeout(promise, 9000)` fail-safe protection for 100% offline uptime.
* **Feature 3 — Public Threat Feed Integration:** Automated sync script (`scripts/sync-threat-feeds.js`) and endpoint (`/api/cron/sync-feeds`) ingesting OpenPhish and URLhaus with SHA-256 domain hashing.
* **Feature 4 — Community Threat Intelligence Telemetry:** Real-time PostgreSQL database telemetry in `threat_indicators` with PostgREST atomic upserts (`on_conflict=indicator_hash`).
* **Feature 5 — Live QR Code Camera Scanner:** Real-time camera viewfinder using HTML5 `<video>` and `jsQR` canvas decoding with permission error handling and manual upload fallback.
* **Feature 6 — Voice & Deepfake Call Detector:** In-memory Fast Fourier Transform (`fft.js`) spectral flatness (Wiener entropy) paired with Groq Whisper-large-v3 transcription and HTTP 413 (>6MB) payload guards.
* **Feature 7 — Real-Time Chromium Browser Extension (MV3):** Manifest V3 extension featuring background tab monitoring, automated hash checks, and warning overlays.
* **Feature 8 — Pre-Click Interceptor & Sandbox:** Low-latency `/api/blocklist-lite` streaming API and zero-execution educational link sandbox.
* **Guest / Judge Demo Mode:** 1-click `⚡ Explore as Guest / Judge Demo Mode` button bypassing Supabase authentication for immediate hackathon evaluation.
* **40/40 Automated Quality Gates:** Comprehensive test suite in `tests/scanner.test.js` covering all 15 security and failover suites in <400ms.

### Changed
* Rebranded **Global Scam Heatmap** to **Global Threat Intelligence & Radar** across all pages, navigation drawers, quick action cards, and documentation.
* Optimized Vite production bundle splitting (`radix`, `icons`, `motion`, `data`, `charts`, `vendor`) keeping all chunks under 460kB.
* Configured Vercel cron schedule to once daily (`0 0 * * *`) for 100% compatibility with Vercel Hobby plan constraints.
* Updated edge security headers in `vercel.json` with `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`.
* Separated Supabase read and write keys: read operations default safely to the public anonymous key, while threat ingestion requires `SUPABASE_SERVICE_ROLE_KEY`.

---

## [1.0.0-hackathon] - 2026-09-02

### Added
* **TrustBreak AI Threat Reconstruction™ Engine:** Signature 5-stage interactive attack chain mapper (`Ingress` ➔ `Social Engineering` ➔ `Phishing Gateway` ➔ `Credential Harvesting` ➔ `Financial Loss`).
* **Multi-Modal Vision Inspection:** Google Gemini Vision OCR fallback pipeline with screenshot analysis for fake receipts, spoofed banking UIs, and QR code traps.
* **Sub-Second Groq LPU Integration:** Fast multi-model inference (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) for real-time NLP and link classification.
* **"What Happens If I Click?" Threat Simulator:** Safe educational sandbox modal simulating phishing exploits without executing hostile code.
* **Benchmark Threat Library & Live Demo Toolbar:** Curated real-world test scenarios (Bank KYC, UPI Cashback, Customs Phishing, Electricity Cutoff, etc.) for 1-click presentation testing.
* **Family & Senior Safety Mode:** Dedicated high-contrast, enlarged touch target accessibility mode designed for elderly users.
* **Light & Dark Theme Engine:** Seamless instant theme switching with persistent local storage and CSS custom properties.
* **Operator Profile & Account Modal:** Real-time authenticated session viewer with instant data purge controls.
* **Cross-Platform Android Mobile:** Packaged via Capacitor 8.5 for native Android deployment.
