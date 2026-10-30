import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

export default function OnboardingLanding({ onNext, onGuest }) {
  const handleNext = async () => {
    await triggerHaptic('medium');
    if (onNext) onNext();
  };

  const handleGuest = async () => {
    await triggerHaptic('medium');
    if (onGuest) onGuest();
    else if (onNext) onNext();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-6 relative overflow-hidden select-none font-sans">
      {/* Subtle Soft Background Gradient */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <header className="pt-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-950">
            <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-display text-slate-900">
            TrustBreak AI
          </span>
        </div>
      </header>

      {/* Main Hero Card Content */}
      <main className="my-auto py-8 space-y-8 max-w-md mx-auto w-full relative z-10 text-center">
        
        {/* Animated Brand Shield Hero Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-72 max-w-[300px] mx-auto rounded-3xl bg-white shadow-[0_20px_40px_rgba(37,99,235,0.12)] border border-slate-200/80 p-3 flex items-center justify-center relative group">
          <img src="/logo-with-text.svg" alt="TrustBreak AI Logo with Text" className="w-full h-auto object-contain rounded-2xl" />
        </motion.div>

        {/* Text Pitch */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-slate-900">
            Your Digital Safety Layer
          </h1>
          <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xs mx-auto">
            AI-powered protection for the threats you encounter online before you trust, click, scan, pay or respond.
          </p>
        </motion.div>

        {/* 4 Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {["Scan", "Analyze", "Understand", "Protect"].map((pill, i) => (
            <span
              key={pill}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 shadow-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              {pill}
            </span>
          ))}
        </motion.div>
      </main>

      {/* Footer Primary CTA */}
      <footer className="pb-6 max-w-md mx-auto w-full relative z-10 space-y-3 text-center">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(37,99,235,0.3)] transition-all">
          <span>GET STARTED</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {onGuest && (
          <button
            type="button"
            onClick={handleGuest}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 block mx-auto cursor-pointer">
            Explore as Guest Analyst →
          </button>
        )}
      </footer>
    </div>
  );
}
