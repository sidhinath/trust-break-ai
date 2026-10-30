import React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle2, HelpCircle } from "lucide-react";
import VoiceAssistance from "./VoiceAssistance";
import { REASON_CODE_DICT } from "@/lib/reasonCodes";

/**
 * SeniorScanExplanation Component
 * Reusable plain-language scan-result explanation formatted specifically for senior users.
 * Explains:
 * 1. What GhostNet detected
 * 2. Why we flagged it (plain English evidence)
 * 3. What the user should do next (actionable safety advice)
 */
export default function SeniorScanExplanation({ result, rawInput = "", scanType = "message" }) {
  if (!result) return null;

  const riskLevel = result.risk_level || (result.fraud_score >= 70 ? "scam" : result.fraud_score >= 35 ? "suspicious" : "safe");

  let headlineText = "";
  let headlineColorClass = "";
  let icon = null;

  if (riskLevel === "scam") {
    headlineText = "⚠️ WARNING: THIS MAY BE A DANGEROUS SCAM";
    headlineColorClass = "bg-rose-500/15 border-2 border-rose-500/40 text-rose-950 dark:text-rose-200 font-extrabold";
    icon = <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0" />;
  } else if (riskLevel === "suspicious") {
    headlineText = "⚠️ CAUTION: SUSPICIOUS ACTIVITY DETECTED";
    headlineColorClass = "bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 font-extrabold";
    icon = <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />;
  } else {
    headlineText = "✅ SAFE: NO SCAM THREATS FOUND";
    headlineColorClass = "bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-extrabold";
    icon = <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  }

  // Generate plain-language bullet points for "Why We Flagged It"
  const plainWhyBullets = [];

  if (result.reasonCodes && result.reasonCodes.length > 0) {
    result.reasonCodes.forEach((code) => {
      const info = REASON_CODE_DICT[code];
      if (info) {
        if (code === "URGENCY_LANGUAGE") {
          plainWhyBullets.push("The sender is trying to rush you or scare you into acting quickly without thinking.");
        } else if (code === "IMPERSONATES_BRAND") {
          plainWhyBullets.push("This claims to be from an official bank or company, but it comes from an unverified source.");
        } else if (code === "REQUESTS_OTP") {
          plainWhyBullets.push("It asks for a secret password, PIN, or OTP code. Real banks NEVER ask for your OTP.");
        } else if (code === "LOOKALIKE_DOMAIN") {
          plainWhyBullets.push("The web link address looks fake or misspells an official website address.");
        } else if (code === "REQUESTS_PAYMENT") {
          plainWhyBullets.push("It asks you to transfer money, pay dues, or send funds unexpectedly.");
        } else if (code === "FAMILY_IMPERSONATION_RISK") {
          plainWhyBullets.push("It pretends to be a family member in trouble asking for urgent money or secret payments.");
        } else {
          plainWhyBullets.push(`${info.label}: ${info.label.toLowerCase()} detected in content.`);
        }
      }
    });
  }

  // Fallback reasons if no reason codes exist
  if (plainWhyBullets.length === 0) {
    if (result.reasons && result.reasons.length > 0) {
      result.reasons.forEach((r) => plainWhyBullets.push(r));
    } else if (riskLevel === "scam" || riskLevel === "suspicious") {
      plainWhyBullets.push("GhostNet flagged suspicious keywords or links commonly associated with digital fraud.");
    } else {
      plainWhyBullets.push("No suspicious links, OTP requests, or emergency threats were found.");
    }
  }

  // Generate plain-language "What You Should Do Next" steps
  const plainNextSteps = [];
  if (riskLevel === "scam" || riskLevel === "suspicious") {
    plainNextSteps.push("❌ Do NOT click any links in this message.");
    plainNextSteps.push("🔐 NEVER share your OTP, UPI PIN, or bank password with anyone.");
    plainNextSteps.push("📞 If it claims to be your bank, call their official phone number printed on your debit card.");
    plainNextSteps.push("🆘 If you lost money, call the National Cyber Crime Helpline immediately at 1930.");
  } else {
    plainNextSteps.push("✅ This item appears clean and safe to read.");
    plainNextSteps.push("🔒 Remember to always keep your passwords and OTPs private.");
  }

  // Full transcript to read aloud via VoiceAssistance
  const voiceSpeechText = `
    ${headlineText}. 
    What we detected: ${result.analysis || "Analysis complete."}
    Why we flagged it: ${plainWhyBullets.join(". ")}.
    What you should do next: ${plainNextSteps.join(". ")}.
  `.trim();

  return (
    <div className="space-y-4 p-4 sm:p-6 rounded-3xl border-2 border-slate-300 dark:border-slate-800 shadow-xl transition-all"
      style={{ background: 'var(--ghost-surface)', color: 'var(--ghost-text)' }}>
      
      {/* Header Banner */}
      <div className={`p-4 rounded-2xl flex items-center gap-3 ${headlineColorClass}`}>
        {icon}
        <div>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight font-display">{headlineText}</h3>
          <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5">
            {scanType === "message" ? "Message Security Analysis" : scanType === "url" ? "Web Link Analysis" : "Screenshot Visual Analysis"}
          </p>
        </div>
      </div>

      {/* Built-in Voice Assistance Control */}
      <VoiceAssistance textToRead={voiceSpeechText} title="🔊 Read Explanation Aloud" />

      {/* Section 1: What GhostNet Detected */}
      <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 space-y-1.5">
        <h4 className="font-black text-sm sm:text-base flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
          <HelpCircle className="w-4 h-4" />
          <span>What GhostNet Detected</span>
        </h4>
        <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-slate-100">
          {result.analysis || result.ai_analysis || "GhostNet completed scanning your submitted content."}
        </p>
      </div>

      {/* Section 2: Why We Flagged It */}
      <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 space-y-2">
        <h4 className="font-black text-sm sm:text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span>Why We Flagged It</span>
        </h4>
        <ul className="space-y-2 font-bold text-xs sm:text-sm">
          {plainWhyBullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-amber-600 dark:text-amber-400 font-black shrink-0">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 3: What You Should Do Next */}
      <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 space-y-2">
        <h4 className="font-black text-sm sm:text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>What You Should Do Next</span>
        </h4>
        <ul className="space-y-2 font-bold text-xs sm:text-sm">
          {plainNextSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-900 dark:text-slate-100">
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
