import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center px-6">
        
        {/* Logo Container */}
        <div className="w-64 max-w-[280px] rounded-3xl overflow-hidden border-2 border-cyan-400/40 shadow-[0_0_50px_rgba(0,229,255,0.3)] bg-white p-3 flex items-center justify-center">
          <img src="/logo-with-text.svg" alt="TrustBreak AI Logo" className="w-full h-auto object-contain rounded-2xl" />
        </div>

        {/* Subtle Loading Pulse */}
        <div className="flex items-center gap-1.5 pt-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono text-slate-400">Initializing Security Layer...</span>
        </div>
      </motion.div>
    </div>
  );
}
