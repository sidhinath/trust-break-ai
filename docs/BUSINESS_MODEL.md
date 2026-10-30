# GhostNet AI — Business Model, GTM & Unit Economics

**Document Version:** 1.0.0-prod  
**Status:** Feature-Frozen / Hackathon Release  
**Target Release:** v1.1.0-prod  

---

## 1. Executive Summary

The global fraud detection and consumer cybersecurity market is projected to reach **\$42.4 billion by 2028** (CAGR 18.2%). While traditional antivirus software has experienced margin compression and market saturation, demand for **AI-powered fraud interception** is at an all-time high.

GhostNet AI operates a hybrid **Product-Led Growth (PLG) Freemium B2C** and **B2B Fraud-as-a-Service (FaaS) API** monetization engine. By leveraging ultra-low-cost Groq LPUs (\$0.0001/scan) and client-side digital signal processing (\$0 COGS for audio FFT), GhostNet AI achieves an industry-leading **~90% gross margin** while delivering sub-second protection to end users.

---

## 2. Business Model Canvas (BMC)

```
+----------------------------------------------------------------------------------------------------+
|                                      GHOSTNET AI BUSINESS MODEL CANVAS                             |
+---------------------+---------------------+---------------------+------------------+---------------+
| KEY PARTNERS        | KEY ACTIVITIES      | VALUE PROPOSITION   | CUSTOMER         | CUSTOMER      |
|                     |                     |                     | RELATIONSHIPS    | SEGMENTS      |
| • Groq Inc. (LPU    | • Sub-second AI     | • Sub-second multi- | • Community-led  | 1. Everyday   |
|   hardware infra)   |   model optimization|   modal cyber shield|   trust & safety |    Consumers  |
| • Supabase Cloud    | • Automated threat  | • Privacy-first:    | • Automated zero-| 2. Vulnerable |
| • Google Cloud (AI) |   feed curation     |   zero audio stored |   knowledge ops  |    Seniors &  |
| • Consumer Defense  | • Chrome Extension  | • Proactive browser | • Self-service   |    Families   |
|   NGOs & Telcos     |   & mobile upkeep   |   pre-click blocking|   developer API  | 3. Crypto/Web3|
| • Anti-Phishing     | • Crowd telemetry   | • Explainable 10    |                  |    Traders    |
|   Working Groups    |   governance        |   reason code audit |                  | 4. FinTechs & |
|                     |                     |                     |                  |    Banks (B2B)|
+---------------------+---------------------+---------------------+------------------+---------------+
| KEY RESOURCES       |                     | CHANNELS                               |
|                     |                     |                                        |
| • Proprietary heuristic detection models  | • Responsive Web PWA (Vercel Edge)     |
| • Curated 10-reason-code taxonomy         | • Chrome Web Store (Manifest V3)       |
| • Decentralized Supabase threat database  | • Google Play Store (Capacitor Android)|
| • Developer community & threat reporters  | • Enterprise REST & Webhook APIs       |
+-------------------------------------------+----------------------------------------+
| COST STRUCTURE                            | REVENUE STREAMS                        |
|                                           |                                        |
| • AI Inference: Groq LPUs ($0.00010/scan) | • B2C GhostNet Pro: $4.99/mo or $49/yr |
| • Vision OCR: Gemini Flash ($0.00015/scan)| • B2C Family Pack (5 seats): $9.99/mo  |
| • Supabase PostgreSQL & Edge Compute      | • B2B Fraud API: $0.005/call (Tiered)  |
| • Vercel Edge Serverless Bandwidth        | • Enterprise Browser Shield: $3.50/seat|
| • Developer & Maintenance Operations      | • White-label Telco / Banking SDKs     |
+-------------------------------------------+----------------------------------------+
```

---

## 3. Detailed Unit Economics & Cost of Goods Sold (COGS)

One of GhostNet AI’s greatest competitive moats is its hyper-efficient cost architecture. By offloading heavy acoustic FFT processing to the client's Web Audio API and utilizing Groq LPUs for conversational reasoning, GhostNet AI's marginal cost per scan is negligible.

### 3.1 Per-Scan Infrastructure Breakdown

| Analysis Modality | Primary Engine | Average Latency | Compute Provider | Cost Per 1,000 Scans | Cost Per Single Scan |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **SMS / Text Message** | Groq LPU (`llama-3.3-70b`) | 620 ms | Groq Inc. | \$0.10 | **\$0.000100** |
| **URL / Typosquatting** | Client Heuristic + DB Hash | 120 ms | Local / Supabase | \$0.02 | **\$0.000020** |
| **Screenshot OCR** | Gemini 2.5 Flash + Groq | 950 ms | Google Cloud | \$0.25 | **\$0.000250** |
| **Live Camera QR** | `jsQR` (Client) + URL Engine| 40 ms | Client Device | \$0.02 | **\$0.000020** |
| **Voice Deepfake Audio**| Client FFT + Groq Whisper | 1100 ms | Client / Groq | \$0.15 | **\$0.000150** |
| **Pre-Click DOM Intercept**| Edge Cache (`/api/blocklist`)| 18 ms | Vercel Edge Cache | \$0.01 | **\$0.000010** |

$$\text{Blended Average Cost Per User Scan} \approx \mathbf{\$0.000125}$$

### 3.2 Gross Margin Analysis (GhostNet Pro @ \$4.99/mo)
- **Assumed Usage:** Heavy consumer scans 150 items per month (mix of SMS, URLs, QR, and Voice).
- **Monthly COGS per Pro User:**
  $$150 \text{ scans} \times \$0.000125 = \mathbf{\$0.01875\text{ / month}}$$
