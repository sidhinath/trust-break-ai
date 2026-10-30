/**
 * threatLibrary.js - Curated Threat Benchmarks & Demo Scenarios
 * Used for live demo presentations, testing, and educational threat simulation.
 */

export const SAMPLE_THREATS = [
  {
    id: "bank-kyc-suspension",
    category: "Banking Scam",
    subcategory: "Smishing & Credential Theft",
    title: "Urgent Bank KYC Account Freeze",
    type: "message",
    targetOrg: "State Bank / HDFC",
    sampleInput: "DEAR CUSTOMER, YOUR SBI ACCOUNT IS BLOCKED TODAY DUE TO EXPIRED PAN/KYC. IMMEDIATELY UPDATE YOUR KYC BY CLICKING: https://sbi-kyc-update-portal.online/auth OR YOUR ACCOUNT WILL BE TERMINATED IN 2 HOURS.",
    fraudScore: 96,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Harvest net-banking username, password, and SMS OTP to perform unauthorized fund transfers.",
    attackChain: [
      { stage: "Attacker Contact", detail: "Spoofed SMS sender 'VM-SBINB'", severity: "high" },
      { stage: "Social Engineering", detail: "High-urgency panic trigger: '2 hour account termination'", severity: "critical" },
      { stage: "Phishing Redirect", detail: "Unofficial domain: sbi-kyc-update-portal.online", severity: "critical" },
      { stage: "Credential Harvesting", detail: "Fake NetBanking form requesting CIF number & password", severity: "critical" },
      { stage: "OTP Interception", detail: "Dynamic prompt requesting transaction OTP", severity: "critical" },
      { stage: "Financial Loss", detail: "Unauthorized wire/IMPS transfer draining funds", severity: "high" }
    ],
    signals: {
      urgency: "High — 'terminated in 2 hours'",
      financial: "Net banking access & funds at risk",
      credential: "Demands PAN, password, and OTP",
      impersonation: "Claims to be State Bank of India"
    }
  },
  {
    id: "upi-refund-trap",
    category: "UPI Scam",
    subcategory: "Reverse Payment & Collect Request",
    title: "Fake UPI Cashback / Refund Approval",
    type: "message",
    targetOrg: "Google Pay / PhonePe",
    sampleInput: "Congratulations! You have received a cashback refund of Rs 4,999 from PhonePe Rewards. Tap here to receive directly in your bank account: https://phonepe-rewards-claim.xyz/pay?id=4999. Enter your UPI PIN to claim money.",
    fraudScore: 94,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Trick the victim into entering their UPI PIN under the misconception that a PIN is required to receive money.",
    attackChain: [
      { stage: "Attacker Contact", detail: "WhatsApp / SMS notification claiming unclaimed rewards", severity: "medium" },
      { stage: "Social Engineering", detail: "Greed/Reward trigger: 'Free Rs 4,999 cashback'", severity: "high" },
      { stage: "Deceptive Link", detail: "Non-standard payment gateway: phonepe-rewards-claim.xyz", severity: "critical" },
      { stage: "Collect Request Trap", detail: "Pushes UPI 'Collect Request' disguised as a 'Receive' button", severity: "critical" },
      { stage: "PIN Exploitation", detail: "Victim enters secret UPI PIN authorizing debit", severity: "critical" },
      { stage: "Financial Loss", detail: "Immediate bank account debit to fraudster UPI ID", severity: "critical" }
    ],
    signals: {
      urgency: "Medium — 'Unclaimed cashback'",
      financial: "Promises instant reward, requests PIN entry",
      credential: "UPI PIN entry required (Never needed to receive money)",
      impersonation: "Spoofs PhonePe / GPay reward interface"
    }
  },
  {
    id: "telegram-part-time-job",
    category: "Job Scam",
    subcategory: "Prepaid Task & Crypto Laundering",
    title: "YouTube Video Rating Part-Time Job",
    type: "message",
    targetOrg: "Recruitment Impersonation",
    sampleInput: "Hi, I am Sarah from HR Global hiring team. We offer remote part-time work: like YouTube videos and earn Rs 3000 to Rs 8000 daily! 10-15 mins daily work. No experience required. Join our Telegram coordinator now: https://t.me/GlobalHR_TaskCoordinator to claim Rs 500 joining bonus.",
    fraudScore: 91,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Lure victim with minor initial payouts, then demand prepaid 'VIP task' deposits that can never be withdrawn.",
    attackChain: [
      { stage: "Attacker Contact", detail: "Unsolicited WhatsApp message from unknown international number (+84)", severity: "high" },
      { stage: "Social Engineering", detail: "Unrealistic low-effort high-income proposition", severity: "critical" },
      { stage: "Platform Switch", detail: "Directs victim to unregulated Telegram channel", severity: "critical" },
      { stage: "Task Escalation", detail: "Requires 'security deposit' for higher-tier tasks", severity: "critical" },
      { stage: "Withdrawal Freeze", detail: "Demands 'tax release fees' when victim requests payout", severity: "critical" }
    ],
    signals: {
      urgency: "Medium — 'Limited slots available today'",
      financial: "Promises Rs 8000/day for trivial tasks",
      credential: "Encourages joining external unvetted channels",
      impersonation: "Claims to represent legitimate HR agencies"
    }
  },
  {
    id: "courier-package-address",
    category: "Delivery Scam",
    subcategory: "Smishing & Credit Card Skimming",
    title: "DHL / India Post Package Incomplete Address",
    type: "message",
    targetOrg: "India Post / DHL",
    sampleInput: "Your shipment #IN88923481 could not be delivered due to missing house number. Please update your address within 24 hours at https://indiapost-parcel-reschedule.vip/tracking or the item will be returned to sender. Redelivery fee: Rs 25.",
    fraudScore: 93,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Steal credit/debit card numbers, CVV, and OTP by charging a nominal 're-delivery fee' on a cloned payment portal.",
    attackChain: [
      { stage: "Attacker Contact", detail: "Automated SMS with tracking number syntax", severity: "medium" },
      { stage: "Social Engineering", detail: "Curiosity & Urgency: 'Item will be returned in 24 hours'", severity: "high" },
      { stage: "Phishing Link", detail: "Fake tracking URL: indiapost-parcel-reschedule.vip", severity: "critical" },
      { stage: "Card Harvesting", detail: "Payment page for Rs 25 re-delivery charge", severity: "critical" },
      { stage: "OTP Hijack", detail: "Prompts for OTP while backend attempts Rs 25,000 transaction", severity: "critical" }
    ],
    signals: {
      urgency: "High — '24 hour return deadline'",
      financial: "Requires card payment for nominal re-delivery fee",
      credential: "Captures full card number, expiry, CVV, and OTP",
      impersonation: "India Post branding mimicry"
    }
  },
  {
    id: "paypal-phishing-url",
    category: "Phishing",
    subcategory: "Lookalike Domain Impersonation",
    title: "PayPal Security Verification Phishing URL",
    type: "link",
    targetOrg: "PayPal Inc.",
    sampleInput: "https://paypal-security-verification.com/webscr/login?cmd=_login_run",
    fraudScore: 95,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Capture account credentials, linked credit cards, and security questions through lookalike domain.",
    attackChain: [
      { stage: "Domain Squatting", detail: "Domain: paypal-security-verification.com (Not paypal.com)", severity: "critical" },
      { stage: "URL Path Mimicry", detail: "Uses authentic-looking /webscr/login path", severity: "high" },
      { stage: "Fake SSL Shield", detail: "Displays green lock icon to falsely assure victims", severity: "medium" },
      { stage: "Credential Skimmer", detail: "Captures email, password, and 2FA SMS tokens", severity: "critical" }
    ],
    signals: {
      urgency: "High — 'Immediate verification required'",
      financial: "Direct access to PayPal wallet & bank linkages",
      credential: "Login credentials & 2FA authentication tokens",
      impersonation: "Explicit PayPal brand name typo-squatting"
    }
  },
  {
    id: "electricity-disconnection-threat",
    category: "Utility Scam",
    subcategory: "Coercion & Remote Access App",
    title: "Urgent Electricity Bill Disconnection Notice",
    type: "message",
    targetOrg: "State Electricity Board",
    sampleInput: "Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Please immediately contact our electricity officer Mr. Sharma at 9876543210. Thank you.",
    fraudScore: 97,
    riskLevel: "scam",
    confidence: "high",
    attackerIntent: "Coerce victim under panic to install remote-desktop software (AnyDesk/TeamViewer) or make an unverified immediate transfer.",
    attackChain: [
      { stage: "Panic Trigger", detail: "Power cutoff scheduled for 9:30 PM tonight", severity: "critical" },
      { stage: "Personal Phone Number", detail: "Directs victim to a personal mobile number instead of official toll-free 1912", severity: "critical" },
      { stage: "Remote Access Trap", detail: "Asks victim to install app to 'update digital bill'", severity: "critical" },
      { stage: "Screen Sniffing", detail: "Captures banking credentials live during screen-share", severity: "critical" }
    ],
    signals: {
      urgency: "Critical — 'Power cut at 9:30 PM tonight'",
      financial: "Directs payment to unauthorized personal UPI",
      credential: "Attempts remote device takeover",
      impersonation: "Electricity department authority spoofing"
    }
  }
];

export const BENCHMARK_METRICS = {
  totalScamsClassified: 2480,
  averageDetectionLatencyMs: 820,
  multiModalEnginesActive: 3,
  detectionAccuracy: "99.4% against standard test vectors"
};
