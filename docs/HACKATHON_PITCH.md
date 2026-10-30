# GhostNet AI — Hackathon Pitch Deck & Executive Dossier

## 1. Executive Summary

Digital fraud and AI-orchestrated social engineering cause over **$10 Billion in annual consumer losses worldwide**. Cybercriminals are leveraging generative AI to automate personalized spear-phishing, synthesize fake bank alerts, generate lookalike domains, clone executive voices, and distribute weaponized QR codes.

Current cybersecurity solutions fail consumers because:
1. **They are opaque black boxes:** Outputting generic percentage scores without explaining *why* a threat is dangerous or *how* it operates.
2. **They speak in technical jargon:** Terms like *Punycode, reverse DNS, and SSL cipher suites* confuse everyday users and vulnerable elderly demographics.
3. **They fail under offline conditions:** Completely collapsing when users lose network connectivity or external APIs suffer outages.

**GhostNet AI delivers the solution: An autonomous, explainable multi-modal cyber defense platform.**

```text
Detect ➔ Explain ➔ Reconstruct ➔ Intercept ➔ Contain
```

---

## 2. The 8 Unfair Advantages

1. **Threat Reconstruction™ (Interactive Cyber Kill-Chain):**
   Deconstructs every attack into an interactive 5-stage progression (*Ingress* ➔ *Social Engineering* ➔ *Phishing Gateway* ➔ *Credential Harvesting* ➔ *Financial Loss*).
2. **Explainable Risk Scoring (10 Fixed Reason Codes):**
   Standardizes risk analysis using 10 immutable threat codes (`URGENCY_SCARE_TACTICS`, `REQUEST_OTP_PASSWORD`, etc.) protected by strict code defense against LLM hallucinations.
3. **Sub-Second Multi-Modal AI (Groq LPU + Google Gemini 2.5 Flash):**
   Sub-500ms natural language processing on Groq LPU paired with high-accuracy Gemini Vision OCR for forged receipts, fake banking logos, and QR codes.
4. **Acoustic Deepfake Call & Voice Scam Detection:**
   Calculates in-memory Fast Fourier Transform (FFT) **Wiener Spectral Flatness** and harmonic energy ratios to identify synthetic AI vocoders and cloned voices.
5. **Live WebRTC Camera QR Code Inspector:**
   Scans and defangs QR codes in real-time, recursively parsing embedded URLs and UPI intent strings before users navigate.
6. **Real-Time Browser Extension (Chrome MV3) & Pre-Click Sandbox:**
   Monitors active browser tabs, queries low-latency SHA-256 blocklists (`/api/blocklist-lite`), and provides an educational zero-execution simulation sandbox.
7. **Guaranteed 100% Offline Continuity:**
   An autonomous local regex and NLP heuristic engine scores threats in under 5ms directly on the client if cloud APIs or cellular networks are unavailable.
8. **Senior & Family Safety Mode:**
   1-click transformation designed for non-technical family members: enlarges touch targets to 48dp, scales typography, and translates technical cyber indicators into plain-English advice.

---

## 3. Market Opportunity & Business Model

* **Target Addressable Market (TAM):** \$20B+ global consumer cybersecurity and identity fraud prevention market.
* **Serviceable Addressable Market (SAM):** 800M+ mobile-first digital banking and UPI payment users across India, Southeast Asia, and emerging markets.
* **Go-To-Market (GTM):**
  * **Freemium Consumer Tier:** Free essential message, URL, and QR code inspection.
  * **Pro Family Defense ($4.99/mo):** Multi-device protection, live voice call deepfake monitoring, and MV3 Browser Shield across all household members.
  * **B2B FinTech SDK:** White-label threat scanning API for banking and digital wallet applications to detect fraudulent incoming SMS before payment authorization.

---

## 4. Technical Architecture Summary

* **Frontend:** React 18, Vite 6, Tailwind CSS 3.4, ThreeUI ambient living shaders, Framer Motion.
* **Edge Gateways:** Vercel Edge Serverless Microservices (`/api/analyze`, `/api/analyze-voice`, `/api/blocklist-lite`, `/api/cron/sync-feeds`).
* **Database & Auth:** Supabase PostgreSQL 15 with strict Row-Level Security, separate anon/service-role access keys, and PostgREST atomic upserts.
* **Mobile Runtime:** Native Android package via Capacitor 8.5.
* **Browser Extension:** Google Chrome Manifest V3 with DeclarativeNetRequest background interceptors.
* **Automated Quality Gates:** 40/40 tests passing across 15 suites in `tests/scanner.test.js`.

---

## 5. The Closing Pitch

> "Cybersecurity should not require a computer science degree. GhostNet AI puts an autonomous, explainable security operations center directly into the pocket of every citizen.
>
> **GhostNet AI — See the scam before it sees you.**"
