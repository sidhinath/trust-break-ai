# TrustBreak AI — User Personas & Customer Journeys

**Document Version:** 1.7.0-prod  
**Status:** Production Verified  
**Target Release:** v1.7.0-prod  

---

## 1. Overview & Methodology

Social engineering attacks succeed because they are psychologically tailored to human emotions: **fear, urgency, greed, and authority**. To build an effective cognitive cyber shield, TrustBreak AI's user experience was mapped across 4 diverse target personas representing the spectrum of digital vulnerability and cybersecurity literacy.

```
                  HIGH TECH LITERACY
                         |
      [Alex Rivera]      |      [Marcus Vance]
      Web3 / DeFi Trader |      SOC Analyst / Hunter
                         |
CONSUMER ----------------+---------------- ENTERPRISE
                         |
      [Margaret Chen]    |      [Priya Sharma]
      Retired Citizen    |      Remote Enterprise PM
                         |
                  LOW TECH LITERACY
```

---

## 2. Deep Persona Profiles & Journey Maps

### Persona 1: Margaret Chen (68) — The Vulnerable Senior Citizen
*“I just want to pay my bills online and talk to my grandchildren without constantly worrying that one wrong click will wipe out my retirement savings.”*

```
+--------------------------------------------------------------------------+
| MARGARET CHEN (68, Retired Elementary School Teacher)                    |
+--------------------------------------------------------------------------+
| Location: Bengaluru, India / Chicago, USA                                |
| Primary Devices: Samsung Galaxy A-series phone, iPad 9th Gen             |
| Tech Literacy: Low-to-Moderate (uses WhatsApp, NetBanking, YouTube)      |
| Financial Exposure: Fixed pension, life savings in primary checking      |
| Target Scam Vectors: Digital arrest calls, electricity disconnection SMS,|
|                      fake bank KYC expiry warnings                       |
+--------------------------------------------------------------------------+
```

#### Key Pain Points & Fears
- Overwhelmed by technical jargon (SSL, DNS, Punycode, hash signatures).
- High anxiety when presented with urgent legal or disconnection threats.
- Hesitant to bother family members every time an unexpected message arrives.

#### Jobs-to-be-Done (JTBD)
*When I receive an alarming message threatening penalties or disconnection, I want an immediate, plain-English answer telling me if it's fake and what to do, so that I can feel safe and protect my life savings without feeling foolish.*

#### User Journey: Margaret's Experience
```mermaid
journey
    title Margaret's Encounter with an Electricity Disconnection Scam
    section Trigger
      Receives urgent SMS at 8 PM claiming power cutoff: 1: Margaret
      Feels panic and considers clicking link: 1: Margaret
    section Intervention
      Remembers TrustBreak AI installed by daughter: 3: Margaret
      Pastes SMS text into TrustBreak Message Scanner: 4: Margaret
    section Resolution
      TrustBreak returns RED SCAM verdict in 620ms: 5: TrustBreak
      Reads plain-English warning of fake utility alert: 5: Margaret
      Follows 1-click checklist to call utility company: 5: Margaret
      Breathing returns to normal and financial loss prevented: 5: Margaret
```

---

### Persona 2: Alex Rivera (24) — The Web3 / Crypto Native
*“I scan dozens of QR codes at crypto conferences and Discord airdrops. One malicious transaction approval or poisoned vanity link, and my MetaMask is completely drained.”*

```
+--------------------------------------------------------------------------+
| ALEX RIVERA (24, DeFi Trader & Smart Contract Developer)                 |
+--------------------------------------------------------------------------+
| Location: Austin, Texas                                                  |
| Primary Devices: MacBook Pro M2, Google Pixel 8 Pro                      |
| Tech Literacy: Very High (codes Solidity/TypeScript, runs full nodes)    |
| Financial Exposure: High cryptocurrency portfolio in cold & hot wallets  |
| Target Scam Vectors: Quishing (QR phishing), homoglyph dApp URLs,        |
|                      Telegram impersonation bots, airdrop drainers       |
+--------------------------------------------------------------------------+
```

#### Key Pain Points & Fears
- Fast-paced trading creates micro-windows of inattention where typosquatted domains get clicked.
- QR codes pasted on physical posters or digital slides hide complex malicious redirect payloads.
- Traditional blocklists take hours to index new crypto drainer contracts and domains.

#### Jobs-to-be-Done (JTBD)
*When I scan a QR code or click an unverified token link, I want real-time pre-click interception and homoglyph decoding, so that I never execute a malicious wallet transaction.*

#### User Journey: Alex's Experience
```mermaid
journey
    title Alex Intercepting a QR Phishing Airdrop
    section Encounter
      Spots a QR code at a DeFi conference booth for token airdrop: 3: Alex
      Opens TrustBreak Live Camera QR Scanner: 4: Alex
    section Real-time Detection
      Camera targets QR matrix at 30 FPS: 5: TrustBreak
      Decodes malicious lookalike URL payload: 5: TrustBreak
      Identifies Cyrillic homoglyphs and Punycode spoofing: 5: TrustBreak
    section Neutralization
      HUD displays SUSPICIOUS_DOMAIN alert: 5: TrustBreak
      Blocks navigation and exposes uniswap spoof: 5: TrustBreak
      Alex avoids signing malicious permit2 signature: 5: Alex
```