- **Payment Processing (Stripe 2.9% + \$0.30):**
  $$(\$4.99 \times 0.029) + \$0.30 = \mathbf{\$0.4447\text{ / month}}$$
- **Net Revenue per User:**
  $$\$4.99 - (\$0.01875 + \$0.4447) = \mathbf{\$4.52655\text{ / month}}$$
- **Gross Profit Margin:**
  $$\text{Gross Margin} = \frac{\$4.52655}{\$4.99} \times 100\% \approx \mathbf{90.7\%}$$

---

## 4. Monetization Tiers & Pricing Strategy

```
+-------------------+     +-------------------+     +-------------------+
|     FREE TIER     |     |   PRO SUITE (B2C) |     | ENTERPRISE / API  |
|      $0 / mo      |     |    $4.99 / mo     |     | $0.005 / request  |
+-------------------+     +-------------------+     +-------------------+
| • 50 scans / day  |     | • Unlimited scans |     | • Low-latency API |
| • SMS & URL scans |     | • Voice Deepfake  |     | • Webhook alerts  |
| • Public intel feed|    | • Camera QR HUD   |     | • Custom models   |
| • Heuristic engine|     | • Browser Shield  |     | • SOC2 compliance |
| • Community alerts|     | • Family 5-pack   |     | • Dedicated SLA   |
+-------------------+     +-------------------+     +-------------------+
```

### 4.1 B2C Consumer Tiers
1. **GhostNet Free (Community):**
   - Unlimited text & URL scans.
   - Access to Global Threat Intelligence map.
   - Manifest V3 Browser Shield basic blocking.
   - Purpose: Viral acquisition and threat telemetry crowd-sourcing.
2. **GhostNet Pro (\$4.99/month or \$49/year):**
   - Multi-modal Voice Deepfake acoustic analyzer.
   - Real-time Camera QR HUD scanning.
   - Gemini Vision OCR screenshot batch analysis.
   - Family Shield pack (\$9.99/mo for up to 5 protected family members with instant emergency SMS notifications).

### 4.2 B2B Enterprise & FinTech API
1. **GhostNet Fraud-as-a-Service (FaaS) API:**
   - **Target Customers:** Digital banking apps (Revolut, Chime), payment gateways (Stripe, Razorpay), cryptocurrency wallets (Coinbase, MetaMask).
   - **Use Case:** Pre-transaction scanning of payment links, recipient UPI handles, and message text before funds transfer.
   - **Pricing:**
     - Starter: \$199/month (Includes 50,000 requests, \$0.004/overage).
     - Growth: \$699/month (Includes 200,000 requests, \$0.0035/overage).
     - Enterprise: Custom contract with on-premise container deployment.
2. **GhostNet Corporate Browser Shield (\$3.50/seat/month):**
   - Corporate Chrome extension deployment via Google Workspace / MDM.
   - Centralized security operations dashboard with zero employee PII leakage.

---

## 5. Go-To-Market (GTM) Strategy

### Phase 1: Hackathon & Developer Community Launch (Months 1–3)
- **ProductHunt & HackerNews Showcases:** Demonstrate the sub-second Groq LPU speed and acoustic Wiener flatness analysis with interactive live demos.
- **Chrome Web Store Launch:** Organic SEO targeting keywords: *"AI scam detector"*, *"QR code scam checker"*, *"voice deepfake scanner"*.
- **Open-Source Threat Indicators:** Publish sanitized daily CSV/JSON feeds of active scam IOCs to GitHub, building community trust and backlinks.

### Phase 2: Family Protection & Viral Loops (Months 4–8)
- **"Protect Your Parents" Viral Campaign:** Targeted marketing educating adult children on digital arrest and elderly utility scams, offering 1-click family setup.
- **WhatsApp / Telegram Forward Bot:** Lightweight forwarder bot allowing users to forward suspicious messages directly to GhostNet AI for a 2-second reply verdict.

### Phase 3: B2B FinTech Partnerships (Months 9–18)
- **Banking SDK Integration:** Partner with regional neobanks to embed GhostNet's pre-transaction scam detection into payment confirmation screens.
- **Capacitor Mobile Store Expansion:** Native Android and iOS app store feature pushes.

---

## 6. 3-Year Financial & Operational Projections

| Financial Metric | Year 1 | Year 2 | Year 3 |
| :--- | :---: | :---: | :---: |
| **Active Registered Users** | 120,000 | 850,000 | 3,200,000 |
| **B2C Pro Subscribers** (4% conv.) | 4,800 | 38,250 | 160,000 |
| **B2C Subscription ARR** | \$235,000 | \$1,874,000 | \$7,840,000 |
| **B2B API & Enterprise ARR** | \$180,000 | \$1,250,000 | \$5,600,000 |
| **Total Annual Recurring Revenue (ARR)** | **\$415,000** | **\$3,124,000** | **\$13,440,000** |
| **Inference & Cloud Infrastructure COGS** | \$42,000 | \$315,000 | \$1,340,000 |
| **Payment Processing & Ops** | \$37,000 | \$280,000 | \$1,210,000 |
| **Gross Profit** | **\$336,000** | **\$2,529,000** | **\$10,890,000** |
| **Gross Margin %** | **81.0%** | **81.0%** | **81.0%** |

---

## 7. Conclusion

GhostNet AI solves an urgent global crisis with superior technical performance and unmatched unit economics. By converting the low computational cost of specialized LPUs and client-side signal processing into an impenetrable defense network, GhostNet AI offers a highly scalable, venture-backable cyber defense platform with sustainable 80%+ gross margins.
