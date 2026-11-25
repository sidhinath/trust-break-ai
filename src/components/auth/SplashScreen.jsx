import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b1120] text-[#f8fafc] select-none pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col items-center gap-5 text-center px-6 max-w-sm w-full"
      >
        {/* Logo Container (dark surface so white SVG wordmark has high contrast) */}
        <div className="w-64 max-w-[280px] rounded-3xl overflow-hidden border-2 border-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.25)] bg-slate-900/90 p-3 flex items-center justify-center">
          <img
            src="/logo-with-text.svg"
            alt="TrustBreak AI Logo"
            className="w-full h-auto object-contain rounded-2xl"
          />
        </div>

        {/* Second-stage Brand Title & Tagline Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <h1 className="text-2xl font-black tracking-tight font-display text-white">
            TrustBreak <span className="text-emerald-400">AI Security</span>
          </h1>
          <p className="text-xs font-medium text-slate-300 leading-relaxed">
            Multi-Modal Scam, Phishing &amp; Deepfake Defense
          </p>
        </motion.div>

        {/* Active Status Pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex items-center gap-2 pt-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-semibold text-slate-300">
            Initializing <span className="text-emerald-400">Security</span> Layer...
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
