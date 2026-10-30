# TrustBreak AI

> Autonomous Multi-Modal AI Cybersecurity & Digital Scam Prevention Platform

[Live Demo](https://trust-break-ai.vercel.app) • [Repository](https://github.com/sidhinath/trust-break-ai.git)

## Overview
TrustBreak AI detects, explains, and mitigates social engineering threats across messages, links, screenshots, QR codes, and voice calls in real time. It provides explainable verdicts with 10 fixed reason codes and offers a senior‑friendly safety mode.

## Key Features
- Multi‑modal scanning (text, URLs, screenshots, voice, QR)
- Explainable AI with standardized reason codes (`safeParseVerdict`)
- Browser Shield (Chrome MV3 extension) for pre‑click protection
- Senior & Family Safety Mode with voice assistance
- Offline resilience via local heuristics

## Quick Start
```bash
git clone https://github.com/sidhinath/trust-break-ai.git
cd "TrustBreak AI"
npm install
npm run dev   # starts Vite dev server at http://localhost:5173
```

## Mobile & Extension
- Android build with Capacitor (`npm run build && npx cap add android`)
- Chrome MV3 extension located in `extension/` (load unpacked in chrome://extensions)

## License
MIT © 2024‑2026 TrustBreak AI