---

### Persona 3: Priya Sharma (34) — The Remote Enterprise Lead
*“I received a voice note on WhatsApp from what sounded exactly like our VP of Finance, urgently requesting an expedited vendor payment for an overseas contractor.”*

```
+--------------------------------------------------------------------------+
| PRIYA SHARMA (34, Senior Product Manager at Series B SaaS)              |
+--------------------------------------------------------------------------+
| Location: London, UK                                                     |
| Primary Devices: Dell XPS 15 (Corporate), iPhone 15 Pro                  |
| Tech Literacy: Moderate-to-High (daily SaaS power user, non-coder)      |
| Financial Exposure: Corporate credit card, authorized vendor signatory   |
| Target Scam Vectors: Executive voice cloning, LinkedIn spear phishing,   |
|                      spoofed invoices with PDF exploits                  |
+--------------------------------------------------------------------------+
```

#### Key Pain Points & Fears
- Generative AI voice clones sound indistinguishable from real colleagues over phone or voice notes.
- Intense corporate pressure to maintain business velocity leads to expedited manual wire approvals.
- High reputation risk if company funds are compromised.

#### Jobs-to-be-Done (JTBD)
*When I receive an urgent out-of-band audio message from leadership asking for financial execution, I want instant acoustic and contextual verification without compromising corporate confidentiality.*

#### User Journey: Priya's Experience
```mermaid
journey
    title Priya Verifying an Executive Voice Note
    section Alert
      Receives 12-second voice memo from spoofed executive: 2: Priya
      Voice sounds familiar and requests urgent wire: 2: Priya
    section Verification
      Uploads audio snippet to TrustBreak Voice Analyzer: 4: Priya
      Browser Web Audio API runs FFT Wiener spectral flatness: 5: TrustBreak
      Acoustic anomaly score hits 88 with neural artifacts: 5: TrustBreak
      Groq LPU detects urgency coercion and payment redirect: 5: TrustBreak
    section Defense
      TrustBreak issues 91% Synthetic Voice Fraud Verdict: 5: TrustBreak
      Confirms raw audio is ephemerally wiped from memory: 5: Priya
      Priya escalates to internal security with fraud logged: 5: Priya
```

---

### Persona 4: Marcus Vance (29) — The Community SOC Defender
*“Scammers launch hundreds of regional domain variations every morning. I need a real-time, decentralized telemetry feed to monitor emerging attack patterns and protect my local community.”*

```
+--------------------------------------------------------------------------+
| MARCUS VANCE (29, SOC Analyst & Open Source Security Enthusiast)         |
+--------------------------------------------------------------------------+
| Location: Berlin, Germany                                                |
| Primary Devices: Custom Linux Workstation, ThinkPad X1 Carbon            |
| Tech Literacy: Expert (Threat hunting, SIEM, YARA rules, reverse eng)    |
| Mission: Crowdsource active IOCs to protect vulnerable web users        |
| Activities: Submitting new scam URLs, verifying community reports,       |
|             analyzing global threat intelligence trends                  |
+--------------------------------------------------------------------------+
```

#### Key Pain Points & Fears
- Traditional threat feeds (URLhaus, OpenPhish) have hours of lag and lack conversational context.
- Commercial threat intelligence subscriptions cost \$20k+/year, locking out community defenders.
- Lack of cryptographic verification for reported community threats.

#### Jobs-to-be-Done (JTBD)
*When I discover a new live phishing campaign or phone scam wave, I want to submit sanitized threat indicators with SHA-256 cryptographic fingerprinting, so the entire network receives instant protection.*

#### User Journey: Marcus's Experience
```mermaid
journey
    title Marcus Contributing to Global Threat Intelligence
    section Discovery
      Discovers new tax refund phishing cluster targeting regional taxpayers: 4: Marcus
      Extracts malicious domain and SMS lure template: 4: Marcus
    section Telemetry Sync
      Submits sanitized indicator to TrustBreak Global Threat Intelligence: 5: Marcus
      Supabase validates report and calculates SHA-256 hash: 5: TrustBreak
      Indicator immediately available to edge blocklist: 5: TrustBreak
    section Community Impact
      More than 1400 users protected before next wave: 5: Marcus
```

---

## 3. Cross-Persona UX Principles

1. **Cognitive Clarity Over Technical Noise:**
   - For Margaret: Big, clear color badges (Red/Yellow/Green), voice read-aloud, and 3-step action items.
   - For Alex & Marcus: Collapsible technical drawer showing exact entropy values, Levenshtein edit distance, and SHA-256 hashes.
2. **Zero Shame, 100% Empathy:**
   - TrustBreak AI never blames the user. Language focuses on the *attacker's deception tactics* rather than user gullibility.
3. **Frictionless Accessibility:**
   - 1-click test scenarios pre-populated for instant testing.
   - Guest demo mode allowing complete functional evaluation without login friction.
