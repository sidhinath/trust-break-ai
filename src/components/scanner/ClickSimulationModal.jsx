import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Eye, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClickSimulationModal({ isOpen, onClose, url = "", steps = [], riskLevel = "safe" }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const isSafeMode = riskLevel === "safe" || (steps.length > 0 && steps.every((s) => s.safe === true));

  const defaultThreatSteps = [
    {
      step: 1,
      title: "1. Victim Clicks Hyperlink",
      description: "User navigates to the external domain outside trusted application sandboxes.",
      warning: "Initial session headers & device IP transmitted to hostile server.",
      safe: false,
    },
    {
      step: 2,
      title: "2. Clone / Spoofed Portal Renders",
      description: "A visually identical replica of the target banking or service portal is served.",
      warning: "Fake SSL badge or homograph URL tricks the user into feeling safe.",
      safe: false,
    },
    {
      step: 3,
      title: "3. Credential & Data Capture",
      description: "User types username, password, or card details into unverified input fields.",
      warning: "Keyloggers or backend API immediately logs plaintext credentials into fraudster database.",
      safe: false,
    },
    {
      step: 4,
      title: "4. OTP Interception & Account Hijack",
      description: "Attacker triggers real transaction on official bank while phishing portal asks victim for live SMS OTP.",
      warning: "Immediate unauthorized fund debit or permanent account takeover.",
      safe: false,
    },
  ];

  const defaultSafeSteps = [
    {
      step: 1,
      title: "1. User Navigates to Link",
      description: "Browser connects securely to verified hostname over encrypted HTTPS.",
      warning: "Authentic domain identity — no DNS cloaking, typosquatting, or IP spoofing detected.",
      safe: true,
    },
    {
      step: 2,
      title: "2. Legitimate Server Responds",
      description: "The official web application server responds with valid signed TLS certificates.",
      warning: "No spoofed clone portal or homograph URL redirect present.",
      safe: true,
    },
    {
      step: 3,
      title: "3. Encrypted Data Protection",
      description: "Session parameters and data transmission remain protected inside standard browser sandboxes.",
      warning: "Standard end-to-end TLS encryption protects your connection against third-party eavesdropping.",
      safe: true,
    },
    {
      step: 4,
      title: "4. Safe Connection Verified",
      description: "Domain reputation checks pass with zero community threat flags.",
      warning: "Safe link destination. Always confirm URL spelling in the browser address bar before signing in.",
      safe: true,
    },
  ];

  const activeSteps = steps.length > 0 ? steps : isSafeMode ? defaultSafeSteps : defaultThreatSteps;
  const currentStepData = activeSteps[currentStep] || activeSteps[0];
  const isStepSafe = Boolean(currentStepData.safe) || isSafeMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`ghost-card w-full max-w-xl p-6 relative overflow-hidden space-y-5 ${
          isSafeMode ? 'border-emerald-500/30' : 'border-cyan-500/30'
        }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: "var(--ghost-border)" }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isSafeMode ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-amber-500/15 border-amber-500/30'
            }`}>
              {isSafeMode ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Eye className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--ghost-text)' }}>
                {isSafeMode ? '"What Happens If I Click?" Safe Walkthrough' : '"What Happens If I Click?" Safe Simulator'}
              </h2>
              <p className="text-xs" style={{ color: "var(--ghost-text-dim)" }}>
                {isSafeMode
                  ? "Zero-execution educational walkthrough of authentic domain security"
                  : "Zero-execution educational walkthrough of the phishing trap"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-500/20 transition-colors"
            style={{ color: 'var(--ghost-text-dim)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Inspected banner */}
        {url && (
          <div className="p-2.5 rounded-lg font-mono text-xs truncate"
            style={{ background: "var(--ghost-surface-2)", border: "1px solid var(--ghost-border)", color: isSafeMode ? "var(--ghost-green)" : "var(--ghost-neon)" }}>
            Target: {url}
          </div>
        )}

        {/* Step Progression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ghost-text-dim)" }}>
              {isSafeMode ? "Security Phase" : "Threat Phase"} {currentStep + 1} of {activeSteps.length}
            </span>
            <div className="flex gap-1.5">
              {activeSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStep
                      ? isSafeMode ? 'w-6 bg-emerald-500' : 'w-6 bg-cyan-500'
                      : 'w-2 bg-slate-400/40'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 rounded-xl border space-y-3"
              style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
              <h4 className="text-sm font-bold" style={{ color: 'var(--ghost-text)' }}>
                {currentStepData.title}
              </h4>
              <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
                {currentStepData.description}
              </p>
              <div className={`p-2.5 rounded-lg flex items-start gap-2 border ${
                isStepSafe
                  ? 'bg-emerald-500/10 border-emerald-500/25'
                  : 'bg-rose-500/10 border-rose-500/25'
              }`}>
                {isStepSafe ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
                )}
                <span className={`text-[11px] font-semibold ${
                  isStepSafe ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                }`}>
                  {currentStepData.warning}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--ghost-border)" }}>
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="text-xs font-semibold">
            Previous Stage
          </Button>

          {currentStep < activeSteps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`text-xs font-bold text-slate-950 px-4 h-9 rounded-lg ${
                isSafeMode ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-cyan-500 hover:bg-cyan-400'
              }`}>
              Next Stage <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 h-9 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finish Walkthrough
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
