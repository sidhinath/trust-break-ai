# Privacy Sovereignty & Data Minimization Policy

GhostNet AI operates on the architectural principle of **Data Sovereignty and Ephemeral Processing**. In the cybersecurity domain, privacy is paramount: users inspecting sensitive financial alerts, personal messages, or phone recordings must have absolute confidence that their private communications are never cataloged, monetized, or retained.

---

## 1. Core Privacy Tenets

1. **Zero Advertising Tracking:** GhostNet contains zero third-party marketing trackers, telemetry pixels, or commercial surveillance SDKs.
2. **Ephemeral In-Memory Processing:** Submitted messages, URLs, screenshots, and audio payloads are evaluated strictly in volatile memory. Unflagged personal content is discarded immediately upon verdict delivery.
3. **One-Way Cryptographic Fingerprinting:** When malicious indicators are syndicated to the community threat radar, they are hashed via SHA-256. Raw personal phone numbers or private account numbers are never broadcast in plaintext.
4. **Zero Audio Retention:** Voice call recordings and live microphone streams processed by `/api/analyze-voice` are analyzed in-memory for spectral flatness and linguistic coercion, then wiped immediately. No raw audio files are ever written to persistent storage.

---

## 2. Telemetry & Data Classification

| Data Type | Processing Method | Retention Policy | Storage Location |
|:---|:---|:---|:---|
| **Text Messages & SMS** | Ephemeral inference via Groq LPU / Gemini. | Transient; discarded post-scan unless saved by user. | Client-side memory & user-owned `scans` table. |
| **Hyperlinks & URLs** | Domain decomposition & SHA-256 hash checking. | Domain hash retained if verified malicious. | `public_blocklist` / `threat_indicators`. |
| **Uploaded Screenshots** | OCR visual extraction via Gemini Vision. | Ephemeral; optional encrypted evidence upload. | Supabase `evidence` bucket (user-managed). |
| **Voice & Audio Streams** | In-memory 512-point FFT & Whisper transcription. | **Zero retention.** Immediately discarded from RAM. | Volatile Serverless Memory only. |
| **Community Threat Reports** | Voluntary submission for syndicate awareness. | Retained anonymously for community telemetry. | `threat_indicators` & `reports`. |
| **User Account Credentials** | Managed via Supabase Auth (Argon2 / bcrypt). | Maintained until account termination. | Supabase Auth internal tables. |

---

## 3. Operator Data Sovereignty & 1-Click Purge

GhostNet gives users sovereign control over their inspection footprint:

* **1-Click Audit Purge:** Located inside the **Privacy Sovereignty Center** (`/PrivacyCenter`).
* With a single click, an authenticated user executes a cascading hard-delete across all private records in `scans` and `reports` referencing their `auth.uid()`.
* **Guest / Judge Mode Immunity:** Operators evaluating the platform in Guest Demo Mode generate zero permanent server-side database records. All state is maintained purely in transient browser memory.

---

## 4. International Regulatory Compliance

GhostNet AI's privacy architecture aligns with global data protection frameworks:
* **GDPR (European Union):** Adheres to Article 5 (Data Minimization & Storage Limitation) and Article 17 (Right to Erasure / "Right to be Forgotten").
* **DPDP Act (Digital Personal Data Protection Act, India):** Treats personal identifiers with strict purpose-limitation, ensuring no processing occurs outside the explicit scope of scam threat detection requested by the data principal.
* **California Consumer Privacy Act (CCPA):** GhostNet does not sell or share personal consumer data.
