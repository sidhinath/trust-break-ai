import React, { useState } from "react";
import { Phone, ShieldAlert, X, AlertTriangle, ArrowRight, CheckCircle2, Lock, ExternalLink } from "lucide-react";
import VoiceAssistance from "./VoiceAssistance";
import { triggerHaptic } from "@/lib/haptics";

/**
 * EmergencyGuidanceModal Component
 * 100% Offline Emergency Scam Guidance for Senior Users.
 * Theme-aware high contrast styling for crisp readability in Light & Dark mode.
 * Robust 100% touch hit target registration for mobile & WebViews.
 */
export default function EmergencyGuidanceModal({ isOpen, onClose }) {
  const [selectedScenario, setSelectedScenario] = useState("money");

  if (!isOpen) return null;

  const scenarios = [
    {
      id: "money",
      title: "💸 I Transferred Money to a Scammer",
      color: "border-2 border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100",
      steps: [
        "📞 CALL 1930 IMMEDIATELY: Dial the National Cyber Crime Helpline at 1930 (India) within 1-2 hours to freeze stolen money in transit.",
        "🏦 CALL YOUR BANK: Ask your bank customer care to immediately freeze your netbanking and debit/credit cards.",
        "🌐 FILE ONLINE REPORT: Report the transaction details on https://cybercrime.gov.in with transaction ID / UTR number.",
        "🛑 DO NOT PAY AGAIN: Scammers will promise to refund your money if you pay more fee. It is a lie. Never send another rupee."
      ]
    },
    {
      id: "otp",
      title: "🔑 I Shared an OTP or Password",
      color: "border-2 border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100",
      steps: [
        "🔐 CHANGE PASSWORDS: Immediately log in to your official banking app and change your login and transaction passwords.",
        "💳 FREEZE CARDS: Temporarily block your debit/credit cards using your official banking app or customer care.",
        "📱 CHECK SMS: Look at your recent SMS messages to confirm if any money was debited without your permission."
      ]
    },
    {
      id: "app",
      title: "📲 I Installed a Suspicious App",
      color: "border-2 border-purple-500/40 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100",
      steps: [
        "✈️ TURN ON AIRPLANE MODE: Turn on Airplane Mode immediately to disconnect the scammer from viewing your screen.",
        "🗑️ UNINSTALL THE APP: Look for apps named AnyDesk, TeamViewer, QuickSupport, or downloaded APKs and tap Uninstall.",
        "⚙️ REVOKE PERMISSIONS: Go to Settings → Accessibility and turn OFF any unknown app permissions."
      ]
    },
    {
      id: "personal",
      title: "👤 I Shared My Aadhaar or PAN Details",
      color: "border-2 border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100",
      steps: [
        "🔒 LOCK AADHAAR BIOMETRICS: Open the official mAadhaar app or resident.uidai.gov.in to lock your Aadhaar biometrics.",
        "📊 CHECK CREDIT SCORE: Check your CIBIL or Experian credit report to verify no unauthorized loans were opened in your name.",
        "⚠️ BE ALERT: Watch out for future fake calls claiming to be police, tax officers, or courier agents."
      ]
    },
    {
      id: "extortion",
      title: "⚠️ Someone Is Threatening or Blackmailing Me",
      color: "border-2 border-red-600/40 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100",
      steps: [
        "🛑 DO NOT PANIC: Police and judges NEVER conduct 'Digital Arrests' over WhatsApp or Skype video calls.",
        "🔇 HANG UP IMMEDIATELY: Disconnect the call. Do not answer again.",
        "👨‍👩‍👧 TELL A TRUSTED FAMILY MEMBER: Share the details with a family member or local police station immediately."
      ]
    }
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];
  const speechText = `Emergency Scam Guidance for ${currentScenario.title}. ${currentScenario.steps.join(". ")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border-2 border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--ghost-surface)', color: 'var(--ghost-text)' }}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--ghost-border)' }}>
          <div className="flex items-center gap-3 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 pointer-events-none">
              <ShieldAlert className="w-7 h-7 pointer-events-none" />
            </div>
            <div className="pointer-events-none">
              <h2 className="text-lg sm:text-xl font-black font-display tracking-tight text-rose-600 dark:text-rose-400 pointer-events-none">
                EMERGENCY SCAM HELP & GUIDE
              </h2>
              <p className="text-xs font-bold pointer-events-none" style={{ color: 'var(--ghost-text-dim)' }}>100% Offline Emergency Action Playbook</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await triggerHaptic("light");
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* National Helpline Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 pointer-events-none">
            <Phone className="w-8 h-8 animate-bounce shrink-0 text-white pointer-events-none" />
            <div className="pointer-events-none">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100 pointer-events-none">National Cyber Crime Helpline (India)</div>
              <div className="text-2xl font-black font-mono tracking-tight text-white pointer-events-none">DIAL 1930</div>
            </div>
          </div>
          <a
            href="tel:1930"
            onClick={() => triggerHaptic("heavy")}
            className="h-12 px-6 rounded-xl bg-white text-rose-700 font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-50 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation"
          >
            <Phone className="w-4 h-4 fill-current pointer-events-none" />
            <span className="pointer-events-none">Call 1930 Now</span>
          </a>
        </div>

        {/* Voice Assistance */}
        <VoiceAssistance textToRead={speechText} title="🔊 Listen to Emergency Instructions" />

        {/* Scenario Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest pointer-events-none" style={{ color: 'var(--ghost-text-dim)' }}>Select What Happened:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={async () => {
                  await triggerHaptic("light");
                  setSelectedScenario(s.id);
                }}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer touch-manipulation ${
                  selectedScenario === s.id
                    ? "border-2 border-cyan-500 bg-cyan-500/15 dark:bg-cyan-950/60 text-cyan-950 dark:text-cyan-200 font-black shadow-md ring-2 ring-cyan-500/30"
                    : "border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:border-cyan-500 text-slate-900 dark:text-slate-100"
                }`}
              >
                <span className="pointer-events-none">{s.title}</span>
                {selectedScenario === s.id && <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 pointer-events-none" />}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Action Steps */}
        <div className={`p-4 sm:p-5 rounded-2xl ${currentScenario.color} space-y-3`}>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2 pointer-events-none">
            <Lock className="w-5 h-5 pointer-events-none" />
            <span className="pointer-events-none">Recommended Action Steps:</span>
          </h3>
          <ol className="space-y-2 text-xs sm:text-sm font-semibold pointer-events-none">
            {currentScenario.steps.map((step, idx) => (
              <li key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold leading-relaxed shadow-sm pointer-events-none">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              await triggerHaptic("light");
              onClose();
            }}
            className="h-12 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer touch-manipulation"
          >
            <span className="pointer-events-none">Close Help Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
}
