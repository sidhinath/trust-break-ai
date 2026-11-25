import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Award, Users, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/lib/haptics";
import SeniorModeToggleSwitch from "./SeniorModeToggleSwitch";
import VoiceAssistance from "./VoiceAssistance";
import EmergencyGuidanceModal from "./EmergencyGuidanceModal";
import ScamSimulationModal from "./ScamSimulationModal";
import TrustedContactModal from "./TrustedContactModal";

/**
 * SeniorHomeView Component
 * Dedicated Senior & Family Safety Mode Home Screen.
 * Full-width 60/40 Bento scanner + 3-step visual safety guide, paired with an aligned 3-column support row.
 */
export default function SeniorHomeView() {
  const navigate = useNavigate();
  const [seniorInput, setSeniorInput] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showTrustedContactModal, setShowTrustedContactModal] = useState(false);

  const homeSpeechText = `
    Welcome to TrustBreak AI Senior Mode.
    Paste any suspicious message or link into the big box, then tap Paste and Check.
    Or tap Check Screenshot or QR to scan a photo.
    If you already sent money or shared an OTP, tap Emergency Call 1930 right away.
  `.trim();

  const routeContentToScanner = (rawText) => {
    const trimmed = (rawText || "").trim();
    if (!trimmed) {
      navigate(createPageUrl("MessageScanner"));
      return;
    }
    const isUrl = /^(https?:\/\/|www\.)/i.test(trimmed);
    navigate(createPageUrl(isUrl ? "LinkScanner" : "MessageScanner"), {
      state: { sharedContent: trimmed },
    });
  };

  const handlePasteAndCheck = async () => {
    await triggerHaptic("medium");
    if (seniorInput.trim()) {
      routeContentToScanner(seniorInput);
      return;
    }
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setSeniorInput(clipText.trim());
          routeContentToScanner(clipText);
          return;
        }
      }
    } catch {
      // Clipboard permission denied or unavailable — fall back to MessageScanner
    }
    navigate(createPageUrl("MessageScanner"));
  };

  const handleScreenshotCheck = async () => {
    await triggerHaptic("medium");
    navigate(createPageUrl("ScreenshotScanner"));
  };

  const safetySteps = [
    {
      num: "1",
      title: "Copy or Screenshot",
      desc: "any suspicious SMS, WhatsApp message, or link.",
    },
    {
      num: "2",
      title: 'Tap "Paste & Check"',
      desc: "to let AI check for fraud in seconds.",
    },
    {
      num: "3",
      title: "Ask Family or Call 1930",
      desc: "before sending money or sharing an OTP.",
    },
  ];

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Prominent Active Mode Large Toggle Switch Banner */}
      <SeniorModeToggleSwitch variant="large" className="w-full" />

      {/* Voice Assistance Bar */}
      <VoiceAssistance textToRead={homeSpeechText} title="🔊 Voice Guide for Home Screen" />

      {/* Top Full-Width 2-Column Bento Section (60% Left / 40% Right on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] gap-4 items-stretch w-full">
        {/* Left Column (60%) — Main Scanner Card */}
        <div className="bg-white dark:bg-[#0d1424] border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-sm dark:shadow-[0_0_30px_rgba(16,185,129,0.08)]">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Easy Scam Checker
            </span>

            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-950 dark:text-white leading-snug">
              Received a suspicious message, link, or photo?
            </h2>

            <textarea
              value={seniorInput}
              onChange={(e) => setSeniorInput(e.target.value)}
              placeholder="Paste anything here..."
              aria-label="Paste suspicious message or link here"
              rows={4}
              className="w-full min-h-[128px] rounded-xl border border-slate-300 bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/75 p-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePasteAndCheck}
              className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📋 Paste &amp; Check</span>
            </button>

            <button
              type="button"
              onClick={handleScreenshotCheck}
              className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl border-2 border-slate-300 bg-slate-100 hover:border-emerald-400 hover:bg-emerald-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-emerald-500/60 dark:hover:bg-slate-800/80 dark:text-white font-black text-sm sm:text-base transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📷 Check Screenshot / QR</span>
            </button>
          </div>
        </div>

        {/* Right Column (40%) — 3-Step Visual Safety Guide Card */}
        <div className="bg-white dark:bg-[#0d1424]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-slate-950 dark:text-white">
              How to Stay Safe (3 Easy Steps)
            </h3>

            <div className="space-y-3.5">
              {safetySteps.map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/60"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono font-black text-base flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <strong className="font-bold text-slate-950 dark:text-white">
                      {step.title}
                    </strong>{" "}
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl px-3.5 py-2.5">
            Never rush. Real banks and government officials never demand urgent UPI transfers or OTPs.
          </p>
        </div>
      </div>

      {/* Aligned 3-Column Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Card 1: Ask a Family Member */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("light");
            setShowTrustedContactModal(true);
          }}
          className="group p-5 rounded-2xl border border-emerald-500/35 bg-white dark:bg-[#0d1424]/90 hover:border-emerald-400 text-left shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Ask a Family Member
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Share scan findings with your trusted guardian before taking action.
            </p>
          </div>
        </button>

        {/* Card 2: Emergency: Call 1930 */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("heavy");
            setShowEmergencyModal(true);
          }}
          className="group p-5 rounded-2xl border-2 border-rose-500/60 bg-rose-50/60 dark:bg-[#0d1424]/95 hover:border-rose-400 text-left shadow-sm hover:shadow-[0_0_24px_rgba(244,63,94,0.18)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              24/7 Helpline
            </span>
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-rose-700 dark:text-rose-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
              Emergency: Call 1930
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
              Lost money or shared an OTP? Open step-by-step recovery help now.
            </p>
          </div>
        </button>

        {/* Card 3: Simple Scam Quiz */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("light");
            setShowSimulationModal(true);
          }}
          className="group p-5 rounded-2xl border border-amber-500/35 bg-white dark:bg-[#0d1424]/90 hover:border-amber-400 text-left shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Simple Scam Quiz
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Practice spotting fake SMS and fraud calls with easy examples.
            </p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <EmergencyGuidanceModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />
      <ScamSimulationModal isOpen={showSimulationModal} onClose={() => setShowSimulationModal(false)} />
      <TrustedContactModal isOpen={showTrustedContactModal} onClose={() => setShowTrustedContactModal(false)} />
    </div>
  );
}
