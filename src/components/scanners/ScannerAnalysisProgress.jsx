import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScannerAnalysisProgress({ isAnalyzing, title = "Multi-Modal Inspection Active" }) {
  const [stage, setStage] = useState(0);

  const steps = [
    "Input payload & parameters validated",
    "Extracting heuristics & social engineering signals",
    "Cross-referencing global threat feed telemetry",
    "Synthesizing Groq LPU & Gemini verdict"
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setStage(0);
      return;
    }

    const interval = setInterval(() => {
      setStage((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Threat Analysis in Progress"
      className="ghost-card p-6 space-y-4 border-cyan-500/40 bg-slate-950/80 shadow-[0_0_25px_rgba(0,229,255,0.15)] animate-pulse">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--ghost-border)' }}>
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <h3 className="text-sm font-bold text-cyan-400 font-display">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          STAGE {stage + 1} OF 4
        </span>
      </div>

      <div className="space-y-3 py-1">
        {steps.map((stepText, idx) => {
          const isDone = idx < stage;
          const isCurrent = idx === stage;

          return (
            <div key={idx} className="flex items-center gap-3 text-xs">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className={`font-mono transition-colors ${
                isDone ? "text-emerald-300" : isCurrent ? "text-cyan-200 font-bold" : "text-slate-500"
              }`}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <p className="text-[11px] font-mono text-slate-400 text-center animate-pulse">
          Running deep zero-shot pattern analysis...
        </p>
      </div>
    </div>
  );
}
