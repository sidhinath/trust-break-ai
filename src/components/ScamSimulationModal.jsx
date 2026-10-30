import React, { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle, X, ShieldAlert, Award, ArrowRight } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import VoiceAssistance from "./VoiceAssistance";

/**
 * ScamSimulationModal Component
 * Interactive educational module: "Can You Spot the Scam?"
 * Provides 3 real-world interactive scenarios to help seniors practice identifying scams.
 * Enhanced with touch-manipulation and pointer-events-none for 100% surface touch target registration.
 */
export default function ScamSimulationModal({ isOpen, onClose }) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null); // 'scam' | 'safe'
  const [score, setScore] = useState(0);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 1,
      title: "Scenario 1: Electricity Disconnection SMS",
      content: "DEAR CUSTOMER: YOUR ELECTRICITY POWER CUT WILL HAPPEN TONIGHT AT 9:30 PM DUE TO UNPAID BILL. IMMEDIATELY CALL ELECTRICITY OFFICER AT 98765-43210.",
      correctAnswer: "scam",
      explanation: "THIS IS A SCAM! Official power utility companies send official bill notices on paper or standard portals, never asking you to call a personal mobile number to stop immediate power cut."
    },
    {
      id: 2,
      title: "Scenario 2: Urgency Bank Phone Call for OTP",
      content: "Hello, I am calling from State Bank Head Office. Someone tried to withdraw Rs 50,000 from your account. Read me the 6-digit OTP code sent to your phone right now to block the hacker!",
      correctAnswer: "scam",
      explanation: "THIS IS A SCAM! Bank employees NEVER call asking for your OTP code. The OTP is what allows the scammer to complete the fraudulent transaction."
    },
    {
      id: 3,
      title: "Scenario 3: India Post Official Delivery SMS",
      content: "Your India Post speed post parcel status: Out for delivery today. Track on official portal https://www.indiapost.gov.in using tracking number IN89765432.",
      correctAnswer: "safe",
      explanation: "THIS IS LEGITIMATE! The link goes to official government domain indiapost.gov.in, and it does not ask for money or secret OTP codes."
    }
  ];

  const currentScenario = scenarios[currentScenarioIndex];

  const handleAnswer = async (answer) => {
    await triggerHaptic(answer === currentScenario.correctAnswer ? "medium" : "heavy");
    setUserAnswer(answer);
    if (answer === currentScenario.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    await triggerHaptic("light");
    setUserAnswer(null);
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex((prev) => prev + 1);
    } else {
      setCurrentScenarioIndex(0);
    }
  };

  const speechText = `Can You Spot the Scam practice scenario. ${currentScenario.title}. Content reads: ${currentScenario.content}. Is this a scam or safe?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl border-2 border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--ghost-surface)', color: 'var(--ghost-text)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--ghost-border)' }}>
          <div className="flex items-center gap-2.5 pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-500 pointer-events-none">
              <Award className="w-5 h-5 pointer-events-none" />
            </div>
            <div className="pointer-events-none">
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight font-display pointer-events-none">
                CAN YOU SPOT THE SCAM?
              </h3>
              <p className="text-xs font-bold pointer-events-none" style={{ color: 'var(--ghost-text-dim)' }}>
                Interactive Practice ({currentScenarioIndex + 1} of {scenarios.length})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await triggerHaptic("light");
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Voice Assistance */}
        <VoiceAssistance textToRead={speechText} title="🔊 Listen to Scenario" />

        {/* Scenario Display Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-2 pointer-events-none">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 pointer-events-none">{currentScenario.title}</span>
          <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-slate-100 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm pointer-events-none">
            "{currentScenario.content}"
          </p>
        </div>

        {/* User Choice Buttons */}
        {userAnswer === null ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAnswer("scam")}
              className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <ShieldAlert className="w-5 h-5 pointer-events-none" />
              <span className="pointer-events-none">IT'S A SCAM!</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer("safe")}
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <CheckCircle2 className="w-5 h-5 pointer-events-none" />
              <span className="pointer-events-none">IT'S SAFE</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feedback Box */}
            <div
              className={`p-4 rounded-2xl border space-y-2 pointer-events-none ${
                userAnswer === currentScenario.correctAnswer
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-bold"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200 font-bold"
              }`}
            >
              <div className="flex items-center gap-2 font-extrabold text-base pointer-events-none">
                {userAnswer === currentScenario.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 pointer-events-none" />
                    <span className="pointer-events-none">CORRECT! GREAT JOB!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 pointer-events-none" />
                    <span className="pointer-events-none">INCORRECT — BE CAREFUL!</span>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed pointer-events-none">{currentScenario.explanation}</p>
            </div>

            {/* Next Scenario Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer touch-manipulation"
            >
              <span className="pointer-events-none">{currentScenarioIndex < scenarios.length - 1 ? "Try Next Scenario" : "Finish Practice"}</span>
              <ArrowRight className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
