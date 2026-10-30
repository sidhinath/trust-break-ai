# GHOSTNET SENIOR & FAMILY SAFETY MODE — IMPLEMENTATION PLAN

**Date:** 2026-10-10  
**Status:** In Execution  
**Target:** Web (Vercel) & Android APK (`GhostNet.apk`)  

---

## Executive Summary & Objectives

GhostNet Senior & Family Safety Mode delivers a high-contrast, accessible, plain-language cybersecurity interface designed specifically for elderly and non-technical users. It operates as a seamless layer on top of the existing GhostNet Cyber Defense architecture without altering database schemas, breaking existing RLS security rules, or requiring paid external APIs.

### Preservation Invariants
1. **Zero Data Loss / Zero Hard Resets:** All existing scanners, historical logs, authentication flows, and Supabase database contracts remain intact.
2. **Deterministic Offline Capability:** Emergency scam guidance, family impersonation heuristics, and Web Speech API voice synthesis function offline without third-party API dependencies.
3. **Verified Codebase Quality:** Maintain 100% passing test suite (`npm test`) throughout implementation.

---

## Requirement Mapping & Architecture

| # | Feature / Requirement | Implementation Component / File | Verification Method |
|---|-----------------------|---------------------------------|---------------------|
| 1 | **Prominent Mode Switch** | `src/Layout.jsx` (Header & Nav) | Labels display `NORMAL MODE → SWITCH TO SENIOR MODE` & `SENIOR MODE → SWITCH TO NORMAL MODE`. Persisted in `localStorage`. |
| 2 | **Senior Mode Home Screen** | `src/components/SeniorHomeView.jsx` & `src/pages/Home.jsx` | 4 Large Action Cards: `CHECK A MESSAGE`, `CHECK A LINK`, `CHECK A SCREENSHOT`, `GET EMERGENCY HELP`. Minimum 48dp touch targets. |
| 3 | **Plain-Language Explanations** | `src/components/SeniorScanExplanation.jsx` | 3 Sections: What GhostNet Detected, Why We Flagged It, What You Should Do Next. |
| 4 | **Free Voice Assistance** | `src/components/VoiceAssistance.jsx` | Web Speech API (`SpeechSynthesis`) with Read, Pause, Resume, Stop, 0.75x-1.25x Speed, and English (`en-IN`)/Hindi (`hi-IN`) selection. Auto-cancels on unmount. |
| 5 | **Emergency Scam Guidance** | `src/components/EmergencyGuidanceModal.jsx` | 5 Offline Scenarios (OTP shared, Money transferred + India 1930 / cybercrime.gov.in details, Suspicious App, Personal Info, Extortion/Threats). |
| 6 | **Trusted Contact Sharing** | `src/components/TrustedContactModal.jsx` | User-initiated sharing workflow (Check Myself First, Ask Trusted Contact via Web Share / Clipboard, Cancel). |
| 7 | **Family Impersonation Detector**| `src/lib/reasonCodes.js` & `src/lib/scanner.js` | Heuristic checks flagging `FAMILY_IMPERSONATION_RISK` for urgent payment demands pretending to be family members. |
| 8 | **Interactive Scam Simulation** | `src/components/ScamSimulationModal.jsx` | "Can You Spot the Scam?" quiz with 3 real-world scenarios. |
| 9 | **Scanner Integration** | `src/pages/ScanHub.jsx` & Scanner Pages | Embeds `SeniorScanExplanation` and `TrustedContactModal` in Senior Mode. |
| 10| **Build & Release Verification** | `npm run build`, `./gradlew assembleDebug` | Verified Web build and compiled root `GhostNet.apk`. |

---

## Execution Waves

### Wave 1: Baseline Preservation & Dictionary Setup
- Create `PRE_SENIOR_MODE_CHECKPOINT.md` (Completed).
- Update `src/lib/reasonCodes.js` to include `FAMILY_IMPERSONATION_RISK`.
- Update `src/lib/scanner.js` with family impersonation detection rules.

### Wave 2: Core Components Construction
- Construct `src/components/VoiceAssistance.jsx`.
- Construct `src/components/SeniorScanExplanation.jsx`.
- Construct `src/components/EmergencyGuidanceModal.jsx`.
- Construct `src/components/TrustedContactModal.jsx`.
- Construct `src/components/ScamSimulationModal.jsx`.
- Construct `src/components/SeniorHomeView.jsx`.

### Wave 3: Integration & Prominent Mode Switch
- Update `src/Layout.jsx` header and sidebar to feature the prominent mode toggle switch.
- Update `src/pages/Home.jsx` to conditionally render `SeniorHomeView` when Senior Mode is enabled.
- Update `src/pages/ScanHub.jsx`, `MessageScanner.jsx`, `LinkScanner.jsx`, `ScreenshotScanner.jsx`.

### Wave 4: Test Suite & Build Verification
- Execute `npm test` and add test coverage for reason code dictionaries and family impersonation.
- Execute `npm run build`.
- Execute `npx cap sync android` and `./gradlew assembleDebug`.
- Update root [`GhostNet.apk`](file:///d:/LOQ/Documents/Hackathon%20Project/GhostNet%20ai/GhostNet-app/GhostNet-app/GhostNet.apk).
- Update documentation (`README.md`, `docs/MOBILE.md`, `docs/CHANGELOG.md`).
