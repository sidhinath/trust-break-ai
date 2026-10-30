import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Binary, Search, Cpu, Sparkles } from "lucide-react";

export default function ScanningAnimation({ label = "Analyzing threat vectors..." }) {
  const [stage, setStage] = useState(0);

  const stages = [
    { title: "Extracting Content & Structural Tokens", icon: Binary },
    { title: "Analyzing Social Engineering & Urgency Cues", icon: Search },
    { title: "Querying Groq LPU & Gemini Vision Engine", icon: Cpu },
    { title: "Synthesizing Threat Reconstruction Chain", icon: Sparkles },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 750);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = stages[stage]?.icon || Sparkles;

  return (
    <div className="ghost-card p-6 flex flex-col items-center justify-center space-y-4 text-center border-cyan-500/30 overflow-hidden relative">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border border-cyan-400/40 bg-cyan-400/10"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-cyan-400"
        />
        <div className="w-12 h-12 rounded-xl border border-cyan-500/40 flex items-center justify-center z-10"
          style={{ background: 'var(--ghost-surface-2)' }}>
          <CurrentIcon className="w-6 h-6 text-cyan-500 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1 z-10 max-w-sm">
        <h3 className="text-sm font-bold tracking-tight font-display" style={{ color: 'var(--ghost-text)' }}>
          {stages[stage]?.title || label}
        </h3>
        <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
          Running deep heuristic and automated cyber threat verification
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex gap-2 z-10 pt-2">
        {stages.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= stage ? "w-8 bg-cyan-500 shadow-[0_0_8px_rgba(0,229,255,0.6)]" : "w-2 bg-slate-400/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}