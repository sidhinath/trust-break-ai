import React, { useState } from "react";
import { PhoneCall, OctagonAlert, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmergencyActionCard({ riskLevel = "safe", scanData = {} }) {
  const [copiedHelpline, setCopiedHelpline] = useState(false);
  const navigate = useNavigate();

  if (riskLevel === "safe") return null;

  const handlePreFillReport = () => {
    navigate(createPageUrl("ReportScam"), {
      state: {
        prefill: {
          report_type: scanData.scan_type || "message",
          scam_content: scanData.input_content || scanData.text || "",
          url: scanData.url || "",
          fraud_score: scanData.fraud_score || 90,
          ai_analysis: scanData.analysis || scanData.ai_analysis || "",
          risk_level: riskLevel,
          organization: scanData.impersonated_brand || ""
        }
      }
    });
  };

  const handleCopyCyberHelpline = () => {
    navigator.clipboard?.writeText("1930");
    setCopiedHelpline(true);
    setTimeout(() => setCopiedHelpline(false), 2000);
  };

  return (
    <div className="ghost-card p-5 space-y-4 border-rose-500/30">
      <div className="flex items-center justify-between border-b pb-3"
        style={{ borderColor: "var(--ghost-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/15 border border-rose-500/30">
            <OctagonAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--ghost-text)" }}>
              One-Tap Incident Response Protocol
            </h3>
            <p className="text-xs" style={{ color: "var(--ghost-text-dim)" }}>
              Recommended containment steps to avoid financial and credential compromise
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Step 1: STOP */}
        <div className="p-3.5 rounded-xl border flex flex-col justify-between space-y-2"
          style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.25)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                STOP & DISENGAGE
              </h4>
            </div>
            <p className="text-xs font-medium mt-2 leading-relaxed" style={{ color: "var(--ghost-text)" }}>
              Do NOT click links, call telephone numbers inside the message, or share any OTP/UPI PIN.
            </p>
          </div>
        </div>

        {/* Step 2: VERIFY */}
        <div className="p-3.5 rounded-xl border flex flex-col justify-between space-y-2"
          style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                VERIFY AUTHENTICITY
              </h4>
            </div>
            <p className="text-xs font-medium mt-2 leading-relaxed" style={{ color: "var(--ghost-text)" }}>
              Open the authentic mobile app or contact your bank directly via the back of your payment card.
            </p>
          </div>
          <button
            onClick={handleCopyCyberHelpline}
            className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline pt-1">
            <PhoneCall className="w-3 h-3" />
            {copiedHelpline ? "Copied 1930 to clipboard!" : "National Cyber Helpline: 1930"}
          </button>
        </div>

        {/* Step 3: REPORT */}
        <div className="p-3.5 rounded-xl border flex flex-col justify-between space-y-2"
          style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                COMMUNITY WARNING
              </h4>
            </div>
            <p className="text-xs font-medium mt-2 leading-relaxed" style={{ color: "var(--ghost-text)" }}>
              Syndicate this attack pattern to the GhostNet global scam database in one click.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handlePreFillReport}
            className="w-full h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg mt-1">
            <Send className="w-3 h-3 mr-1.5" /> 1-Click Pre-fill Report
          </Button>
        </div>

        {/* Step 4: SECURE */}
        <div className="p-3.5 rounded-xl border flex flex-col justify-between space-y-2"
          style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                SECURE ACCOUNTS
              </h4>
            </div>
            <p className="text-xs font-medium mt-2 leading-relaxed" style={{ color: "var(--ghost-text)" }}>
              If credentials were entered: freeze NetBanking, enable 2FA with an authenticator app, and reset passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
